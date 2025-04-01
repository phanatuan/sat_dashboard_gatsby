import os
import csv
import tkinter as tk
from tkinter import filedialog
from supabase import create_client, Client
from dotenv import load_dotenv # To load credentials from .env file
import math

# --- Configuration ---
load_dotenv() # Load environment variables from .env file

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in the .env file.")
    exit(1)

# <<<<<< IMPORTANT: CHANGE THIS for each file you upload >>>>>>
TABLE_NAME = 'exam_questions' # e.g., 'exams', 'questions', 'exam_questions', etc.
BATCH_SIZE = 10         # How many rows to insert per request (adjust 100-1000)
# --- End Configuration ---

def run_import():
    """Connects to Supabase, prompts for CSV, parses, and batch inserts."""

    print(f"Starting import process for table: {TABLE_NAME}")

    # --- Step 1: Initialize Supabase Client ---
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("Supabase client initialized.")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        return

    # --- Step 2: Select the CSV file ---
    root = tk.Tk()
    root.withdraw() # Hide the main empty Tk window
    print("Please select the CSV file to upload...")
    file_path = filedialog.askopenfilename(
        title=f"Select CSV file for '{TABLE_NAME}' table",
        filetypes=[("CSV files", "*.csv"), ("All files", "*.*")]
    )
    root.destroy() # Clean up the hidden window

    if not file_path:
        print("No file selected. Exiting.")
        return

    print(f"Selected file: {file_path}")
    if not file_path.lower().endswith('.csv'):
        print("Error: Selected file does not appear to be a CSV file.")
        return

    # --- Step 3: Read CSV and Batch Insert ---
    rows_to_insert = []
    total_processed = 0
    total_inserted = 0
    error_count = 0

    print('Reading CSV and starting batch inserts...')

    try:
        # Use 'utf-8-sig' to handle potential BOM (Byte Order Mark) from Excel
        with open(file_path, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile) # Reads rows as dictionaries

            for row_dict in reader:
                total_processed += 1

                # --- Data Cleaning/Type Conversion (CRITICAL!) ---
                cleaned_row = {}
                for key, value in row_dict.items():
                    # Basic handling for empty strings or 'NULL' -> None
                    if value == '' or (isinstance(value, str) and value.upper() == 'NULL'):
                        cleaned_row[key] = None
                    else:
                        # Add more specific type conversions based on YOUR table schema
                        # Example: Convert string 'true'/'false' to Python boolean
                        # if key == 'your_boolean_column' and isinstance(value, str):
                        #     cleaned_row[key] = value.lower() == 'true'
                        # Example: Convert string number to integer
                        # elif key == 'your_integer_column' and isinstance(value, str):
                        #     try:
                        #         cleaned_row[key] = int(value)
                        #     except ValueError:
                        #         print(f"Warning: Could not convert '{value}' to int for column '{key}' in row {total_processed}. Setting to None.")
                        #         cleaned_row[key] = None
                        # Example: Convert string number to float
                        # elif key == 'your_float_column' and isinstance(value, str):
                        #     try:
                        #         cleaned_row[key] = float(value)
                        #     except ValueError:
                        #          print(f"Warning: Could not convert '{value}' to float for column '{key}' in row {total_processed}. Setting to None.")
                        #          cleaned_row[key] = None
                        # else: # Keep original value if no specific conversion needed
                            cleaned_row[key] = value
                # --------------------------------------------------

                rows_to_insert.append(cleaned_row)

                # --- Insert Batch when full ---
                if len(rows_to_insert) >= BATCH_SIZE:
                    print(f"Inserting batch of {len(rows_to_insert)} rows (Total processed: {total_processed})...")
                    try:
                        # Supabase-py v2 returns APIResponse, doesn't raise HTTP errors by default
                        response = supabase.table(TABLE_NAME).insert(rows_to_insert).execute()

                        # Basic check: assumes success if response has data (adjust if needed)
                        if hasattr(response, 'data') and response.data:
                             total_inserted += len(rows_to_insert)
                        else:
                            # Try to get more specific error if available
                            error_detail = "Unknown error structure in response"
                            # Attempt to parse common error structures (may vary)
                            if hasattr(response, 'error') and response.error:
                                error_detail = f"Code: {response.error.code}, Message: {response.error.message}, Details: {getattr(response.error, 'details', 'N/A')}"
                            elif hasattr(response, 'message'):
                                error_detail = response.message
                            print(f"Error inserting batch (around row {total_processed}): {error_detail}")
                            error_count += len(rows_to_insert)


                    except Exception as e: # Catch network errors etc.
                        print(f"EXCEPTION during batch insert (around row {total_processed}): {e}")
                        error_count += len(rows_to_insert)
                    finally:
                        rows_to_insert = [] # Clear the batch

            # --- Insert Final Batch ---
            if rows_to_insert:
                print(f"Inserting final batch of {len(rows_to_insert)} rows...")
                try:
                    response = supabase.table(TABLE_NAME).insert(rows_to_insert).execute()
                    if hasattr(response, 'data') and response.data:
                         total_inserted += len(rows_to_insert)
                    else:
                        error_detail = "Unknown error structure in response"
                        if hasattr(response, 'error') and response.error:
                            error_detail = f"Code: {response.error.code}, Message: {response.error.message}, Details: {getattr(response.error, 'details', 'N/A')}"
                        elif hasattr(response, 'message'):
                            error_detail = response.message
                        print(f"Error inserting final batch: {error_detail}")
                        error_count += len(rows_to_insert)

                except Exception as e:
                    print(f"EXCEPTION during final batch insert: {e}")
                    error_count += len(rows_to_insert)

    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return
    except Exception as e:
        print(f"An unexpected error occurred during CSV processing or insertion: {e}")
        # You might want to log the full traceback here for debugging
        # import traceback
        # traceback.print_exc()
        return

    # --- Step 4: Summary ---
    print('\n--- Import Summary ---')
    print(f"Target Table: {TABLE_NAME}")
    print(f"Selected CSV: {os.path.basename(file_path)}")
    print(f"Total rows processed from CSV: {total_processed}")
    print(f"Total rows successfully inserted: {total_inserted}")
    print(f"Total rows with errors (estimated): {error_count}")
    print('----------------------')
    if error_count > 0:
         print("\nWarning: Please review errors above. Some data may not have been inserted correctly.")

# --- Run the main import function ---
if __name__ == "__main__":
    run_import()
    print("\nImport script finished.")