import React, { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useNotifications } from "../../context/NotificationContext";
import { supabase } from "../../services/supabaseClient";
import "./Rps.scss";

const CHOICES = ["rock", "paper", "scissors"];
const EMOJI = { rock: "✊", paper: "✋", scissors: "✌️" };
const WIN_PAYOUT = 1.5; // 1.5x on win
const HOUSE_EDGE = 0.12; // computer wins ~12% more than fair
const BET_MIN = 10;
const BET_MAX = 500;
const BET_STEP = 10;

const Rps = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const { formatMoney, currency } = useCurrency();
  const { addNotification } = useNotifications();

  const [bet, setBet] = useState(BET_MIN);
  const [balance, setBalance] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [resultClass, setResultClass] = useState("");
  const [resultMessage, setResultMessage] = useState("Place a bet and make your choice to play");
  const [animating, setAnimating] = useState(false);
  const [animationEmoji, setAnimationEmoji] = useState("✊");
  const [history, setHistory] = useState([]);

  const betRef = useRef(bet);
  betRef.current = bet;
  const userRef = useRef(user);
  userRef.current = user;
  const currencyRef = useRef(currency);
  currencyRef.current = currency;

  const updateBalance = useCallback(() => {
    setBalance(Number(wallet?.balance || 0));
  }, [wallet]);

  useEffect(() => {
    updateBalance();
  }, [updateBalance]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("rps_games")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setHistory(data || []);
    } catch (e) {
      console.error("Failed to fetch RPS history", e);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // House-favoring choice: computer picks to beat the player more often than fair
  const getComputerChoice = (playerChoice) => {
    const beats = { rock: "paper", paper: "scissors", scissors: "rock" };
    const r = Math.random();
    if (r < HOUSE_EDGE) {
      return beats[playerChoice];
    }
    return CHOICES[Math.floor(Math.random() * 3)];
  };

  const determineResult = (player, computer) => {
    if (player === computer) return "draw";
    const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
    return beats[player] === computer ? "win" : "loss";
  };

  const adjustBet = (delta) => {
    setBet((prev) => Math.min(BET_MAX, Math.max(BET_MIN, prev + delta)));
  };

  const play = useCallback(
    async (choice) => {
      if (!user) {
        addNotification({
          category: "warning",
          title: "Sign in required",
          body: "Please sign in to play.",
        });
        return;
      }

      const currentBet = betRef.current;
      const bal = Number(wallet?.balance || 0);
      if (bal < currentBet) {
        addNotification({
          category: "error",
          title: "Insufficient balance",
          body: `You need at least ${formatMoney(currentBet)} to play.`,
        });
        return;
      }

      setPlaying(true);
      setAnimating(true);
      setPlayerChoice(choice);
      setResult(null);
      setResultClass("");
      setResultMessage("...");

      // Debit wallet
      try {
        const { error: debitErr } = await supabase.rpc("debit_wallet", {
          p_user_id: user.id,
          p_amount: currentBet,
        });
        if (debitErr) throw debitErr;

        await supabase.from("transactions").insert({
          user_id: user.id,
          type: "rps_bet",
          amount: -currentBet,
          currency: currencyRef.current || "KES",
          status: "successful",
          provider: "rps",
          meta: { choice, bet: currentBet },
        });

        await refreshWallet();
      } catch (e) {
        addNotification({
          category: "error",
          title: "Bet failed",
          body: e.message || "Could not place bet",
        });
        setPlaying(false);
        setAnimating(false);
        return;
      }

      // Animation
      let idx = 0;
      const interval = setInterval(() => {
        setAnimationEmoji(EMOJI[CHOICES[idx % 3]]);
        idx++;
      }, 100);

      setTimeout(async () => {
        clearInterval(interval);
        const computer = getComputerChoice(choice);
        const outcome = determineResult(choice, computer);
        setComputerChoice(computer);
        setAnimating(false);

        let winAmount = 0;
        if (outcome === "win") {
          winAmount = Math.floor(currentBet * WIN_PAYOUT);
        }

        try {
          if (winAmount > 0) {
            const { error: creditErr } = await supabase.rpc("credit_wallet", {
              p_user_id: user.id,
              p_amount: winAmount,
              p_bonus: false,
            });
            if (creditErr) throw creditErr;

            await supabase.from("transactions").insert({
              user_id: user.id,
              type: "rps_win",
              amount: winAmount,
              currency: currencyRef.current || "KES",
              status: "successful",
              provider: "rps",
              meta: { player: choice, computer, result: outcome, bet: currentBet },
            });
          }

          await supabase.from("rps_games").insert({
            user_id: user.id,
            bet_amount: currentBet,
            player_choice: choice,
            computer_choice: computer,
            result: outcome,
            win_amount: winAmount,
            currency: currencyRef.current || "KES",
          });

          await refreshWallet();
          await fetchHistory();
        } catch (e) {
          console.error("RPS result error", e);
        }

        if (outcome === "win") {
          setResult("win");
          setResultClass("win");
          setResultMessage(
            `You win! ${EMOJI[choice]} beats ${EMOJI[computer]}. +${formatMoney(winAmount)}`
          );
          addNotification({
            category: "success",
            title: "RPS Win!",
            body: `${EMOJI[choice]} beats ${EMOJI[computer]} — +${formatMoney(winAmount)}`,
          });
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#4ade80", "#60a5fa"],
          });
        } else if (outcome === "loss") {
          setResult("loss");
          setResultClass("loss");
          setResultMessage(
            `You lose! ${EMOJI[computer]} beats ${EMOJI[choice]}. -${formatMoney(currentBet)}`
          );
          addNotification({
            category: "warning",
            title: "RPS Loss",
            body: `${EMOJI[computer]} beats ${EMOJI[choice]} — -${formatMoney(currentBet)}`,
          });
        } else {
          setResult("draw");
          setResultClass("draw");
          setResultMessage(`It's a draw! ${EMOJI[choice]} vs ${EMOJI[computer]}. Bet returned.`);
          // refund the bet on draw
          try {
            await supabase.rpc("credit_wallet", {
              p_user_id: user.id,
              p_amount: currentBet,
              p_bonus: false,
            });
            await refreshWallet();
          } catch (e) {
            console.error("Draw refund error", e);
          }
        }

        setPlaying(false);
      }, 1500);
    },
    [user, wallet, refreshWallet, addNotification, formatMoney, fetchHistory]
  );

  return (
    <div className="rps-page">
      <div className="rps-header">
        <div className="rps-title">
          <i className="fas fa-hand-scissors"></i>
          <span>Rock Paper Scissors</span>
        </div>
        <div className="balance-display">
          <i className="fas fa-wallet"></i>
          <span>{formatMoney(balance)}</span>
        </div>
      </div>

      <div className="rps-arena">
        <div className="rps-side player-side">
          <h3>Your Choice</h3>
          <div className="rps-display">
            {playerChoice ? EMOJI[playerChoice] : "❓"}
          </div>
        </div>

        <div className="rps-vs">VS</div>

        <div className="rps-side computer-side">
          <h3>Computer</h3>
          <div className={`rps-display ${animating ? "spinning" : ""}`}>
            {animating ? animationEmoji : computerChoice ? EMOJI[computerChoice] : "✊"}
          </div>
        </div>
      </div>

      <div className={`rps-result ${resultClass}`}>
        {resultMessage}
      </div>

      <div className="rps-controls">
        <div className="bet-group">
          <label>Bet</label>
          <button className="btn btn-sm" onClick={() => adjustBet(-BET_STEP)} disabled={playing}>
            <i className="fas fa-minus"></i>
          </button>
          <span className="bet-value">{formatMoney(bet)}</span>
          <button className="btn btn-sm" onClick={() => adjustBet(BET_STEP)} disabled={playing}>
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <div className="quick-bets">
          {[10, 25, 50, 100, 200].map((amt) => (
            <button
              key={amt}
              className="quick-bet"
              onClick={() => setBet(amt)}
              disabled={playing}
            >
              {formatMoney(amt)}
            </button>
          ))}
        </div>
      </div>

      <div className="rps-choices">
        <button
          className="choice-btn rock-btn"
          onClick={() => play("rock")}
          disabled={playing}
        >
          <span className="choice-emoji">✊</span>
          <span className="choice-label">Rock</span>
        </button>
        <button
          className="choice-btn paper-btn"
          onClick={() => play("paper")}
          disabled={playing}
        >
          <span className="choice-emoji">✋</span>
          <span className="choice-label">Paper</span>
        </button>
        <button
          className="choice-btn scissors-btn"
          onClick={() => play("scissors")}
          disabled={playing}
        >
          <span className="choice-emoji">✌️</span>
          <span className="choice-label">Scissors</span>
        </button>
      </div>

      <div className="rps-history">
        <h3>Game History</h3>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">No games played yet</div>
          ) : (
            history.map((game) => (
              <div key={game.id} className={`history-item ${game.result}`}>
                <span className="hist-matchup">
                  {EMOJI[game.player_choice]} vs {EMOJI[game.computer_choice]}
                </span>
                <span className={`hist-result hist-${game.result}`}>
                  {game.result === "win"
                    ? `+${formatMoney(game.win_amount)}`
                    : game.result === "loss"
                    ? `-${formatMoney(game.bet_amount)}`
                    : "Draw"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Rps;
