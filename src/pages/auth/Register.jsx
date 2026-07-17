import "./Auth.scss";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { detectCountry, CURRENCIES } from "../../services/countryCurrency";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    displayName: "",
    phone: "",
  });
  const [country, setCountry] = useState({ code: "KE", name: "Kenya", currency: "KES", flag: "🇰🇪" });
  const [currency, setCurrency] = useState("KES");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    detectCountry().then((d) => {
      setCountry({ code: d.countryCode, name: d.countryName, currency: d.currency, flag: d.flag });
      setCurrency(d.currency);
    });
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(form.email.trim(), form.password, {
        display_name: form.displayName || form.email.split("@")[0],
        phone: form.phone,
        country_code: country.code,
        country_name: country.name,
        currency,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <i className="fas fa-coins"></i>
          <h1>UshindiBets</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="auth-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Display Name</label>
            <input type="text" value={form.displayName} onChange={set("displayName")} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+254 7xx xxx xxx" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Country {country.flag}</label>
              <input type="text" value={country.name} readOnly />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.country}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" required />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
