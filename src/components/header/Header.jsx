import "./Header.scss";
import { APP_NAME } from "../../constants";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useNotifications } from "../../context/NotificationContext";

function Header() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const { user, profile, wallet, signOut } = useAuth();
  const { formatMoney, currency, currencies, changeCurrency } = useCurrency();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    if (savedTheme === "light" || (!savedTheme && systemLight)) {
      setIsLightMode(true);
      document.body.classList.add("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    if (isLightMode) {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    }
    setIsLightMode(!isLightMode);
  };

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header>
      <div className="logo" onClick={() => navigate("/")}>
        <i className="fas fa-coins"></i>
        <span>{APP_NAME}</span>
      </div>
      <div className="header-wrapper">
        <nav className="nav-links">
          <NavLink to="/">All</NavLink>
          <NavLink to="/live">Live</NavLink>
          <NavLink to="/fixtures">Fixtures</NavLink>
          <NavLink to="/boost">Jackpot</NavLink>
          <NavLink to="/virtuals">Virtuals</NavLink>
        </nav>
        <div className="user-actions">
          {user ? (
            <>
              <div className="balance" onClick={() => navigate("/wallet")} style={{ cursor: "pointer" }}>
                <i className="fas fa-wallet"></i>
                {formatMoney(wallet?.balance || 0)}
              </div>
              <button className="account-btn" onClick={() => navigate("/account")}>
                <i className="fas fa-user"></i> {profile?.display_name || "Account"}
              </button>
              <div className="notif-bell" ref={notifRef}>
                <button className="icon-button" onClick={() => setShowNotifs(!showNotifs)}>
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>
                {showNotifs && (
                  <div className="notif-dropdown">
                    <div className="notif-head">
                      <span>Notifications</span>
                      {unreadCount > 0 && <button onClick={markAllRead}>Mark all read</button>}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No notifications yet</div>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <div
                            key={n.id}
                            className={`notif-item ${!n.read ? "unread" : ""}`}
                            onClick={() => markRead(n.id)}
                          >
                            <div className="notif-title">{n.title}</div>
                            {n.body && <div className="notif-body">{n.body}</div>}
                            <div className="notif-time">{new Date(n.created_at).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <select
                className="currency-select"
                value={currency}
                onChange={(e) => changeCurrency(e.target.value)}
                title="Currency"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <button className="icon-button" onClick={signOut} title="Sign out">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </>
          ) : (
            <>
              <select
                className="currency-select"
                value={currency}
                onChange={(e) => changeCurrency(e.target.value)}
                title="Currency"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
              <button className="register-btn" onClick={() => navigate("/register")}>Sign Up</button>
            </>
          )}
          <button className="icon-button" id="theme-toggle" onClick={toggleTheme}>
            <i className={isLightMode ? "fas fa-sun" : "fas fa-moon"}></i>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
