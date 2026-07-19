import React from 'react'
import './MatchDetails.scss'

function MatchDetails() {
    const stats = [
        {
            id: "7",
            statTitle: "Possession",
            homeValue: "58%",
            awayValue: "42%"
        },
        {
            id: "1",
            statTitle: "Shots",
            homeValue: "14",
            awayValue: "9"
        },
        {
            id: "2",
            statTitle: "Shots on Target",
            homeValue: "6",
            awayValue: "4"
        },
        {
            id: "3",
            statTitle: "Shots off Target",
            homeValue: "5",
            awayValue: "3"
        },
        {
            id: "4",
            statTitle: "Corners",
            homeValue: "5",
            awayValue: "7"
        },
        {
            id: "5",
            statTitle: "Fouls",
            homeValue: "7",
            awayValue: "3"
        },
        {
            id: "6",
            statTitle: "Offsides",
            homeValue: "2",
            awayValue: "1"
        }
    ]

    const events = [
        {
            id: "1",
            title: "Goal! Arsenal 1-0",
            time: "23",
            type: "goal",
            person: "Bukayo Saka"
        },
        {
            id: "2",
            title: "Goal! Manchester United 1-1",
            time: "37",
            type: "goal",
            person: "Marcus Rashford"
        },
        {
            id: "3",
            title: "Yellow card",
            time: "45+2",
            type: "card",
            person: "Bruno Fernandes"
        },
        {
            id: "4",
            title: "Goal! Arsenal 2-1",
            time: "52",
            type: "goal",
            person: "Martin Ødegaard"
        }
    ]

  return (
    <div className="tab-content active" id="match-details">
        <h2>Match Statistics</h2>
        <div className="stats">
            {
                stats.map(stat => {
                    return (<div className="stat-row" key={stat.id}>
                        <div className="stat-label">{stat.statTitle}</div>
                        <div className="stat-bars">
                            <div className="stat-bar home" style={{
                                width: stat.statTitle === "Possession" ? stat.homeValue : `${(parseInt(stat.homeValue) * 100) / (parseInt(stat.homeValue) + parseInt(stat.awayValue))}%`
                            }}></div>
                            <div className="stat-bar away" style={{
                                width: stat.statTitle === "Possession" ? stat.awayValue : `${(parseInt(stat.awayValue) * 100) / (parseInt(stat.homeValue) + parseInt(stat.awayValue))}%`
                            }}></div>
                        </div>
                        <div className="stat-value">{stat.statTitle === "Possession" ? stat.awayValue : `${stat.homeValue}-${stat.awayValue}`}</div>
                    </div>)
                })
            }
        </div>

        <h2>Match Events</h2>
        <div className="events">
            {
                events.map(event => {
                    return (<div className="event" key={event.id}>
                        <div className="event-time">{event.time}'</div>
                        <div className="event-icon">
                            {
                                event.type === "goal" ? <i className="fas fa-futbol"></i> : <i className="fas fa-yellow-card"></i>
                            }
                        </div>
                        <div className="event-description">{event.title}{event.type === "card" ? "for" : ":"} {event.person}</div>
                    </div>)
                })
            }
        </div>
    </div>
  )
}

export default MatchDetails