import "./Detail.scss";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { betikaApi } from "../../services/betikaApi";
import { useBetslip } from "../../context/BetslipContext";

function Detail() {
  const [tab, setTab] = useState("overview");
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { addSelection, selections } = useBetslip();
  const id = location.pathname.split("/")[2];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    betikaApi
      .getMatchById(id)
      .then((res) => {
        if (cancelled) return;
        setMatch(res?.data || null);
      })
      .catch((e) => !cancelled && setError(e.message || "Failed to load match"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isPicked = (market, pick) =>
    selections.some((s) => s.matchId === id && s.market === market && s.pick === pick);

  const pickOdd = (market, pick, odds) =>
    addSelection({
      matchId: id,
      matchName: `${match?.homeTeam || "Home"} vs ${match?.awayTeam || "Away"}`,
      homeTeam: match?.homeTeam,
      awayTeam: match?.awayTeam,
      market,
      pick,
      odds,
    });

  if (loading) {
    return (
      <div className="detail-content">
        <div className="loading">Loading match data for ID: {id}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-content">
        <div className="error">Error loading match: {error}</div>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="detail-content">
        <div className="no-data">No match data found for ID: {id}</div>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const markets = match.markets || [];
  const homeTeam = match.homeTeam || "Home";
  const awayTeam = match.awayTeam || "Away";

  return (
    <div className="detail-content" id="detailContent">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Match Details</h2>
      </div>

      <div className="match-card live">
        <div className="match-status">
          <span>{match.league} • {match.competition}</span>
          <span>{match.matchTime || match.date} {match.time || ""}</span>
        </div>
        <div className="match-teams">
          <div className="team">
            <div className="team-name">{homeTeam}</div>
          </div>
          <div className="match-score">
            <div className="score">-:-</div>
            <div className="match-time">{match.matchTime || "Preview"}</div>
          </div>
          <div className="team">
            <div className="team-name">{awayTeam}</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === "overview" && "active"}`} onClick={() => setTab("overview")}>
          Overview
        </div>
        <div className={`tab ${tab === "markets" && "active"}`} onClick={() => setTab("markets")}>
          Markets
        </div>
        <div className={`tab ${tab === "stats" && "active"}`} onClick={() => setTab("stats")}>
          Statistics
        </div>
      </div>

      {tab === "overview" && (
        <div className="tab-content active">
          <h2>Match Info</h2>
          <div className="info-grid">
            <div className="info-item"><strong>League</strong><span>{match.league}</span></div>
            <div className="info-item"><strong>Competition</strong><span>{match.competition}</span></div>
            <div className="info-item"><strong>Date</strong><span>{match.date}</span></div>
            <div className="info-item"><strong>Time</strong><span>{match.time}</span></div>
            <div className="info-item"><strong>Total Markets</strong><span>{match.totalMarkets || markets.length}</span></div>
          </div>
          {markets.length > 0 && (
            <>
              <h2>Top Markets</h2>
              <div className="markets-preview">
                {markets.slice(0, 3).map((m, i) => (
                  <div className="market-block" key={i}>
                    <h4>{m.name}</h4>
                    <div className="market-odds">
                      {m.odds?.map((o, j) => (
                        <button
                          key={j}
                          className={`odd-pill ${isPicked(m.name, o.label) ? "selected" : ""}`}
                          onClick={() => o.value && pickOdd(m.name, o.label, o.value)}
                        >
                          <span className="odd-label">{o.label}</span>
                          <span className="odd-value">{o.value ? Number(o.value).toFixed(2) : "-"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "markets" && (
        <div className="tab-content active">
          <h2>All Markets ({markets.length})</h2>
          {markets.length === 0 ? (
            <div className="no-data">No market data available for this match yet.</div>
          ) : (
            <div className="markets-list">
              {markets.map((m, i) => (
                <div className="market-block" key={i}>
                  <h4>{m.name}</h4>
                  <div className="market-odds">
                    {m.odds?.map((o, j) => (
                      <button
                        key={j}
                        className={`odd-pill ${isPicked(m.name, o.label) ? "selected" : ""}`}
                        onClick={() => o.value && pickOdd(m.name, o.label, o.value)}
                      >
                        <span className="odd-label">{o.label}</span>
                        <span className="odd-value">{o.value ? Number(o.value).toFixed(2) : "-"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div className="tab-content active">
          <h2>Statistics</h2>
          {match.statistics && Object.keys(match.statistics).length > 0 ? (
            <div className="stats-grid">
              {Object.entries(match.statistics).map(([k, v]) => (
                <div className="stat-row" key={k}>
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">Statistics will be available once the match starts.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Detail;
