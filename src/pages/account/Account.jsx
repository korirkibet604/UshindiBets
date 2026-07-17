import "./Account.scss";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useNotifications } from "../../context/NotificationContext";
import { supabase } from "../../services/supabaseClient";

function Account() {
  const { user, profile, wallet, updateProfile, signOut, refreshWallet } = useAuth();
  const { formatMoney, currency, currencies, changeCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const [tab, setTab] = useState("profile");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [bets, setBets] = useState([]);
  const [limits, setLimits] = useState({ daily: "", weekly: "", monthly: "" });
  const [savingLimits, setSavingLimits] = useState(false);

  const fetchBets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bet_slips")
      .select("*, bet_selections(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setBets(data || []);
  }, [user]);

  const fetchLimits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("responsible_limits").select("*").eq("user_id", user.id);
    const map = {};
    (data || []).forEach((l) => {
      map[l.period] = l.max_deposit || "";
    });
    setLimits({
      daily: map.daily || "",
      weekly: map.weekly || "",
      monthly: map.monthly || "",
    });
  }, [user]);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
    setPhone(profile?.phone || "");
  }, [profile]);

  useEffect(() => {
    fetchBets();
    fetchLimits();
  }, [fetchBets, fetchLimits]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName, phone });
      await addNotification({ category: "system", title: "Profile updated", body: "Your profile changes were saved." });
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveLimits = async () => {
    setSavingLimits(true);
    try {
      const rows = ["daily", "weekly", "monthly"].map((period) => ({
        user_id: user.id,
        period,
        max_deposit: limits[period] ? Number(limits[period]) : null,
      }));
      for (const r of rows) {
        await supabase.from("responsible_limits").upsert(r, { onConflict: "user_id,period" });
      }
      await addNotification({
        category: "system",
        title: "Responsible gaming limits saved",
        body: "Your deposit limits have been updated.",
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingLimits(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <div className="avatar">
          <i className="fas fa-user-circle"></i>
        </div>
        <div className="account-info">
          <h2>{profile?.display_name || user?.email}</h2>
          <p>{user?.email}</p>
          <span className="balance-pill">{formatMoney(wallet?.balance || 0)}</span>
        </div>
      </div>

      <div className="account-tabs">
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>Profile</button>
        <button className={tab === "bets" ? "active" : ""} onClick={() => setTab("bets")}>Bet History</button>
        <button className={tab === "limits" ? "active" : ""} onClick={() => setTab("limits")}>Responsible Gaming</button>
      </div>

      {tab === "profile" && (
        <div className="account-panel">
          <div className="form-group">
            <label>Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user?.email || ""} readOnly />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7xx" />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <select value={currency} onChange={(e) => changeCurrency(e.target.value)}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.country}</option>
              ))}
            </select>
          </div>
          <button className="save-btn" onClick={saveProfile} disabled={saving}>
            {saving ? <i className="fas fa-spinner fa-spin"></i> : "Save Changes"}
          </button>
          <button className="logout-btn" onClick={signOut}>
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      )}

      {tab === "bets" && (
        <div className="account-panel">
          {bets.length === 0 ? (
            <div className="no-data">No bets placed yet.</div>
          ) : (
            <div className="bet-list">
              {bets.map((bet) => (
                <div className="bet-item" key={bet.id}>
                  <div className="bet-top">
                    <span className={`bet-status status-${bet.status}`}>{bet.status}</span>
                    <span className="bet-type">{bet.type}</span>
                    <span className="bet-date">{new Date(bet.created_at).toLocaleString()}</span>
                  </div>
                  <div className="bet-selections">
                    {bet.bet_selections?.map((s) => (
                      <div className="bet-sel" key={s.id}>
                        <span className="sel-match">{s.match_name || s.match_id}</span>
                        <span className="sel-pick">{s.market} • {s.pick}</span>
                        <span className="sel-odds">@{Number(s.odds).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bet-bottom">
                    <span>Stake: <strong>{formatMoney(bet.stake)}</strong></span>
                    <span>Odds: <strong>{Number(bet.total_odds).toFixed(2)}</strong></span>
                    <span>Potential: <strong>{formatMoney(bet.potential_win)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "limits" && (
        <div className="account-panel">
          <p className="limits-intro">
            Set deposit limits to stay in control of your betting. These caps prevent deposits above the amounts you set for each period.
          </p>
          <div className="form-group">
            <label>Daily deposit limit ({currency})</label>
            <input type="number" value={limits.daily} onChange={(e) => setLimits({ ...limits, daily: e.target.value })} placeholder="No limit" />
          </div>
          <div className="form-group">
            <label>Weekly deposit limit ({currency})</label>
            <input type="number" value={limits.weekly} onChange={(e) => setLimits({ ...limits, weekly: e.target.value })} placeholder="No limit" />
          </div>
          <div className="form-group">
            <label>Monthly deposit limit ({currency})</label>
            <input type="number" value={limits.monthly} onChange={(e) => setLimits({ ...limits, monthly: e.target.value })} placeholder="No limit" />
          </div>
          <button className="save-btn" onClick={saveLimits} disabled={savingLimits}>
            {savingLimits ? <i className="fas fa-spinner fa-spin"></i> : "Save Limits"}
          </button>
          <div className="support-box">
            <i className="fas fa-info-circle"></i>
            <span>Need help? Gambling should be fun, not a financial burden. Visit begambleaware.org for support.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;
