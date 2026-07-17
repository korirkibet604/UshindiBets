import "./Boost.scss";
import { useEffect, useState } from "react";
import { betikaApi } from "../../services/betikaApi";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useNotifications } from "../../context/NotificationContext";
import { supabase } from "../../services/supabaseClient";

function Boost() {
  const { user, wallet, refreshWallet } = useAuth();
  const { formatMoney } = useCurrency();
  const { addNotification } = useNotifications();
  const [jackpot, setJackpot] = useState(null);
  const [midweek, setMidweek] = useState(null);
  const [active, setActive] = useState("must-be-won");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picks, setPicks] = useState({}); // { matchId: "1" | "X" | "2" }
  const [stake, setStake] = useState(49);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([betikaApi.getJackpot(), betikaApi.getMidweekJackpot()])
      .then(([j, m]) => {
        if (cancelled) return;
        setJackpot(j?.data || null);
        setMidweek(m?.data || null);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const current = active === "must-be-won" ? jackpot : midweek;
  const matches = current?.matches || [];
  const meta = current?.jackpot || {};

  const togglePick = (matchId, pick) => {
    setPicks((prev) => ({ ...prev, [matchId]: prev[matchId] === pick ? null : pick }));
  };

  const pickedCount = Object.values(picks).filter(Boolean).length;
  const allPicked = matches.length > 0 && pickedCount === matches.length;

  const submit = async () => {
    setError(null);
    if (!user) {
      setError("Please sign in to enter the jackpot.");
      return;
    }
    if (!allPicked) {
      setError(`Pick all ${matches.length} matches to enter.`);
      return;
    }
    const balance = Number(wallet?.balance || 0);
    if (Number(stake) > balance) {
      setError("Insufficient balance. Please deposit first.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: entry, error: eErr } = await supabase
        .from("jackpot_entries")
        .insert({
          user_id: user.id,
          jackpot_type: active,
          jackpot_id: current?.jackpot?.name || active,
          picks: Object.entries(picks).map(([matchId, pick]) => ({ matchId, pick })),
          stake: Number(stake),
          status: "entered",
        })
        .select()
        .maybeSingle();
      if (eErr) throw eErr;

      const { error: wErr } = await supabase.rpc("debit_wallet", {
        p_user_id: user.id,
        p_amount: Number(stake),
      });
      if (wErr) throw wErr;

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "bet_stake",
        amount: -Number(stake),
        currency: wallet?.currency || "KES",
        status: "successful",
        reference: entry?.id,
        provider: "system",
        meta: { jackpot: active },
      });

      await refreshWallet();
      await addNotification({
        category: "transaction",
        title: "Jackpot entry submitted",
        body: `You entered the ${meta.name || "Jackpot"} with ${pickedCount} picks.`,
        meta: { entry_id: entry?.id },
      });
      setPicks({});
    } catch (e) {
      setError(e.message || "Failed to enter jackpot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="boost-page">
      <div className="boost-header">
        <h1><i className="fas fa-trophy"></i> Jackpot</h1>
        <p>Pick all matches correctly to win the grand prize!</p>
      </div>

      <div className="jackpot-tabs">
        <button className={active === "must-be-won" ? "active" : ""} onClick={() => { setActive("must-be-won"); setPicks({}); }}>
          Grand Jackpot
        </button>
        <button className={active === "midweek" ? "active" : ""} onClick={() => { setActive("midweek"); setPicks({}); }}>
          Midweek Jackpot
        </button>
      </div>

      {loading && <div className="boost-loading">Loading jackpot...</div>}
      {error && <div className="boost-error">{error}</div>}

      {!loading && current && (
        <>
          <div className="jackpot-meta">
            <div className="meta-item">
              <span className="meta-label">Grand Prize</span>
              <span className="meta-value">{meta.grandPrize || "Up to KES 50,000,000"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Stake</span>
              <span className="meta-value">{meta.stakeAmount || "KES 49"}</span>
            </div>
            {meta.countdown && (
              <div className="meta-item">
                <span className="meta-label">Closes in</span>
                <span className="meta-value">
                  {meta.countdown.days || 0}d {meta.countdown.hours || 0}h {meta.countdown.minutes || 0}m
                </span>
              </div>
            )}
          </div>

          <div className="jackpot-matches">
            {matches.length === 0 && <div className="no-matches">No jackpot matches available right now. Try refreshing.</div>}
            {matches.map((m, i) => (
              <div className="jackpot-match" key={m.id ?? i}>
                <div className="jm-info">
                  <span className="jm-num">{i + 1}</span>
                  <div className="jm-teams">
                    <span className="jm-team">{m.homeTeam}</span>
                    <span className="jm-vs">vs</span>
                    <span className="jm-team">{m.awayTeam}</span>
                  </div>
                  <span className="jm-league">{m.league}</span>
                </div>
                <div className="jm-odds">
                  {[
                    { k: "1", v: m.odds?.home },
                    { k: "X", v: m.odds?.draw },
                    { k: "2", v: m.odds?.away },
                  ].map((o) => (
                    <button
                      key={o.k}
                      className={`jm-odd ${picks[m.id] === o.k ? "selected" : ""}`}
                      onClick={() => togglePick(m.id, o.k)}
                      disabled={!o.v}
                    >
                      <span>{o.k}</span>
                      <strong>{o.v ? Number(o.v).toFixed(2) : "-"}</strong>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {matches.length > 0 && (
            <div className="jackpot-footer">
              <div className="jp-progress">
                <span>{pickedCount}/{matches.length} picks</span>
                <div className="jp-bar"><div className="jp-fill" style={{ width: `${(pickedCount / matches.length) * 100}%` }}></div></div>
              </div>
              <div className="jp-actions">
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  min={49}
                  placeholder="Stake"
                />
                <button className="jp-submit" onClick={submit} disabled={submitting || !allPicked}>
                  {submitting ? <i className="fas fa-spinner fa-spin"></i> : "Submit Entry"}
                </button>
              </div>
              {!allPicked && <span className="jp-hint">Pick all matches to submit your entry.</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Boost;
