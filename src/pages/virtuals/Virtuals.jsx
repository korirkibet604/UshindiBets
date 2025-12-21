import React, { useEffect } from 'react'
import './Virtuals.scss'
import games from '../../games'

function Virtuals() {

  return (
    <div className="virtuals">
        {
            games.games.map((game, index) => {
                return (
                    <div className="virtual-card" key={index} style={{
                    }}>
                        <div className="virtual-logo">
                            <img src={game.squareX3.formats.thumbnail.url}/>
                        </div>
                        <div className="virtual-name">{game.title}</div>
                    </div>)
            })
        }
    </div>
  )
}

export default Virtuals