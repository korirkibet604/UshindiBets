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
  const [jackpots, setJackpots] = useState([]);
  const [boosted, setBoosted] = useState([]);
  const [previous, setPrevious] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picks, setPicks] = useState({});
  const [stake, setStake] = useState(49);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([betikaApi.getJackpot(), betikaApi.getBoosted(), betikaApi.getPreviousJackpots()])
      .then(([j, b, p]) => {
        if (cancelled) return;
        setJackpots(j?.data || []);
        setBoosted(b?.data || []);
        setPrevious(p?.data || []);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Combine all jackpot-style events; pick the active one
  const allEvents = [...jackpots, ...boosted];
  const current = allEvents[activeIdx] || null;
  const matches = current?.matches || current?.games || [];
  const meta = current || {};

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
          jackpot_type: current?.jackpot_type || current?.type || "boost",
          jackpot_id: current?.id || current?.jackpot_id || String(activeIdx),
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
        meta: { jackpot: current?.name || "boost" },
      });

      await refreshWallet();
      await addNotification({
        category: "transaction",
        title: "Jackpot entry submitted",
        body: `You entered ${meta.name || "the jackpot"} with ${pickedCount} picks.`,
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

      {loading && <div className="boost-loading">Loading jackpot...</div>}
      {error && <div className="boost-error">{error}</div>}

      {!loading && allEvents.length > 0 && (
        <div className="jackpot-tabs">
          {allEvents.map((ev, i) => (
            <button
              key={ev.id || i}
              className={i === activeIdx ? "active" : ""}
              onClick={() => { setActiveIdx(i); setPicks({}); }}
            >
              {ev.name || ev.jackpot_name || `Jackpot ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {!loading && current && (
        <>
          <div className="jackpot-meta">
            <div className="meta-item">
              <span className="meta-label">Grand Prize</span>
              <span className="meta-value">{meta.grand_prize || meta.prize || "Up to KES 50,000,000"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Stake</span>
              <span className="meta-value">{meta.stake_amount || meta.stake || "KES 49"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Matches</span>
              <span className="meta-value">{matches.length || meta.total_matches || 0}</span>
            </div>
          </div>

          <div className="jackpot-matches">
            {matches.length === 0 && (
              <div className="no-matches">No jackpot matches available right now. Try refreshing.</div>
            )}
            {matches.map((m, i) => {
              const home = m.home_team || m.homeTeam || m.team1 || "Home";
              const away = m.away_team || m.awayTeam || m.team2 || "Away";
              const mid = m.id || m.match_id || i;
              const oh = m.home_odd || m.homeOdd || m.odds?.home;
              const od = m.neutral_odd || m.neutralOdd || m.draw_odd || m.odds?.draw;
              const oa = m.away_odd || m.awayOdd || m.odds?.away;
              return (
                <div className="jackpot-match" key={mid}>
                  <div className="jm-info">
                    <span className="jm-num">{i + 1}</span>
                    <div className="jm-teams">
                      <span className="jm-team">{home}</span>
                      <span className="jm-vs">vs</span>
                      <span className="jm-team">{away}</span>
                    </div>
                    <span className="jm-league">{m.competition || m.league || ""}</span>
                  </div>
                  <div className="jm-odds">
                    {[
                      { k: "1", v: oh },
                      { k: "X", v: od },
                      { k: "2", v: oa },
                    ].map((o) => (
                      <button
                        key={o.k}
                        className={`jm-odd ${picks[mid] === o.k ? "selected" : ""}`}
                        onClick={() => o.v && togglePick(mid, o.k)}
                        disabled={!o.v}
                      >
                        <span>{o.k}</span>
                        <strong>{o.v ? Number(o.v).toFixed(2) : "-"}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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

      {!loading && allEvents.length === 0 && !error && (
        <div className="boost-empty">
          <i className="fas fa-trophy"></i>
          <h3>No active jackpots right now</h3>
          <p>Jackpot and boosted events appear here when Betika publishes them. Check back soon!</p>
          {previous.length > 0 && (
            <div className="previous-list">
              <h4>Previous Jackpots</h4>
              {previous.slice(0, 5).map((p, i) => (
                <div className="prev-item" key={i}>
                  <span>{p.name || p.jackpot_name || "Jackpot"}</span>
                  <span className="prev-status">{p.status || "completed"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Boost;
