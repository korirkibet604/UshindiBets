import "./Toasts.scss";
import { useNotifications } from "../../context/NotificationContext";

export default function Toasts() {
  const { toasts, dismissToast } = useNotifications();
  if (!toasts.length) return null;
  return (
    <div className="toasts-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type || "info"}`}>
          <div className="toast-icon">
            <i className={`fas ${iconFor(t.type)}`}></i>
          </div>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message && <div className="toast-msg">{t.message}</div>}
          </div>
          <button className="toast-close" onClick={() => dismissToast(t.id)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
}

function iconFor(type) {
  switch (type) {
    case "odds": return "fa-chart-line";
    case "match": return "fa-futbol";
    case "transaction": return "fa-wallet";
    case "marketing": return "fa-gift";
    case "success": return "fa-check-circle";
    case "error": return "fa-exclamation-circle";
    default: return "fa-bell";
  }
}
