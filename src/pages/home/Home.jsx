import './Home.scss'
import Controls from '../../components/controls/Controls'
import { NavLink, useNavigate } from 'react-router-dom'
import { BETTING_FREE } from '../../constants'
import { useLiveEvents } from '../../hooks/useLiveEvents';
import { useEffect, useState } from 'react';
import { useScheduledEvents } from '../../hooks/useScheduledEvents';

function Home() {
    const navigate = useNavigate();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { events, loading, error } = useLiveEvents('football', 30000);
    const { fixtures, fixturesLoading, fixturesError } = useScheduledEvents(selectedDate.toISOString().split('T')[0]);
    const [recent, setRecent] = useState(null);
    const [upcoming, setUpcoming] = useState(null);
    const [leagues, setLeagues] = useState(null);

    // Helper functions
    const formatElapsedTime = (currentPeriodStartTimestamp, isSecondHalf = false) => {
        if (!currentPeriodStartTimestamp) return "00:00";

        const baseSeconds = Math.floor((new Date().getTime() - (currentPeriodStartTimestamp * 1000)) / 1000);
        const totalSeconds = isSecondHalf ? baseSeconds + (45 * 60) : baseSeconds;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatMatchDate = (timestamp) => {
        const matchDate = new Date(timestamp * 1000);
        const today = new Date();

        if (matchDate.getDate() === today.getDate() &&
            matchDate.getMonth() === today.getMonth() &&
            matchDate.getFullYear() === today.getFullYear()) {
            return "Today";
        }

        return matchDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).replace(/(\d+)/, (day) => {
            const d = parseInt(day);
            return d + (d % 10 === 1 && d !== 11 ? 'st' :
                d % 10 === 2 && d !== 12 ? 'nd' :
                d % 10 === 3 && d !== 13 ? 'rd' : 'th');
        });
    };

    // Extract unique leagues from events and fixtures
    useEffect(() => {
        const allLeagues = new Map();

        // Add leagues from live events
        /*if (events) {
            console.log(events)
            events.forEach(event => {
                if (event.tournament && !allLeagues.has(event.tournament.id)) {
                    allLeagues.set(event.tournament.id, {
                        id: event.tournament.id,
                        name: event.tournament.name,
                        slug: event.tournament.slug,
                        category: event.tournament.category,
                        uniqueTournament: event.tournament.uniqueTournament,
                        priority: event.tournament.priority,
                        icon: "fa-futbol"
                    });
                }
            });
        }

        // Add leagues from fixtures
        if (fixtures) {
            fixtures.forEach(fixture => {
                if (fixture.tournament && !allLeagues.has(fixture.tournament.id)) {
                    allLeagues.set(fixture.tournament.id, {
                        id: fixture.tournament.id,
                        name: fixture.tournament.name,
                        slug: fixture.tournament.slug,
                        category: fixture.tournament.category,
                        uniqueTournament: fixture.tournament.uniqueTournament,
                        priority: fixture.tournament.priority,
                        icon: "fa-futbol"
                    });
                }
            });
        }
        setLeagues(Array.from(allLeagues.values()));*/
    }, [events, fixtures]);

    // Filter fixtures based on status, league, and search
    useEffect(() => {
        let filteredFixtures = fixtures;

        // Apply league filter
        if (selectedLeague && filteredFixtures) {
            filteredFixtures = filteredFixtures.filter(fixture =>
                fixture.tournament.id === selectedLeague.id
            );
        }

        // Apply search filter
        if (searchQuery && filteredFixtures) {
            filteredFixtures = filteredFixtures.filter(fixture =>
                fixture.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fixture.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fixture.tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filteredFixtures) {
            setUpcoming(filteredFixtures.filter(fixture =>
                fixture.status.type === "notstarted"
            ));
            setRecent(filteredFixtures.filter(fixture =>
                fixture.status.type === "finished"
            ));
        }
    }, [fixtures, selectedLeague, searchQuery]);

    // Filter live events based on league and search
    const filteredEvents = events ? events.filter(event => {
        // Apply league filter
        if (selectedLeague && event.tournament.id !== selectedLeague.id) {
            return false;
        }

        // Apply search filter
        if (searchQuery) {
            return (
                event.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return true;
    }) : null;

    return (
        <div className="main-content">
            {/*<Controls
                isLive={true}
                leagues={leagues}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedLeague={selectedLeague}
                onLeagueChange={setSelectedLeague}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

             Live Matches Section 
            <div className="section-header">
                <h2><i className="fas fa-bolt"></i> Live Matches</h2>
                <NavLink to="/live" className="view-all">View All {filteredEvents && filteredEvents.length} <i class="fas fa-solid fa-arrow-right"></i></NavLink>
            </div>*/}

            <div className="matches-grid">
                {/*filteredEvents && filteredEvents.length > 0 ? (
                    filteredEvents.slice(0, 5)*/events && events.map(event => (
    <div className="match-card live" key={event.match_id} onClick={() => navigate(`/live/${event.match_id}`)}>
        <div className="match-status">
            <span>{event.competition_name} • {event.category}</span>
            {event.live_match_status === 1 ?
                <div className="live-indicator">
                    <i className="fas fa-circle"></i> LIVE
                </div>
                : <span>Not Started</span>
            }
        </div>
        <div className="match-teams">
            <div className="team">
                <div className="team-name">{event.home_team}</div>
            </div>
            <div className="match-score">
                <div className="score">
                    <span>{event.current_score.split(':')[0]}</span>
                    -
                    <span>{event.current_score.split(':')[1]}</span>
                </div>
                <div className="match-time">
                    {event.live_match_status === 1 ? 
                        (event.match_time === "0" ? event.event_status : `${event.match_time}'`)
                        : new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                    }
                </div>
            </div>
            <div className="team">
                <div className="team-name">{event.away_team}</div>
            </div>
        </div>
        <div className="betting-options">
            {event.odds && event.odds[0]?.odds ? (
                <>
                    <div className="bet-option">
                        <div className="option-name">{event.odds[0].odds[0]?.display || "Home"}</div>
                        <div className="option-odds">{event.odds[0].odds[0]?.odd_value || event.home_odd}</div>
                    </div>
                    <div className="bet-option">
                        <div className="option-name">{event.odds[0].odds[1]?.display || "Draw"}</div>
                        <div className="option-odds">{event.odds[0].odds[1]?.odd_value || event.neutral_odd}</div>
                    </div>
                    <div className="bet-option">
                        <div className="option-name">{event.odds[0].odds[2]?.display || "Away"}</div>
                        <div className="option-odds">{event.odds[0].odds[2]?.odd_value || event.away_odd}</div>
                    </div>
                </>
            ) : (
                <>
                    <div className="bet-option">
                        <div className="option-name">Home</div>
                        <div className="option-odds">{event.home_odd}</div>
                    </div>
                    <div className="bet-option">
                        <div className="option-name">Draw</div>
                        <div className="option-odds">{event.neutral_odd}</div>
                    </div>
                    <div className="bet-option">
                        <div className="option-name">Away</div>
                        <div className="option-odds">{event.away_odd}</div>
                    </div>
                </>
            )}
        </div>
    </div>
))
                /*) : (
                    <div className="no-matches">No live matches found</div>
                )*/}
            </div>

            <div className="section-header">
                <h2><i className="fas fa-calendar-alt"></i> Upcoming Matches</h2>
                <NavLink to="/fixtures" className="view-all">View All {upcoming && upcoming.length} <i class="fas fa-solid fa-arrow-right"></i></NavLink>
            </div>

            <div className="matches-grid">
                {upcoming && upcoming.length > 0 ? (
                    upcoming.slice(0, 5).map(match => (
                        <div className="match-card" key={match.id}>
                            <div className="match-status">
                                <span>{match.tournament.name}</span>
                                <span>{formatMatchDate(match.startTimestamp)}</span>
                            </div>
                            <div className="match-teams">
                                <div className="team">
                                    <div className="team-name">{match.homeTeam.name}</div>
                                </div>
                                <div className="match-score">
                                    <div className="score">-:-</div>
                                    <div className="match-time">
                                        {new Date(match.startTimestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}
                                    </div>
                                </div>
                                <div className="team">
                                    <div className="team-name">{match.awayTeam.name}</div>
                                </div>
                            </div>
                            {
                                /*BETTING_FREE ? (<div className="match-info">
                                    <span><i className="fas fa-stadium"></i>{match.venue}</span>
                                </div>) :*/
                                    !BETTING_FREE && (<div className="betting-options">
                                        <div className="bet-option">
                                            <div className="option-name">Home</div>
                                            <div className="option-odds">1.84</div>
                                        </div>
                                        <div className="bet-option">
                                            <div className="option-name">Draw</div>
                                            <div className="option-odds">3.14</div>
                                        </div>
                                        <div className="bet-option">
                                            <div className="option-name">Away</div>
                                            <div className="option-odds">2.83</div>
                                        </div>
                                    </div>)
                            }
                        </div>
                    ))
                ) : (
                    <div className="no-matches">No upcoming matches found</div>
                )}
            </div>

            {!BETTING_FREE && (
                <>
                    <div className="section-header">
                        <h2><i className="fas fa-gift"></i> Special Offers</h2>
                        <NavLink to="/" className="view-all">View All</NavLink>
                    </div>

                    <div className="promotions">
                        <div className="promo-card">
                            <h3 className="promo-title">Welcome Bonus</h3>
                            <p className="promo-desc">Get £30 in free bets when you deposit and bet £10</p>
                            <button className="promo-btn">Claim Now</button>
                        </div>

                        <div className="promo-card">
                            <h3 className="promo-title">Acca Boost</h3>
                            <p className="promo-desc">Get up to 50% bonus on your accumulator wins</p>
                            <button className="promo-btn">Learn More</button>
                        </div>

                        <div className="promo-card">
                            <h3 className="promo-title">Free Bet Club</h3>
                            <p className="promo-desc">Earn free bets every week with our loyalty program</p>
                            <button className="promo-btn">Join Now</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Home;