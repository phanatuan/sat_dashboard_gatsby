// supabase/functions/_shared/cors.ts

/**
 * CORS headers required for Supabase Edge Functions.
 * Adjust 'Access-Control-Allow-Origin' for production environments.
 */
export const corsHeaders = {
  // IMPORTANT: For production, replace '*' with your specific frontend domain
  // Example: 'https://your-gatsby-app.com'
  // You might also want to allow localhost for development, e.g., by checking process.env or Origin header.
  "Access-Control-Allow-Origin": "*",

  // Specifies the methods allowed when accessing the resource
  "Access-Control-Allow-Methods": "POST, OPTIONS", // Allow POST for submitting, OPTIONS for preflight checks

  // Specifies the headers allowed in the actual request (`POST`) after a preflight (`OPTIONS`) request.
  // - authorization: Needed for Supabase to authenticate the user via JWT.
  // - apikey: Often sent by the Supabase client library.
  // - content-type: Required because your client sends JSON data (`application/json`).
  // - x-client-info: Often sent by the Supabase client library.
  // Using lowercase as header names sent in 'Access-Control-Request-Headers' are often lowercase.
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
