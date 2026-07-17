import { useState } from "react";
import "./Betslip.scss";
import { useBetslip } from "../../context/BetslipContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TAX_FEE = 20;

function Betslip() {
  const {
    selections,
    stake,
    setStake,
    visible,
    setVisible,
    removeSelection,
    clearSlip,
    totalOdds,
    potentialWin,
    placeBet,
    placing,
    lastError,
    count,
  } = useBetslip();
  const { formatMoney, currency } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null);

  const tax = (TAX_FEE * Number(stake || 0)) / 100;
  const finalStake = Number(stake || 0) - tax;
  const win = finalStake * totalOdds;

  const handleStake = (e) => {
    const v = Number(e.target.value);
    if (v > 50000) {
      setStake(50000);
      return;
    }
    if (v < 0) {
      setStake(0);
      return;
    }
    setStake(v);
  };

  const handlePlace = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setConfirm({ stake, totalOdds, win });
  };

  const confirmPlace = async () => {
    try {
      await placeBet();
      setConfirm(null);
    } catch {
      // error surfaced via lastError
    }
  };

  return (
    <div className={`bet-slip ${visible ? "visible" : ""}`} id="betSlip">
      <div className="slip-header">
        <div className="slip-title">
          <i className="fas fa-receipt"></i> Bet Slip
          <span className="slip-count" id="slipCount">{count}</span>
        </div>
        <button className="close-slip" id="closeSlip" onClick={() => setVisible(false)}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="slip-items">
        {selections.length === 0 ? (
          <div className="slip-empty">
            <i className="fas fa-inbox"></i>
            <p>Your bet slip is empty.</p>
            <span>Tap odds on any match to add selections.</span>
          </div>
        ) : (
          selections.map((item, idx) => (
            <div className="slip-item" key={`${item.matchId}-${item.market}-${idx}`}>
              <div className="item-details">
                <div className="item-match">{item.matchName || `${item.homeTeam} vs ${item.awayTeam}`}</div>
                <div className="item-bet">
                  <span className="item-market">{item.market}</span> • {item.pick}
                </div>
              </div>
              <div className="item-odds">{Number(item.odds).toFixed(2)}</div>
              <button
                className="remove-item"
                onClick={() => removeSelection(item.matchId, item.market)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))
        )}
      </div>

      {selections.length > 0 && (
        <>
          <div className="potential-win">
            <div className="values-container">
              <div>Stake: <strong>{formatMoney(stake)}</strong></div>
              <div>Tax: <strong>{formatMoney(tax)}</strong></div>
            </div>
            <div className="values-container">
              <div>Final Stake: <strong>{formatMoney(finalStake)}</strong></div>
              <div>Total Odds: <strong>{totalOdds.toFixed(2)}</strong></div>
            </div>
            <div>Potential win: <strong>{formatMoney(win)}</strong></div>
          </div>
          <div className="slip-controls">
            <input
              type="number"
              className="stake-input"
              placeholder="Enter stake"
              value={stake}
              onChange={handleStake}
              min={10}
              max={50000}
            />
            <button className="clear-bet" onClick={clearSlip} type="button">
              <i className="fas fa-trash"></i>
            </button>
            <button
              className="place-bet"
              onClick={handlePlace}
              disabled={placing || selections.length === 0}
              type="button"
            >
              {placing ? <i className="fas fa-spinner fa-spin"></i> : "Place Bet"}
            </button>
          </div>
          {lastError && <div className="slip-error">{lastError}</div>}
        </>
      )}

      {confirm && (
        <div className="slip-modal-overlay" onClick={() => setConfirm(null)}>
          <div className="slip-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Bet</h3>
            <div className="confirm-row"><span>Stake:</span><strong>{formatMoney(confirm.stake)}</strong></div>
            <div className="confirm-row"><span>Total Odds:</span><strong>{confirm.totalOdds.toFixed(2)}</strong></div>
            <div className="confirm-row"><span>Potential Win:</span><strong className="win">{formatMoney(confirm.win)}</strong></div>
            <div className="confirm-actions">
              <button className="cancel" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="confirm-btn" onClick={confirmPlace} disabled={placing}>
                {placing ? <i className="fas fa-spinner fa-spin"></i> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Betslip;
