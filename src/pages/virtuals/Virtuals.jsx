import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Virtuals.scss'
import games from '../../games'

function Virtuals() {
  const navigate = useNavigate()

  return (
    <div className="virtuals">
      <div className="virtual-card plinko-card" onClick={() => navigate('/virtuals/plinko')}>
        <div className="virtual-logo plinko-logo">
          <i className="fas fa-circle-dot"></i>
        </div>
        <div className="virtual-name">Gold Plinko</div>
      </div>
      {
        games.games.map((game, index) => {
          return (
            <div className="virtual-card" key={index} style={{}}>
              <div className="virtual-logo">
                <img src={game.squareX3.formats.thumbnail.url} alt={game.title} />
              </div>
              <div className="virtual-name">{game.title}</div>
            </div>
          )
        })
      }
    </div>
  )
}

export default Virtuals
