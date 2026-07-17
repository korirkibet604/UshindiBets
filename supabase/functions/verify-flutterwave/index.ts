import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { transaction_id, user_id, amount, currency, tx_ref } = await req.json();

    if (!transaction_id || !user_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secretKey = Deno.env.get("FLW_SECRET_KEY");
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Payment provider not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify transaction with Flutterwave
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const verifyData = await verifyRes.json();

    if (verifyData.status !== "success" || verifyData.data.status !== "successful") {
      return new Response(JSON.stringify({ error: "Transaction verification failed", detail: verifyData }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifiedAmount = Number(verifyData.data.amount);
    const verifiedCurrency = verifyData.data.currency;
    if (verifiedAmount < Number(amount)) {
      return new Response(JSON.stringify({ error: "Amount mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to credit wallet + record transaction
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert transaction record
    const { error: txErr } = await supabase.from("transactions").insert({
      user_id,
      type: "deposit",
      amount: verifiedAmount,
      currency: verifiedCurrency,
      status: "successful",
      reference: tx_ref || String(transaction_id),
      provider: "flutterwave",
      meta: { transaction_id, flutterwave_ref: verifyData.data.flw_ref },
    });
    if (txErr) throw txErr;

    // Credit wallet (service role bypasses RLS)
    const { error: wErr } = await supabase
      .from("wallets")
      .update({ balance: verifiedAmount, updated_at: new Date().toISOString() })
      .eq("user_id", user_id);
    if (wErr) throw wErr;

    return new Response(
      JSON.stringify({ success: true, amount: verifiedAmount, currency: verifiedCurrency }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
