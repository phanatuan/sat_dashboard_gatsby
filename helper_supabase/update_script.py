import os
import csv
import tkinter as tk
from tkinter import ttk  # For themed widgets like Combobox
from tkinter import filedialog, messagebox
from supabase import create_client, Client
from dotenv import load_dotenv
import sys
import threading # To run update in background and keep GUI responsive

# --- Configuration ---
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# <<<<<< IMPORTANT: Specify the name of the ID/Primary Key column >>>>>>
# This name must exist BOTH in your Supabase table AND as a header in your CSV
PRIMARY_KEY_COLUMN_NAME = 'id' # Common examples: 'id', 'question_id', 'exam_id'
# --- End Configuration ---

# --- Global Variables ---
supabase_client: Client = None
selected_csv_path = ""


# --- Core Logic ---

def process_updates(table_name, csv_file_path, pk_column_name, status_callback, progress_callback):
    """Reads CSV and updates Supabase table row by row."""
    global supabase_client
    if not supabase_client:
        status_callback("Error: Supabase client not initialized.")
        return

    status_callback(f"Processing updates for table '{table_name}'...")
    rows_to_update = []
    total_processed = 0
    total_updated_successfully = 0
    total_skipped_not_found = 0
    error_count = 0
    pk_column_found = False

    try:
        # Read all rows first to get total count for progress bar
        with open(csv_file_path, mode='r', encoding='utf-8-sig') as csvfile:
            reader_for_count = csv.DictReader(csvfile)
            if pk_column_name not in reader_for_count.fieldnames:
                 status_callback(f"Error: Primary key column '{pk_column_name}' not found in CSV header!")
                 messagebox.showerror("CSV Header Error", f"The specified primary key column '{pk_column_name}' was not found in the header of the selected CSV file.\n\nCSV Headers: {', '.join(reader_for_count.fieldnames)}")
                 return # Stop processing
            pk_column_found = True # Mark as found
            rows_to_update = list(reader_for_count) # Read all rows into memory
            total_rows_in_csv = len(rows_to_update)
            if total_rows_in_csv == 0:
                 status_callback("CSV file is empty. Nothing to process.")
                 return

        progress_callback(0, total_rows_in_csv) # Initialize progress

        # Now iterate through the rows we read
        for i, row_dict in enumerate(rows_to_update):
            total_processed += 1
            update_data = {}
            pk_value = None

            # Prepare data and find PK
            cleaned_row = {}
            for key, value in row_dict.items():
                 # Basic handling for empty strings or 'NULL' -> None
                processed_value = None
                if value != '' and not (isinstance(value, str) and value.upper() == 'NULL'):
                    # --- Add more specific type conversions based on YOUR table schema ---
                    # Example: Convert string 'true'/'false' to Python boolean
                    # if key == 'your_boolean_column' and isinstance(value, str):
                    #     processed_value = value.lower() == 'true'
                    # Example: Convert string number to integer
                    # elif key == 'your_integer_column' and isinstance(value, str):
                    #     try: processed_value = int(value)
                    #     except ValueError: processed_value = None # Or handle error
                    # Example: Convert string number to float
                    # elif key == 'your_float_column' and isinstance(value, str):
                    #      try: processed_value = float(value)
                    #      except ValueError: processed_value = None # Or handle error
                    # else: # Keep original value if no specific conversion needed
                         processed_value = value
                cleaned_row[key] = processed_value

            # Extract PK value and create update payload (excluding PK)
            if pk_column_name in cleaned_row:
                pk_value = cleaned_row.get(pk_column_name)
                update_data = {k: v for k, v in cleaned_row.items() if k != pk_column_name}
            else:
                # This should not happen if header check passed, but safety check
                status_callback(f"Error: PK column '{pk_column_name}' missing in row {total_processed+1}. Skipping.")
                error_count += 1
                progress_callback(total_processed, total_rows_in_csv)
                continue # Skip this row

            # --- Validate PK Value ---
            if pk_value is None or str(pk_value).strip() == '':
                status_callback(f"Warning: Skipping row {total_processed} due to empty primary key value.")
                error_count += 1
                progress_callback(total_processed, total_rows_in_csv)
                continue

            # --- Execute Update ---
            if not update_data:
                 status_callback(f"Warning: Skipping row {total_processed} (PK: {pk_value}) as no data columns to update were found.")
                 error_count += 1
                 progress_callback(total_processed, total_rows_in_csv)
                 continue

            try:
                status_callback(f"Updating row {total_processed}/{total_rows_in_csv} (PK: {pk_value})...")
                # Supabase-py v2 returns APIResponse object
                response = supabase_client.table(table_name)\
                                        .update(update_data)\
                                        .eq(pk_column_name, pk_value)\
                                        .execute()

                # Check if update was successful and affected a row
                # A successful update on an existing row returns data (the updated row)
                if hasattr(response, 'data') and response.data:
                    total_updated_successfully += 1
                # If data is empty, it likely means the PK wasn't found (or RLS prevented update)
                elif hasattr(response, 'data') and not response.data:
                    total_skipped_not_found += 1
                    status_callback(f"Warning: Row {total_processed} (PK: {pk_value}) not found in table or no change detected.")
                # Handle explicit errors from the API response
                else:
                    error_detail = "Unknown error structure"
                    if hasattr(response, 'error') and response.error:
                         error_detail = f"Code: {getattr(response.error, 'code', 'N/A')}, Message: {getattr(response.error, 'message', 'N/A')}"
                    elif hasattr(response, 'message'): # Older error structure?
                         error_detail = response.message
                    status_callback(f"Error updating row {total_processed} (PK: {pk_value}): {error_detail}")
                    error_count += 1

            except Exception as e:
                status_callback(f"EXCEPTION updating row {total_processed} (PK: {pk_value}): {e}")
                error_count += 1
            finally:
                 progress_callback(total_processed, total_rows_in_csv) # Update progress

    except FileNotFoundError:
        status_callback(f"Error: File not found at {csv_file_path}")
        messagebox.showerror("File Error", f"Could not find the file:\n{csv_file_path}")
    except Exception as e:
        status_callback(f"An unexpected error occurred: {e}")
        messagebox.showerror("Processing Error", f"An unexpected error occurred:\n{e}")
        # import traceback # Uncomment for detailed debugging
        # traceback.print_exc()

    # --- Final Summary ---
    summary = (
        f"\n--- Update Summary ---\n"
        f"Table: '{table_name}'\n"
        f"CSV File: {os.path.basename(csv_file_path)}\n"
        f"Rows Processed from CSV: {total_processed}\n"
        f"Rows Successfully Updated: {total_updated_successfully}\n"
        f"Rows Skipped (PK Not Found/No Change): {total_skipped_not_found}\n"
        f"Rows with Errors/Skipped (Other): {error_count}\n"
        f"----------------------"
    )
    status_callback(summary)
    messagebox.showinfo("Update Complete", summary)


