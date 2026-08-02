const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RAILWAY_BASE = "https://betika-api-production.up.railway.app";
const BETIKA_LIVE_BASE = "https://live.betika.com/v1";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const fnIdx = pathParts.findIndex((p) => p === "betika-proxy");
    const apiPath = fnIdx >= 0 ? pathParts.slice(fnIdx + 1).join("/") : pathParts.join("/");

    // Route /live/* directly to live.betika.com (bypassing our Railway server)
    // Everything else goes to the Railway server which transforms the data
    const isLive = apiPath.startsWith("live/");
    let targetUrl;
    if (isLive) {
      const routePath = apiPath.replace(/^live\//, "");
      targetUrl = `${BETIKA_LIVE_BASE}/${routePath}${url.search}`;
    } else {
      targetUrl = `${RAILWAY_BASE}/${apiPath}${url.search}`;
    }

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
