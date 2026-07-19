import React, { useEffect } from 'react'
import './H2H.scss'

function H2H({ h2hData, loading }) {
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
    useEffect(() => {
        h2hData && console.log(h2hData)
    },[h2hData]);
  return (
    <div className="tab-content" id="h2h">
            <h2>Last 5 Meetings</h2>
            <div className="h2h-matches">
                {
                    h2hData.tournaments[0].events.map(event => {
                        return (<div className="h2h-match">
                            <div className="h2h-team">{event.homeTeam.name}</div>
                            <div className="h2h-score">{event.homeScore.display} - {event.awayScore.display}</div>
                            <div className="h2h-team">{event.awayTeam.name}</div>
                            <span className="h2h-date">{formatMatchDate(event.startTimestamp)}</span>
                        </div>)
                    })
                }
            </div>
        </div>
  )
}

export default H2H