# --- GUI Functions ---

def get_table_names(client):
    """Fetches table names from the public schema."""
    try:
        # Use a standard SQL query to get user tables in the public schema
        response = client.rpc('sql', {'query': "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"}).execute()
        if hasattr(response, 'data') and response.data:
             # The RPC call might return list of dicts like [{'table_name': 'name1'}, ...]
            return [table['table_name'] for table in response.data]
        else:
             print("Warning: Could not fetch table names automatically.", response)
             return [] # Return empty list on failure
    except Exception as e:
        print(f"Error fetching table names: {e}")
        messagebox.showerror("DB Error", f"Could not fetch table names from database:\n{e}")
        return []


class UpdateApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Supabase CSV Updater")
        self.root.geometry("550x350") # Adjusted size

        self.selected_table = tk.StringVar()
        self.csv_file_path = tk.StringVar(value="No CSV file selected")

        # --- Initialize Supabase Client ---
        self.status_label_text = tk.StringVar(value="Initializing Supabase...")
        self.init_supabase()

        # --- Setup Widgets ---
        # Table Selection
        ttk.Label(root, text="1. Select Table to Update:").grid(row=0, column=0, padx=10, pady=10, sticky="w")
        self.table_combobox = ttk.Combobox(root, textvariable=self.selected_table, state="readonly", width=40)
        self.table_combobox.grid(row=0, column=1, padx=10, pady=10, sticky="ew")

        # CSV Selection
        ttk.Label(root, text="2. Select CSV File:").grid(row=1, column=0, padx=10, pady=5, sticky="w")
        self.select_csv_button = ttk.Button(root, text="Browse...", command=self.select_csv)
        self.select_csv_button.grid(row=1, column=1, padx=10, pady=5, sticky="w")
        ttk.Label(root, textvariable=self.csv_file_path, relief=tk.SUNKEN, width=60).grid(row=2, column=0, columnspan=2, padx=10, pady=2, sticky="ew")

        # Primary Key Info
        ttk.Label(root, text=f"   (Using Primary Key Column: '{PRIMARY_KEY_COLUMN_NAME}')").grid(row=3, column=0, columnspan=2, padx=10, pady=2, sticky="w")

        # Start Button
        self.start_button = ttk.Button(root, text="3. Start Update Process", command=self.start_update_thread)
        self.start_button.grid(row=4, column=0, columnspan=2, padx=10, pady=15)

        # Progress Bar
        self.progress = ttk.Progressbar(root, orient="horizontal", length=400, mode="determinate")
        self.progress.grid(row=5, column=0, columnspan=2, padx=10, pady=5, sticky="ew")

        # Status Label
        ttk.Label(root, textvariable=self.status_label_text, relief=tk.SUNKEN, wraplength=500).grid(row=6, column=0, columnspan=2, padx=10, pady=10, sticky="ew")

        # --- Load Tables ---
        if supabase_client:
            self.load_tables()
        else:
            self.status_label_text.set("Error: Failed to initialize Supabase.")
            messagebox.showerror("Initialization Error", "Could not connect to Supabase. Check URL/Key and network.")

        # Configure column resizing
        root.grid_columnconfigure(1, weight=1)


    def init_supabase(self):
        global supabase_client
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            self.status_label_text.set("Error: Supabase URL/Key missing in .env")
            return
        try:
            supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            self.status_label_text.set("Supabase client initialized. Select table and CSV.")
        except Exception as e:
            self.status_label_text.set(f"Error initializing Supabase: {e}")
            supabase_client = None

    def load_tables(self):
        if not supabase_client:
            return
        self.status_label_text.set("Fetching table list...")
        tables = get_table_names(supabase_client)
        if tables:
            self.table_combobox['values'] = tables
            if tables:
                 self.table_combobox.current(0) # Select first table by default
                 self.selected_table.set(tables[0])
            self.status_label_text.set("Ready. Select table and CSV file.")
        else:
             self.status_label_text.set("Warning: Could not fetch tables. Enter manually if needed.")
             # Optionally allow manual entry if fetching fails
             # self.table_combobox['state'] = 'normal'

    def select_csv(self):
        global selected_csv_path
        path = filedialog.askopenfilename(
            title="Select CSV file to update from",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")]
        )
        if path:
            selected_csv_path = path
            self.csv_file_path.set(os.path.basename(path)) # Show only filename
            self.status_label_text.set("CSV file selected. Ready to start update.")
        else:
            selected_csv_path = ""
            self.csv_file_path.set("No CSV file selected")

    def update_status(self, message):
        """Thread-safe way to update status label."""
        self.status_label_text.set(message)

    def update_progress(self, current_value, max_value):
        """Thread-safe way to update progress bar."""
        if max_value > 0:
            self.progress['maximum'] = max_value
            self.progress['value'] = current_value
        else:
             self.progress['value'] = 0

    def start_update_thread(self):
        """Starts the update process in a separate thread."""
        table = self.selected_table.get()
        csv_path = selected_csv_path

        if not table:
            messagebox.showwarning("Input Missing", "Please select a table.")
            return
        if not csv_path:
            messagebox.showwarning("Input Missing", "Please select a CSV file.")
            return
        if not supabase_client:
             messagebox.showerror("Error", "Supabase client is not initialized.")
             return

        # Disable buttons during processing
        self.start_button['state'] = 'disabled'
        self.select_csv_button['state'] = 'disabled'
        self.table_combobox['state'] = 'disabled'
        self.progress['value'] = 0 # Reset progress

        # Run process_updates in a new thread
        update_thread = threading.Thread(
            target=process_updates,
            args=(table, csv_path, PRIMARY_KEY_COLUMN_NAME, self.update_status, self.update_progress),
            daemon=True # Allows program to exit even if thread is running
        )
        update_thread.start()

        # Check thread periodically to re-enable buttons (simple approach)
        self.root.after(100, self.check_update_thread, update_thread)

    def check_update_thread(self, thread):
        """Checks if the background thread is finished and re-enables UI."""
        if thread.is_alive():
            # Check again later
            self.root.after(100, self.check_update_thread, thread)
        else:
            # Thread finished, re-enable UI
            self.start_button['state'] = 'normal'
            self.select_csv_button['state'] = 'normal'
            # Only re-enable combobox if tables were loaded successfully
            if self.table_combobox['values']:
                 self.table_combobox['state'] = 'readonly'
            # Keep final status message


# --- Main Execution ---
if __name__ == "__main__":
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("FATAL ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in the .env file.")
        # Show error even if GUI fails
        try:
            root = tk.Tk()
            root.withdraw() # Hide main window
            messagebox.showerror("Configuration Error", "Supabase URL and/or Service Key missing in .env file.\nPlease create or configure it and restart.")
            root.destroy()
        except tk.TclError:
             print("Tkinter not available to show graphical error.")
        sys.exit(1)

    main_root = tk.Tk()
    app = UpdateApp(main_root)
    main_root.mainloop()
    print("Update script finished.")