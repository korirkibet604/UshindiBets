import React, { useEffect } from 'react'
import './MatchHeader.scss'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BETTING_FREE } from '../../../constants';

function MatchHeader({ match }) {
    const location = useLocation();
    const navigate = useNavigate();

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

  return (
    <div >
            <div className="detail-header">
                <button className="back-btn" id="backBtn" onClick={() => window.history.back()}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h2>Match Details</h2>
            </div>

            <div className="match-card live">
            <div className="match-status">
                    <span>{match.event.tournament.name}</span>
                    {match.event.status.type !== "inprogress" ?
                        <span>Finished</span> :
                        <div className="live-indicator">
                            <i className="fas fa-circle"></i> LIVE
                        </div>
                    }
                </div>
                <div className="match-teams">
                    <div className="team">
                        <img
                            src={`https://img.sofascore.com/api/v1/team/${match.event.homeTeam.id}/image`}
                            alt=""
                            className="team-logo"
                        />
                        <div className="team-name">{match.event.homeTeam.name}</div>
                    </div>
                    <div className="match-score">
                        <div className="score">
                            <span className={
                                match.event.status.type === "inprogress" &&
                                ["Started", "1st half", "2nd half"].includes(match.event.status.description) ? "live-score" : ""
                            }>
                                {match.event.homeScore.current}
                            </span>
                            -
                            <span className={
                                match.event.status.type === "inprogress" &&
                                ["Started", "1st half", "2nd half"].includes(match.event.status.description) ? "live-score" : ""
                            }>
                                {match.event.awayScore.current}
                            </span>
                        </div>
                        <div className="match-time">
                        {match.event.status.type === "inprogress" ?
                            (match.event.status.description === "Halftime" ? "HT" :
                            `${formatElapsedTime(match.event.time?.currentPeriodStartTimestamp, match.event.lastPeriod === "period2")}'`)
                            : new Date(match.event.startTimestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                        }
                        </div>
                    </div>
                    <div className="team">
                        <img
                            src={`https://img.sofascore.com/api/v1/team/${match.event.awayTeam.id}/image`}
                            alt=""
                            className="team-logo"
                        />
                        <div className="team-name">{match.event.awayTeam.name}</div>
                    </div>
                </div>
                {BETTING_FREE && <div className="match-info">
                    <span><i className="fas fa-stadium"></i>{match.event.venue?.name}</span>
                    <span><i className="fas fa-user"></i>{match.event.venue?.capacity}</span>
                    <span><i className="fas fa-whistle"></i> Michael Oliver</span>
                </div>}
                {BETTING_FREE && <NavLink to="/" className="highlight-btn">
                    <i className="fas fa-play-circle"></i> Watch Live
                </NavLink>}
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
    </div>
  )
}

export default MatchHeader