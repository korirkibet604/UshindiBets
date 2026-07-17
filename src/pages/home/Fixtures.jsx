import "./Home.scss";
import Controls from "../../components/controls/Controls";
import { useState, useMemo } from "react";
import { useBetikaMatches } from "../../hooks/useBetikaMatches";
import { useNavigate } from "react-router-dom";
import { normalizeMatches, extractLeagues } from "../../utils/matchUtils";
import { useBetslip } from "../../context/BetslipContext";

function Fixtures() {
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { matches, loading, error } = useBetikaMatches({ limit: 500, pollInterval: 120000 });
  const { addSelection, selections } = useBetslip();
  const navigate = useNavigate();

  const normalized = useMemo(() => normalizeMatches(matches), [matches]);
  const leagues = useMemo(() => extractLeagues(normalized), [normalized]);

  const filtered = useMemo(() => {
    let list = normalized;
    if (selectedLeague) list = list.filter((m) => m.league === selectedLeague.name);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.homeTeam?.toLowerCase().includes(q) ||
          m.awayTeam?.toLowerCase().includes(q) ||
          m.league?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [normalized, selectedLeague, searchQuery]);

  const isPicked = (matchId, market, pick) =>
    selections.some((s) => s.matchId === matchId && s.market === market && s.pick === pick);

  const pickOdd = (match, market, pick, odds) =>
    addSelection({
      matchId: match.id,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      market,
      pick,
      odds,
    });

  return (
    <div className="main-content">
      <Controls
        isLive={false}
        leagues={leagues}
        selectedLeague={selectedLeague}
        onLeagueChange={setSelectedLeague}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="section-header">
        <h2><i className="fas fa-calendar-alt"></i> All Fixtures</h2>
        <span className="view-all">{loading ? "Loading..." : `${filtered.length} matches`}</span>
      </div>

      {error && <div className="no-matches">Unable to load fixtures: {error}. Retrying...</div>}

      <div className="matches-grid">
        {!loading && filtered.length === 0 && !error && (
          <div className="no-matches">No fixtures found for the selected filters.</div>
        )}
        {filtered.map((match) => (
          <div className="match-card" key={match.id} onClick={() => navigate(`/live/${match.id}`)}>
            <div className="match-status">
              <span>{match.league} • {match.competition}</span>
              <span>{match.date} {match.time}</span>
            </div>
            <div className="match-teams">
              <div className="team">
                <div className="team-name">{match.homeTeam}</div>
              </div>
              <div className="match-score">
                <div className="score">-:-</div>
                <div className="match-time">{match.time || "TBD"}</div>
              </div>
              <div className="team">
                <div className="team-name">{match.awayTeam}</div>
              </div>
            </div>
            <div className="betting-options" onClick={(e) => e.stopPropagation()}>
              <div
                className={`bet-option ${isPicked(match.id, "1X2", "1") ? "selected" : ""}`}
                onClick={() => match.odds.home && pickOdd(match, "1X2", "1", match.odds.home)}
              >
                <div className="option-name">1</div>
                <div className="option-odds">{match.odds.home ? match.odds.home.toFixed(2) : "-"}</div>
              </div>
              <div
                className={`bet-option ${isPicked(match.id, "1X2", "X") ? "selected" : ""}`}
                onClick={() => match.odds.draw && pickOdd(match, "1X2", "X", match.odds.draw)}
              >
                <div className="option-name">X</div>
                <div className="option-odds">{match.odds.draw ? match.odds.draw.toFixed(2) : "-"}</div>
              </div>
              <div
                className={`bet-option ${isPicked(match.id, "1X2", "2") ? "selected" : ""}`}
                onClick={() => match.odds.away && pickOdd(match, "1X2", "2", match.odds.away)}
              >
                <div className="option-name">2</div>
                <div className="option-odds">{match.odds.away ? match.odds.away.toFixed(2) : "-"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Fixtures;
