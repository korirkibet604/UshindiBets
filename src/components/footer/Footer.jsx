import "./Footer.scss";
import { APP_NAME } from "../../constants";
import { NavLink } from "react-router-dom";

function Footer() {
  return (
    <footer>
      <div className="footer-section">
        <h3>Follow Us</h3>
        <div className="socials">
          <NavLink to="/">
            <i className="fab fa-facebook"></i>
          </NavLink>
          <NavLink to="/">
            <i className="fab fa-twitter"></i>
          </NavLink>
          <NavLink to="/">
            <i className="fab fa-instagram"></i>
          </NavLink>
          <NavLink to="/">
            <i className="fab fa-youtube"></i>
          </NavLink>
        </div>
      </div>
      <div className="copyright">
        <p>
          © {new Date().getFullYear()} {APP_NAME}. Licensed and regulated by the
          UK Gambling Commission
        </p>
        <p>18+ | Gamble responsibly | begambleaware.org</p>
      </div>
    </footer>
  );
}

export default Footer;
