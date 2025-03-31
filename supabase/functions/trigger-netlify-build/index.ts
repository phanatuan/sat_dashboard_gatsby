// supabase/functions/trigger-netlify-build/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log(
  `[${new Date().toISOString()}] trigger-netlify-build function initializing.`
); // Updated log

serve(async (req) => {
  const requestTimestamp = new Date().toISOString();
  console.log(
    `[${requestTimestamp}] Edge Function invoked via ${req.method} request.`
  ); // Updated log

  const buildHookUrl = Deno.env.get("NETLIFY_BUILD_HOOK_URL");
  if (!buildHookUrl) {
    console.error(
      `[${requestTimestamp}] CRITICAL ERROR: NETLIFY_BUILD_HOOK_URL environment variable not set.`
    );
    return new Response(
      JSON.stringify({ error: "Build hook URL not configured on server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(
      `[${requestTimestamp}] Attempting to trigger Netlify build hook: ${buildHookUrl}`
    ); // Updated log
    const response = await fetch(buildHookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    console.log(
      `[${requestTimestamp}] Netlify response status: ${response.status}`
    ); // Updated log
    if (!response.ok) {
      const responseBody = await response.text();
      console.error(
        `[${requestTimestamp}] Netlify build hook failed: ${response.status} ${response.statusText}. Response: ${responseBody}`
      );
      return new Response(
        JSON.stringify({
          error: `Netlify build hook failed with status: ${response.status}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[${requestTimestamp}] Netlify build hook triggered successfully.`
    ); // Updated log
    return new Response(
      JSON.stringify({ message: "Build triggered successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(
      `[${requestTimestamp}] Unexpected error triggering Netlify build hook:`,
      error
    );
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

console.log(
  `[${new Date().toISOString()}] trigger-netlify-build function listener started.`
); // Updated log
