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

  const [jackpotEvents, setJackpotEvents] = useState([]);
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

    (async () => {
      try {
        const [j, p] = await Promise.all([
          betikaApi.getJackpot(),
          betikaApi.getPreviousJackpots(),
        ]);

        const jackpotList = j?.data || [];

        // For each jackpot meta, fetch its full event (with matches)
        const eventsWithData = await Promise.all(
          jackpotList.map(async (meta) => {
            try {
              const ev = await betikaApi.getJackpotEvents(meta.id);
              // ev = { meta: {...}, data: [ {match}, ... ] } OR { data: [...] }
              const evMeta = ev?.meta || meta;
              const evMatches = ev?.data || [];
              return {
                id: evMeta?.id || meta.id,
                name: evMeta?.event_name || meta.event_name,
                jackpot_type: "jackpot",
                prize:
                  evMeta?.details?.[0]?.prize ||
                  evMeta?.prize ||
                  meta.prize,
                stake:
                  evMeta?.details?.[0]?.stake ||
                  evMeta?.stake ||
                  meta.stake ||
                  "49",
                total_matches:
                  evMeta?.total_games ||
                  meta.total_games ||
                  evMatches.length,
                matches: evMatches,
                raw: ev,
              };
            } catch (e) {
              // fall back to meta-only if detail fetch fails
              return {
                id: meta.id,
                name: meta.event_name,
                jackpot_type: "jackpot",
                prize: meta.prize,
                stake: meta.stake || "49",
                total_matches: meta.total_games,
                matches: [],
                raw: meta,
              };
            }
          })
        );

        if (cancelled) return;
        setJackpotEvents(eventsWithData);
        setPrevious(p?.data || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const allEvents = jackpotEvents;
  const current = allEvents[activeIdx] || null;
  const matches = current?.matches || [];
  const meta = current || {};

  const togglePick = (matchId, pick) => {
    setPicks((prev) => ({
      ...prev,
      [matchId]: prev[matchId] === pick ? null : pick,
    }));
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
          jackpot_type: current?.jackpot_type || "jackpot",
          jackpot_id: current?.id || String(activeIdx),
          picks: Object.entries(picks).map(([matchId, pick]) => ({
            matchId,
            pick,
          })),
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
        meta: { jackpot: current?.name || "jackpot" },
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
        <h1>
          <i className="fas fa-trophy"></i> Jackpot
        </h1>
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
              onClick={() => {
                setActiveIdx(i);
                setPicks({});
              }}
            >
              {ev.name || `Jackpot ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {!loading && current && (
        <>
          <div className="jackpot-meta">
            <div className="meta-item">
              <span className="meta-label">Grand Prize</span>
              <span className="meta-value">
                {meta.grand_prize || meta.prize || "Up to KES 50,000,000"}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Stake</span>
              <span className="meta-value">
                {meta.stake_amount || meta.stake || "KES 49"}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Matches</span>
              <span className="meta-value">
                {matches.length || meta.total_matches || 0}
              </span>
            </div>
          </div>

          <div className="jackpot-matches">
            {matches.length === 0 && (
              <div className="no-matches">
                No jackpot matches available right now. Try refreshing.
              </div>
            )}

            {matches.map((m, i) => {
              const home = m.home_team || m.homeTeam || "Home";
              const away = m.away_team || m.awayTeam || "Away";
              const mid = m.jackpot_match_id || m.match_id || m.id || i;
              const league = [m.category, m.competition_name]
                .filter(Boolean)
                .join(" — ");

              // Odds come as an array under m.odds with display "1" | "X" | "2"
              const oddsArr = m.odds || [];
              const findOdd = (display) => {
                const o = oddsArr.find(
                  (x) => x.display === display && x.sub_type_id === "1"
                );
                return o ? Number(o.odd_value) : null;
              };
              const oh = findOdd("1");
              const od = findOdd("X");
              const oa = findOdd("2");

              return (
                <div className="jackpot-match" key={mid}>
                  <div className="jm-info">
                    <span className="jm-num">{i + 1}</span>
                    <div className="jm-teams">
                      <span className="jm-team">{home}</span>
                      <span className="jm-vs">vs</span>
                      <span className="jm-team">{away}</span>
                    </div>
                    <span className="jm-league">{league}</span>
                  </div>
                  <div className="jm-odds">
                    {[
                      { k: "1", v: oh },
                      { k: "X", v: od },
                      { k: "2", v: oa },
                    ].map((o) => (
                      <button
                        key={o.k}
                        className={`jm-odd ${
                          picks[mid] === o.k ? "selected" : ""
                        }`}
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
                <span>
                  {pickedCount}/{matches.length} picks
                </span>
                <div className="jp-bar">
                  <div
                    className="jp-fill"
                    style={{
                      width: `${(pickedCount / matches.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="jp-actions">
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  min={49}
                  placeholder="Stake"
                />
                <button
                  className="jp-submit"
                  onClick={submit}
                  disabled={submitting || !allPicked}
                >
                  {submitting ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    "Submit Entry"
                  )}
                </button>
              </div>
              {!allPicked && (
                <span className="jp-hint">
                  Pick all matches to submit your entry.
                </span>
              )}
            </div>
          )}
        </>
      )}

      {!loading && allEvents.length === 0 && !error && (
        <div className="boost-empty">
          <i className="fas fa-trophy"></i>
          <h3>No active jackpots right now</h3>
          <p>
            Jackpot events appear here when Betika publishes them. Check back
            soon!
          </p>
          {previous.length > 0 && (
            <div className="previous-list">
              <h4>Previous Jackpots</h4>
              {previous.slice(0, 5).map((p, i) => (
                <div className="prev-item" key={i}>
                  <span>{p.name || p.jackpot_name || "Jackpot"}</span>
                  <span className="prev-status">
                    {p.status || "completed"}
                  </span>
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