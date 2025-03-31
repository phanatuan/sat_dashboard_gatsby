// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Use the environment variables defined in .env.development or .env.production
// Note: Variables prefixed with GATSBY_ are automatically available client-side
const supabaseUrl = process.env.GATSBY_SUPABASE_URL;
const supabaseAnonKey = process.env.GATSBY_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database (client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// We will create a separate instance using the service role key
// later specifically within gatsby-node.js for build-time data fetching.
