import React, { useEffect } from 'react'
import './Lineup.scss'
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

function Lineup() {
    const breakpoint = useBreakpoint();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const homePlayers = [
        {
            id: "1",
            name: "David Raya",
            number: 1,
            position: "Goalkeeper",
            column: "column-0",
            row: "row-3"
        },
        {
            id: "2",
            name: "Ben White",
            number: 4,
            position: "Right Back",
            column: "column-1",
            row: "row-1"
        },
        {
            id: "3",
            name: "William Saliba",
            number: 2,
            position: "Center Back",
            column: "column-1",
            row: "row-2"
        },
        {
            id: "4",
            name: "M Gabriel",
            number: 6,
            position: "Center Back",
            column: "column-1",
            row: "row-4"
        },
        {
            id: "5",
            name: "Oleksandr Zinchenko",
            number: 35,
            position: "Left Back",
            column: "column-1",
            row: "row-5"
        },
        {
            id: "6",
            name: "Martin Ødegaard",
            number: 8,
            position: "Central Midfield",
            column: "column-2",
            row: "row-1"
        },
        {
            id: "7",
            name: "Declan Rice",
            number: 41,
            position: "Defensive Midfield",
            column: "column-2",
            row: "row-3"
        },
        {
            id: "8",
            name: "Kai Havertz",
            number: 29,
            position: "Central Midfield",
            column: "column-2",
            row: "row-5"
        },
        {
            id: "9",
            name: "Bukayo Saka",
            number: 7,
            position: "Right Wing",
            column: "column-3",
            row: "row-2"
        },
        {
            id: "10",
            name: "Gabriel Jesus",
            number: 9,
            position: "Striker",
            column: "column-4",
            row: "row-3"
        },
        {
            id: "11",
            name: "Gabriel Martinelli",
            number: 11,
            position: "Left Wing",
            column: "column-3",
            row: "row-4"
        },
    ]

    const handleClick = () => {
        console.log(breakpoint)
    }


    const getPlayerClasses = (player) => {
        const columnClass = breakpoint === 'xs' ? `${player.column}-responsive` : player.column;
        const rowClass = breakpoint === 'xs' ? `${player.row}-responsive` : player.row;
        return `${columnClass} ${rowClass}`;
    };

  return (
    <div className="tab-content" id="lineup">
            <div className="lineup-container">
                    <h3 className="lineup-team-name" onClick={handleClick}>
                        <span>Arsenal</span>
                        <span className="formation">Formation: 4-3-3</span>
                        <span>Manchester United</span>
                        <span className="formation">Formation: 4-2-3-1</span>
                    </h3>
                    <div className="pitch">

                        {
                            homePlayers.map(player => {
                                return (<div className={`player home ${getPlayerClasses(player)}`}
                                    data-player={player.name.split(" ")[1]}
                                >
                                    <span>{player.number}</span>
                                    <div className="player-details">
                                        <div className="player-name">{player.name}</div>
                                        <div className="player-position">{player.position}</div>
                                    </div>
                                </div>)
                            })
                        }
                        <div className="goal-post home"></div>
                        <div className="goal-post away"></div>
                        <div className="center-circle"></div>
                        <div className="center-line"></div>
                        <div className="center-dot"></div>

                        {/* Manchester United Players */}
                        {
                            homePlayers.map(player => {
                                return (
                                    <div
                                        className={`player away ${getPlayerClasses(player)}`}
                                        data-player={player.name.split(" ")[1]}
                                    >
                                    <span>{player.number}</span>
                                    <div className="player-details">
                                        <div className="player-name">{player.name}</div>
                                        <div className="player-position">{player.position}</div>
                                    </div>
                                </div>)
                            })
                        }
                    </div>
            </div>
        </div>
  )
}

export default Lineup