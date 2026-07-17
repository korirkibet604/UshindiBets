import "./Wallet.scss";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useNotifications } from "../../context/NotificationContext";
import { supabase } from "../../services/supabaseClient";

const FLW_PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY || "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxx-X";

function Wallet() {
  const { user, profile, wallet, refreshWallet } = useAuth();
  const { formatMoney, currency } = useCurrency();
  const { addNotification } = useNotifications();
  const [tab, setTab] = useState("deposit");
  const [amount, setAmount] = useState(500);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setTransactions(data || []);
    setLoadingTx(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const makePayment = () => {
    setError(null);
    const amt = Number(amount);
    if (!amt || amt < 50) {
      setError("Minimum deposit is 50.");
      return;
    }
    if (!FLW_PUBLIC_KEY || FLW_PUBLIC_KEY.startsWith("FLWPUBK_TEST-xxxx")) {
      setError("Flutterwave is not configured. Add VITE_FLW_PUBLIC_KEY to .env");
      return;
    }
    const tx_ref = `ushindi-${user.id.slice(0, 8)}-${Date.now()}`;
    // @ts-ignore - FlutterwaveCheckout injected by inline script
    window.FlutterwaveCheckout({
      public_key: FLW_PUBLIC_KEY,
      tx_ref,
      amount: amt,
      currency,
      payment_options: "card, mobilemoney, ussd, banktransfer",
      customer: {
        email: user.email,
        phone_number: profile?.phone || "",
        name: profile?.display_name || "",
      },
      customizations: {
        title: "UshindiBets Deposit",
        description: `Wallet deposit of ${formatMoney(amt)}`,
        logo: "https://img.sofascore.com/api/v1/team/2697/image",
      },
      callback: async (data) => {
        setProcessing(true);
        try {
          const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-flutterwave`;
          const res = await fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              transaction_id: data.transaction_id,
              user_id: user.id,
              amount: amt,
              currency,
              tx_ref,
            }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || "Verification failed");
          await refreshWallet();
          await fetchTransactions();
          await addNotification({
            category: "transaction",
            title: "Deposit successful",
            body: `${formatMoney(amt)} has been added to your wallet.`,
          });
        } catch (e) {
          setError(e.message || "Payment verification failed. Contact support.");
        } finally {
          setProcessing(false);
        }
      },
      onclose: () => {},
    });
  };

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h1><i className="fas fa-wallet"></i> My Wallet</h1>
        <div className="balance-card">
          <span className="bal-label">Available Balance</span>
          <span className="bal-amount">{formatMoney(wallet?.balance || 0)}</span>
          <span className="bal-bonus">Bonus: {formatMoney(wallet?.bonus_balance || 0)}</span>
        </div>
      </div>

      <div className="wallet-tabs">
        <button className={tab === "deposit" ? "active" : ""} onClick={() => setTab("deposit")}>Deposit</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>History</button>
      </div>

      {tab === "deposit" && (
        <div className="deposit-panel">
          <h3>Top up your wallet</h3>
          <p className="deposit-sub">Powered by Flutterwave • supports cards, mobile money, USSD & bank transfer</p>

          <div className="quick-amounts">
            {[100, 250, 500, 1000, 2500, 5000].map((a) => (
              <button key={a} className={`quick-amt ${Number(amount) === a ? "active" : ""}`} onClick={() => setAmount(a)}>
                {formatMoney(a)}
              </button>
            ))}
          </div>

          <div className="amount-input">
            <label>Custom amount ({currency})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={50}
              placeholder="Enter amount"
            />
          </div>

          {error && <div className="wallet-error">{error}</div>}

          <button className="deposit-btn" onClick={makePayment} disabled={processing}>
            {processing ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-credit-card"></i> Deposit {formatMoney(amount)}</>}
          </button>

          <div className="deposit-note">
            <i className="fas fa-shield-alt"></i>
            <span>Payments are secured and verified by Flutterwave. We never store your card details.</span>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="history-panel">
          {loadingTx ? (
            <div className="loading">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="no-data">No transactions yet.</div>
          ) : (
            <div className="tx-list">
              {transactions.map((tx) => (
                <div className="tx-item" key={tx.id}>
                  <div className="tx-icon">
                    <i className={`fas ${tx.amount >= 0 ? "fa-arrow-down text-success" : "fa-arrow-up text-danger"}`}></i>
                  </div>
                  <div className="tx-info">
                    <div className="tx-type">{tx.type.replace("_", " ")}</div>
                    <div className="tx-date">{new Date(tx.created_at).toLocaleString()}</div>
                  </div>
                  <div className={`tx-amount ${tx.amount >= 0 ? "positive" : "negative"}`}>
                    {tx.amount >= 0 ? "+" : ""}{formatMoney(Math.abs(tx.amount))}
                  </div>
                  <span className={`tx-status status-${tx.status}`}>{tx.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Wallet;
