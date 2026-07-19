import { useEffect } from 'react'
import './Lineups.scss'
import { useNavigate } from 'react-router-dom';

function Lineups({ match, lineups, loading }) {
    const navigate = useNavigate();

    useEffect(() => {
        lineups && console.log(lineups)
    }, [lineups])

  return (
    <div className="lineups">
        {lineups.confirmed && <div className="lineup">
            <div className="lineup-header">
                <img
                    src={`https://img.sofascore.com/api/v1/team/${match.homeTeam.id}/image`}
                    alt=""
                    className="team-logo"
                />
                <h3>{match.homeTeam.name} Lineup ({lineups.confirmed && lineups.homeFormation})</h3>
            </div>
            <div className="team-lineup">
                {
                    lineups.home.filter(player => !player.substitute).map(player => {
                        return (<div className="player" onClick={() => navigate(`/player/${player.player.id}`)}>
                            <div className="player-number" style={{ background: player.position === 1 && `linear-gradient(135deg, var(--accent), #${lineups.homeColor.goalkeeper.outline})`, color: player.position === 1 && `linear-gradient(135deg, var(--accent), #${lineups.homeColor.goalkeeper.number})` }}>{player.shirtNumber}</div>
                            <div className="player-name">{player.player.name}</div>
                            <div className="player-position">{player.positionName}</div>
                        </div>)
                    })
                }
            </div>
        </div>}

        {lineups.confirmed && <div className="lineup">
            <div className="lineup-header">
                <img
                    src={`https://img.sofascore.com/api/v1/team/${match.awayTeam.id}/image`}
                    alt=""
                    className="team-logo"
                />
                <h3>{match.awayTeam.name} Lineup ({lineups.confirmed && lineups.awayFormation})</h3>
            </div>
            <div className="team-lineup">
                {
                    lineups.away.filter(player => !player.substitute).map(player => {
                        return (<div className="player">
                            <div className="player-number" style={{ background: player.position === 1 && `linear-gradient(135deg, var(--accent), #${lineups.awayColor.goalkeeper.outline})`, color: player.position === 1 && `linear-gradient(135deg, var(--accent), #${lineups.homeColor.goalkeeper.number})` }}>{player.shirtNumber}</div>
                            <div className="player-name">{player.player.name}</div>
                            <div className="player-position">{player.positionName}</div>
                        </div>)
                    })
                }
            </div>
        </div>}
    </div>
  )
}

export default Lineups