// Player.jsx
import { useLocation } from 'react-router-dom';
import { usePlayer } from '../../hooks/usePlayer';
import { useEffect, useState } from 'react';
import './Player.scss'

export default function Player() {
    const location = useLocation();
    const [playerId, setPlayerId] = useState(null);
    const [tournamentId, setTournamentId] = useState(null);
    const [seasonId, setSeasonId] = useState(null);
    const [tab, setTab] = useState('Overview');


  const tabs = [
    "Overview",
    "Statistics",
    "Transfers",
    "Career"
  ]

  // Extract player ID from URL when location is available
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const idFromPath = pathParts[pathParts.length - 1];

    console.log('Extracted player ID:', idFromPath); // Debug log

    if (idFromPath && !isNaN(idFromPath)) {
      const id = parseInt(idFromPath);
      setPlayerId(id);
      console.log('Setting playerId to:', id); // Debug log
    } else {
      setPlayerId(null);
    }
  }, [location.pathname]);

    const { player, transferHistory, loading, error } = usePlayer(playerId);

  // Debug logs to track state changes
  useEffect(() => {
    console.log('Current state:', {
      playerId,
      player,
      loading,
      error,
        hasPlayer: !!player,
      transferHistory,
    });

    /*if (player && player.statistics?.[0].seasons?.[0]?.uniqueTournamentId) {
        setTournamentId(player.statistics?.[0].seasons?.[0]?.uniqueTournamentId);
        setSeasonId(player.statistics?.[0].seasons?.[0]?.uniqueTournamentId)
    } else {
        setPlayerId(null);
    }*/
  }, [playerId, player, loading, error]);

    const returnPosition = (position) => {
        switch (position) {
            case 'G':
                return "Goalkeeper";
            case 'D':
                return "Defender";
            case 'M':
                return "Midfielder";
            case 'F':
                return "Forward";
            default:
                return position;
        }
    }

    function findFirstActiveTournamentName(statisticsArray) {
        // 1. Iterate through each tournament in the statistics array
        for (const tournament of statisticsArray) {
          // 2. Iterate through the seasons of the current tournament
          for (const season of tournament.seasons) {
            // 3. Check if the current season is active
            if (season.active === true) {
              // 4. If an active season is found, return the name of the tournament immediately
              return tournament.uniqueTournamentName;
            }
          }
          // If a tournament has no active seasons, the loops continue to the next tournament
        }

        // 5. If no active season is found in any tournament after checking all of them
        return null;
      }

  // Show loading state when extracting ID or fetching data
  if (loading || !playerId) {
    return (
      <div className="player-screen loading">
        <div className="loading-spinner">
          <p>Loading player data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-screen error">
        <h2>Error loading player</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="player-screen not-found">
        <h2>Player not found</h2>
        <p>The requested player could not be found.</p>
      </div>
    );
    }

    const formatHistoryDate = (timestamp) => {
        const historyDate = new Date(timestamp * 1000);
        const today = new Date();

        if (historyDate.getDate() === today.getDate() &&
            historyDate.getMonth() === today.getMonth() &&
            historyDate.getFullYear() === today.getFullYear()) {
            return "Today";
        }

        return historyDate.toLocaleDateString('en-GB', {
            //day: 'numeric',
            month: 'short',
            year: 'numeric'
        })/*.replace(/(\d+)/, (day) => {
            const d = parseInt(day);
            return d + (d % 10 === 1 && d !== 11 ? 'st' :
                d % 10 === 2 && d !== 12 ? 'nd' :
                d % 10 === 3 && d !== 13 ? 'rd' : 'th');
        });*/
    };

  return (
    <div className="player-screen">
      <div class="player-header">
        <div class="container">
            <div class="header-top">
                <a href="javascript:history.back()" class="back-link">
                    <i class="fas fa-chevron-left"></i>
                    <span>Back</span>
                </a>
                <div class="header-actions">
                    <button><i class="far fa-star"></i></button>
                    <button><i class="fas fa-share-alt"></i></button>
                </div>
            </div>

            {/* Player Basic Info */}
            <div class="player-basic">
                <div class="player-avatar">
                    <img src={`https://img.sofascore.com/api/v1/player/${playerId && playerId}/image`} alt={player && player.name} />
                </div>
                <div class="player-info">
                    <h1 class="player-name">{player.name}</h1>
                    <div class="player-meta">
                        <div class="player-meta-item">
                            <img src={`https://img.sofascore.com/api/v1/country/${player.team?.flag.slice(0, 2).toUpperCase()}/flag`} alt={player && player.name} />
                            <span>{player.team.flag}</span>
                        </div>
                        <div class="player-meta-item">
                            {returnPosition(player.position)}
                        </div>
                        <div class="player-meta-item">#{player.shirtNumber}</div>

                    </div>
                </div>
            </div>

            {/* Player Stats Overview */}
            <div class="player-stats-overview">
                <div class="stat-card">
                    <div class="stat-value">{player.age}</div>
                    <div class="stat-label">Age</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-value">{player.height}cm</div>
                    <div class="stat-label">Height</div>
                </div>
                <div class="stat-card yellow">
                    <div class="stat-value">{player.weight}kg</div>
                    <div class="stat-label">Weight</div>
                </div>
            </div>
        </div>
    </div>
    <main class="container">
        {/* Tabs */}
        <div class="tabs-container">
            <div class="tabs">
              {
                tabs.map(item => {
                  return (<button id="overview-tab"
                    key={tabs[item]}
                    className={`tab-button ${item === tab ? 'active' : ''}`}
                    onClick={() => setTab(item)}
                  >{item}</button>)
                })
              }
            </div>
        </div>
        <div class="tab-content">
  {(() => {
    switch (tab) {
      case 'Overview':
        return (
          <div id="overview-content">
            {/* Player Info Grid */}
            <div class="card">
                <div class="card-header">
                    <h3>Player Information</h3>
                </div>
                <div class="card-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Date of Birth</strong>
                            <span>{player.dateOfBirthFormated.split("(")[1].split(")")[0]}</span>
                        </div>
                        {/*<div class="info-item">
                            <strong>Place of Birth</strong>
                            <span>Leeds, England</span>
                        </div>*/}
                        <div class="info-item">
                            <strong>Country</strong>
                            <span>{player.flag}</span>
                        </div>
                        <div class="info-item">
                            <strong>Preferred Foot</strong>
                            <span>{player.preferredFoot}</span>
                        </div>
                        <div class="info-item">
                            <strong>Market Value</strong>
                            <span style={{color: "#16a34a"}}>€{player.proposedMarketValue/1000000}M</span>
                        </div>
                        {/*<div class="info-item">
                            <strong>Agent</strong>
                            <span>Rafaela Pimenta</span>
                        </div>*/}
                    </div>
                </div>
            </div>

            {/* Current Team */}
              {player.team && (<div class="card">
                <div class="card-header">
                    <h3>Current Team</h3>
                </div>
                <div class="card-body">
                    <div class="current-team">
                        <img
                            src={`https://img.sofascore.com/api/v1/team/${player.team.id}/image`}
                            alt="" className="team-logo"/>
                        <div class="team-details">
                            <h4>{player.team.name}</h4>
                            <p>{findFirstActiveTournamentName(player.statistics && player.statistics)}</p>
                            {/*<p>Joined: 2022 | Contract: 2027</p>*/}
                        </div>
                    </div>
                </div>
            </div>)}

            {/* Player Attributes */}
            <div class="card">
                <div class="card-header">
                    <h3>Player Attributes</h3>
                </div>

                <div class="card-body">
                {
                  player.abilityData?.map(data => {
                    return (<div class="progress-item">
                        <div class="progress-header">
                          <span>{data.name}</span>
                          <span>{data.value}</span>
                        </div>
                        <div class="progress-bar-container">
                          <div class="progress-bar" style={{width: `${data.value}%`}}></div>
                        </div>
                      </div>);
                  })
                }</div>
            </div>
          </div>
        );

      case 'Statistics':
        return (
          <div id="stats-content">
            {/* Season Statistics */}
            <div class="card">
                <div class="card-header">
                    <h3>Season Statistics 2023/24</h3>
                </div>
                <div class="card-body">
                    <div class="stats-grid">
                        <div class="stat-card-large blue">
                            <div class="stat-value-large">36</div>
                            <div class="stat-label-large">Appearances</div>
                        </div>
                        <div class="stat-card-large green">
                            <div class="stat-value-large">27</div>
                            <div class="stat-label-large">Goals</div>
                        </div>
                        <div class="stat-card-large yellow">
                            <div class="stat-value-large">5</div>
                            <div class="stat-label-large">Assists</div>
                        </div>
                        <div class="stat-card-large purple">
                            <div class="stat-value-large">82%</div>
                            <div class="stat-label-large">Pass Accuracy</div>
                        </div>
                    </div>

                    {/* Detailed Stats */}
                    <div>
                        <div class="list-item">
                            <span class="font-medium">Minutes Played</span>
                            <span class="font-bold">2,890</span>
                        </div>
                        <div class="list-item">
                            <span class="font-medium">Shots</span>
                            <span class="font-bold">108</span>
                        </div>
                        <div class="list-item">
                            <span class="font-medium">Shots on Target</span>
                            <span class="font-bold">67</span>
                        </div>
                        <div class="list-item">
                            <span class="font-medium">Conversion Rate</span>
                            <span class="font-bold">25%</span>
                        </div>
                        <div class="list-item">
                            <span class="font-medium">Yellow Cards</span>
                            <span class="font-bold">3</span>
                        </div>
                        <div class="list-item">
                            <span class="font-medium">Red Cards</span>
                            <span class="font-bold">0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div class="card">
                <div class="card-header">
                    <h3>Performance Rating</h3>
                </div>
                <div class="card-body">
                    <div class="rating-container">
                        <span class="font-medium">Overall Rating</span>
                        <div class="rating-display">
                            <span class="rating-value">8.4</span>
                            <div class="rating-stars">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star-half-alt"></i>
                            </div>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar animated" style={{width: "84%"}}></div>
                    </div>

                    <div class="rating-breakdown">
                        <div class="rating-item">
                            <div class="rating-item-value">8.7</div>
                            <div class="rating-item-label">Home</div>
                        </div>
                        <div class="rating-item">
                            <div class="rating-item-value">8.1</div>
                            <div class="rating-item-label">Away</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );

      case 'Transfers':
        return (
          <div id="transfers-content">
            {/* Transfer History */}
            <div class="card">
                <div class="card-header">
                    <h3>Transfer History</h3>
                </div>
                <div class="card-body">
                        {/* Transfer 1 */}
                    {
                        transferHistory && transferHistory.map(history => {
                            return (<div class="transfer-item">
                                <div class="transfer-team">
                                    <img src={`https://img.sofascore.com/api/v1/team/${history.to.id}/image`}
                                        alt="" className="team-logo-small"/>
                                    <div class="transfer-details">
                                        <h4>{history.to.name}</h4>
                                        <p>{formatHistoryDate(history.transferDateTimestamp)}</p>
                                    </div>
                                </div>
                                <div class="transfer-value">
                                    <div class="transfer-amount">{history.transferFeeDescription}</div>
                                    <div className="transfer-type">
                                        {/*transferHistory && transferHistory === 1 ? "Transfer" :
                                            transferHistory === 3 ? "Transfer" : "Loan"*/ transferHistory.type}
                                    </div>
                                </div>
                            </div>);
                        })
                    }
                </div>
            </div>
          </div>
        );

      case 'Career':
        return (
          <div id="career-content">
            {/* Career Stats */}
            <div class="card">
                <div class="card-header">
                    <h3>Career Statistics</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>Team</th>
                                    <th style={{textAlign: "center"}}>Apps</th>
                                    <th style={{textAlign: "center"}}>Goals</th>
                                    <th style={{textAlign: "center"}}>Assists</th>
                                    <th style={{textAlign: "center"}}>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>2023/24</td>
                                    <td>
                                        <div class="team-cell">
                                            <div class="team-logo-xs blue">MCI</div>
                                            <span>Man City</span>
                                        </div>
                                    </td>
                                    <td style={{textAlign: "center"}}>36</td>
                                    <td style={{textAlign: "center"}} class="highlight">27</td>
                                    <td style={{textAlign: "center"}}>5</td>
                                    <td style={{textAlign: "center"}} class="rating">8.4</td>
                                </tr>
                                {/* ... rest of career table rows ... */}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Career Timeline */}
            <div class="card">
                <div class="card-header">
                    <h3>Career Timeline</h3>
                </div>
                <div class="card-body">
                    <div class="timeline">
                        {/* Timeline Item 1 */}
                        <div class="timeline-item">
                            <div class="timeline-marker blue">2022</div>
                            <div class="timeline-content">
                                <h4>Manchester City</h4>
                                <p>Transfer: €60M</p>
                                <small>Premier League, Champions League</small>
                            </div>
                        </div>
                        {/* ... rest of timeline items ... */}
                    </div>
                </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab</div>;
    }
  })()}
</div>
    </main>
    </div>
  );
}