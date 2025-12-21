
import './Footer.scss';
import { APP_NAME} from '../../constants';
import { NavLink } from 'react-router-dom';

function Footer() {
  return (
    <footer>
      <div className="footer-content">
                <div className="footer-section">
                    <h3>LiveScore</h3>
                    <p>Your go-to destination for real-time sports scores, statistics, and updates for football matches around the world.</p>
                </div>
                {/*<div className="footer-section">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><NavLink to="/">Home</NavLink></li>
                        <li><NavLink to="/">Live Matches</NavLink></li>
                        <li><NavLink to="/">Leagues</NavLink></li>
                        <li><NavLink to="/">News</NavLink></li>
                        <li><NavLink to="/">Terms of Service</NavLink></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h3>Top Leagues</h3>
                    <ul>
                        <li><NavLink to="/">Premier League</NavLink></li>
                        <li><NavLink to="/">La Liga</NavLink></li>
                        <li><NavLink to="/">Serie A</NavLink></li>
                        <li><NavLink to="/">Bundesliga</NavLink></li>
                        <li><NavLink to="/">Ligue 1</NavLink></li>
                    </ul>
                </div>*/}
                <div className="footer-section">
                    <h3>Follow Us</h3>
                    <div className="socials">
                        <NavLink to="/"><i className="fab fa-facebook"></i></NavLink>
                        <NavLink to="/"><i className="fab fa-twitter"></i></NavLink>
                        <NavLink to="/"><i className="fab fa-instagram"></i></NavLink>
                        <NavLink to="/"><i className="fab fa-youtube"></i></NavLink>
                    </div>
                </div>
      </div>
      <div className="copyright">
        <p>© {new Date().getFullYear()} {APP_NAME}. Licensed and regulated by the UK Gambling Commission</p>
        <p>18+ | Gamble responsibly | begambleaware.org</p>
      </div>
    </footer>
  )
}

export default Footer