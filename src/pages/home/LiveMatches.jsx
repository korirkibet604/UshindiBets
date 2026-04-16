import "./Home.scss";
import Controls from "../../components/controls/Controls";
import { NavLink, useNavigate } from "react-router-dom";
import { useLiveEvents } from "../../hooks/useLiveEvents";
import { useEffect, useState } from "react";

function LiveMatches() {
  const navigate = useNavigate();
  const [isPolling, setIsPolling] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { events, loading, error, refetch, startPolling, stopPolling } =
    useLiveEvents("football", 15000);
  const [leagues, setLeagues] = useState(null);

  const togglePolling = () => {
    if (isPolling) {
      stopPolling();
      setIsPolling(false);
    } else {
      startPolling();
      setIsPolling(true);
    }
  };

  // Helper functions
  const formatElapsedTime = (
    currentPeriodStartTimestamp,
    isSecondHalf = false
  ) => {
    if (!currentPeriodStartTimestamp) return "00:00";

    const baseSeconds = Math.floor(
      (new Date().getTime() - currentPeriodStartTimestamp * 1000) / 1000
    );
    const totalSeconds = isSecondHalf ? baseSeconds + 45 * 60 : baseSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatMatchDate = (timestamp) => {
    const matchDate = new Date(timestamp * 1000);
    const today = new Date();

    if (
      matchDate.getDate() === today.getDate() &&
      matchDate.getMonth() === today.getMonth() &&
      matchDate.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    }

    return matchDate
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .replace(/(\d+)/, (day) => {
        const d = parseInt(day);
        return (
          d +
          (d % 10 === 1 && d !== 11
            ? "st"
            : d % 10 === 2 && d !== 12
            ? "nd"
            : d % 10 === 3 && d !== 13
            ? "rd"
            : "th")
        );
      });
  };

  // Extract unique leagues from events
  useEffect(() => {
    const allLeagues = new Map();

    if (events) {
      events.forEach((event) => {
        if (event.tournament && !allLeagues.has(event.tournament.id)) {
          allLeagues.set(event.tournament.id, {
            id: event.tournament.id,
            name: event.tournament.name,
            slug: event.tournament.slug,
            category: event.tournament.category,
            uniqueTournament: event.tournament.uniqueTournament,
            priority: event.tournament.priority,
            icon: "fa-futbol",
          });
        }
      });
    }

    setLeagues(Array.from(allLeagues.values()));
  }, [events]);

  // Filter live events based on league and search
  const filteredEvents = events
    ? events.filter((event) => {
        /*if (selectedLeague && event.tournament.id !== selectedLeague.id) {
            return false;
        }*/

        if (searchQuery) {
          return (
            event.home_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.away_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.competition_name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          );
        }

        return true;
      })
    : null;

  return (
    <div className="main-content">
      <Controls
        isLive={true}
        leagues={leagues}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedLeague={selectedLeague}
        onLeagueChange={setSelectedLeague}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Polling Controls */}
      <div className="section-header">
        <NavLink className="view-all" onClick={togglePolling}>
          {isPolling ? "Pause Updates" : "Resume Updates"}
        </NavLink>
        <NavLink className="view-all" onClick={refetch}>
          <i className="fas fa-redo"></i> Refresh Now
        </NavLink>
      </div>

      {/* Live Matches */}
      <div className="section-header">
        {/*<h2><i className="fas fa-bolt"></i> Live Matches</h2>*/}
        <h2 className={`polling-indicator ${isPolling ? "active" : "paused"}`}>
          {isPolling ? (
            <>
              <i className="fas fa-sync fa-spin"></i> Live updates every 15s
            </>
          ) : (
            <>
              <i className="fas fa-pause"></i> Updates paused
            </>
          )}
        </h2>
        <span className="view-all">
          {filteredEvents ? filteredEvents.length : 0} matches
        </span>
      </div>

      <div className="matches-grid">
        {
          filteredEvents && filteredEvents.map((event) => (
              <div
                className="match-card live"
                key={event.match_id}
                onClick={() => navigate(`/live/${event.match_id}`)}
              >
                <div className="match-status">
                  <span>
                    {event.competition_name} • {event.category}
                  </span>
                  {event.live_match_status === 1 ? (
                    <div className="live-indicator">
                      <i className="fas fa-circle"></i> LIVE
                    </div>
                  ) : (
                    <span>Not Started</span>
                  )}
                  {/*event.live_match_status === 1 ? (
                    <div className="live-indicator">
                      <i className="fas fa-circle"></i>
                      {event.match_time === "0"
                        ? event.event_status
                        : `${event.match_time}'`}
                    </div>
                  ) : (
                    <span>
                      {new Date(event.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )*/}
                </div>
                <div className="match-teams">
                  <div className="team">
                    <div className="team-name">{event.home_team}</div>
                  </div>
                  <div className="match-score">
                    <div className="score">
                      <span>{event.current_score.split(":")[0]}</span>-
                      <span>{event.current_score.split(":")[1]}</span>
                    </div>
                    <div className="match-time">
                      {event.live_match_status === 1
                        ? event.match_time === "0"
                          ? event.event_status
                          : `${event.match_time}'`
                        : new Date(event.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </div>
                  </div>
                  <div className="team">
                    <div className="team-name">{event.away_team}</div>
                  </div>
                </div>
                <div className="betting-options">
                  {
                    event.odds && event.odds[0]?.odds ? (
                    <>
                      <div className="bet-option">
                        <div className="option-name">
                          {event.odds[0].odds[0]?.display || "Home"}
                        </div>
                        <div className="option-odds">
                          {event.odds[0].odds[0]?.odd_value || event.home_odd}
                        </div>
                      </div>
                      <div className="bet-option">
                        <div className="option-name">
                          {event.odds[0].odds[1]?.display || "Draw"}
                        </div>
                        <div className="option-odds">
                          {event.odds[0].odds[1]?.odd_value ||
                            event.neutral_odd}
                        </div>
                      </div>
                      <div className="bet-option">
                        <div className="option-name">
                          {event.odds[0].odds[2]?.display || "Away"}
                        </div>
                        <div className="option-odds">
                          {event.odds[0].odds[2]?.odd_value || event.away_odd}
                        </div>
                      </div>
                    </>
                  ) :  <>
                      <div className="bet-option">
                        <div className="option-name">1</div>
                        <div className="option-odds">{event.home_odd}</div>
                      </div>
                      <div className="bet-option">
                        <div className="option-name">X</div>
                        <div className="option-odds">{event.neutral_odd}</div>
                      </div>
                      <div className="bet-option">
                        <div className="option-name">2</div>
                        <div className="option-odds">{event.away_odd}</div>
                      </div>
                    </>
                  }
                </div>
              </div>
            ))
          /*) : (
                    <div className="no-matches">No live matches found</div>
                )*/
        }
      </div>
    </div>
  );
}

export default LiveMatches;
