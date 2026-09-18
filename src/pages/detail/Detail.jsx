import "./Detail.scss";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { betikaApi } from "../../services/betikaApi";
import { useBetslip } from "../../context/BetslipContext";
import { normalizeMatch } from "../../utils/matchUtils";
import { BETTING_FREE } from '../../constants';

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
        setMatch(normalizeMatch(res?.data || {}));
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

  console.log(match)
  return (
    <div className="detail-content" id="detailContent">
          <div className="detail-header">
                <button className="back-btn" id="backBtn" onClick={() => window.history.back()}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h2>Match Details</h2>
            </div>

            <div className="match-card live">
            <div className="match-status">
                    <span>{match.competition}</span>
                    {match.isLive ?
                        <div className="live-indicator">
                            <i className="fas fa-circle"></i> LIVE
                        </div> :
                        <span>{match.date} {match.time}</span> 
                    }
                </div>
                <div className="match-teams">
                    <div className="team">
                        {/*<img
                            src={`https://img.sofascore.com/api/v1/team/${match.event.homeTeam.id}/image`}
                            alt=""
                            className="team-logo"
                        />*/}
                        <div className="team-name">{match.homeTeam}</div>
                    </div>
                    <div className="match-score">
                        <div className="score">
                            <span className={match.isLive && ["Started", "1st half", "2nd half"].includes(match.eventStatus) ? "live-score" : "" }>
                                {match.currentScore}
                            </span>
                        </div>
                        <div className="match-time">
                        {match.isLive ?
                            (match.eventStatus === "Halftime" ? "HT" :
                            `${match.matchTime}'`)
                            : new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                        }
                        </div>
                    </div>
                    <div className="team">
                        {/*<img
                            src={`https://img.sofascore.com/api/v1/team/${match.event.awayTeam.id}/image`}
                            alt=""
                            className="team-logo"
                        />*/}
                        <div className="team-name">{match.awayTeam}</div>
                    </div>
                </div>
                {BETTING_FREE && <div className="match-info">
                    <span><i className="fas fa-stadium"></i>{/*match.event.venue?.name*/}</span>
                    <span><i className="fas fa-user"></i>{/*match.event.venue?.capacity*/}</span>
                    <span><i className="fas fa-whistle"></i> Michael Oliver</span>
                </div>}
                {BETTING_FREE && <NavLink to="/" className="highlight-btn">
                    <i className="fas fa-play-circle"></i> Watch Live
                </NavLink>}
                {
                    /*BETTING_FREE ? (<div className="match-info">
                        <span><i className="fas fa-stadium"></i>{match.venue}</span>
                    </div>) :*/
                        !BETTING_FREE && markets.length > 0 && (<div className="betting-options">
                            <div className="bet-option">
                                <div className="option-name">Home</div>
                                <div className="option-odds">{match.odds.home.toFixed(2)}</div>
                            </div>
                            <div className="bet-option">
                                <div className="option-name">Draw</div>
                                <div className="option-odds">{match.odds.draw.toFixed(2)}</div>
                            </div>
                            <div className="bet-option">
                                <div className="option-name">Away</div>
                                <div className="option-odds">{match.odds.away.toFixed(2)}</div>
                            </div>
                        </div>)
                }
            </div>

      <div className="tabs">
        <div className={`tab ${tab === "overview" && "active"}`} onClick={() => setTab("overview")}>
          Top Markets
        </div>
        <div className={`tab ${tab === "markets" && "active"}`} onClick={() => setTab("markets")}>
          All Markets
        </div>
        {/*<div className={`tab ${tab === "stats" && "active"}`} onClick={() => setTab("stats")}>
          Statistics
        </div>*/}
      </div>

      {tab === "overview" && (
        <div className="tab-content active">
          {/*<h2>Match Info</h2>
          <div className="info-grid">
            <div className="info-item"><strong>Category</strong><span>{match.category}</span></div>
            <div className="info-item"><strong>Competition</strong><span>{match.competition}</span></div>
            <div className="info-item"><strong>Date</strong><span>{match.date}</span></div>
            <div className="info-item"><strong>Time</strong><span>{match.time}</span></div>
            <div className="info-item"><strong>Sport</strong><span>{match.sportName}</span></div>
            <div className="info-item"><strong>Markets</strong><span>{match.sideBets || markets.length}</span></div>
          </div>*/}
          {markets.length > 0 && (
            <>
              {/*<h2>Top Markets</h2>*/}
              <div className="markets-preview">
                {markets.slice(0, 3).map((m, i) => (
                  <div className="market-block" key={i}>
                    <h4>{m.name}</h4>
                    <div className="market-odds">
                      {m.odds?.map((o, j) => (
                        <button
                          key={j}
                          className={`odd-pill ${isPicked(m.name, o.display) ? "selected" : ""}`}
                          onClick={() => o.value && pickOdd(m.name, o.display, o.value)}
                        >
                          <span className="odd-label">{o.display}</span>
                          <span className="odd-value">{o.value ? o.value.toFixed(2) : "-"}</span>
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
          {/*<h2>All Markets ({markets.length})</h2>*/}
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
                        className={`odd-pill ${isPicked(m.name, o.display) ? "selected" : ""}`}
                        onClick={() => o.value && pickOdd(m.name, o.display, o.value)}
                      >
                        <span className="odd-label">{o.display}</span>
                        <span className="odd-value">{o.value ? o.value.toFixed(2) : "-"}</span>
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
          <div className="no-data">Statistics will be available once the match starts.</div>
        </div>
      )}
    </div>
  );
}

export default Detail;
