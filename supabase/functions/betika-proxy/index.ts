import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BETIKA_API_BASE = "https://betika-api-production.up.railway.app";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Route: /functions/v1/betika-proxy/api/matches?limit=100
    // pathParts = ["", "api", "matches"]
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Drop the function-name segment ("betika-proxy")
    const fnIdx = pathParts.findIndex((p) => p === "betika-proxy");
    const apiPath = fnIdx >= 0 ? pathParts.slice(fnIdx + 1).join("/") : pathParts.join("/");
    const targetUrl = `${BETIKA_API_BASE}/${apiPath}${url.search}`;

    const res = await fetch(targetUrl, {
      method: req.method,
      headers: { Accept: "application/json" },
    });

    const contentType = res.headers.get("content-type") || "application/json";
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": contentType },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
