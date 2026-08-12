import React, { useEffect, useRef, useState, useCallback } from "react";
import p5 from "p5";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useNotifications } from "../../context/NotificationContext";
import { supabase } from "../../services/supabaseClient";
import "./Plinko.scss";

const ZONES = ["Leg 1", "Leg 2", "Leg 3", "Leg 4", "Leg 5", "Leg 6", "Leg 7"];
const ODDS = [3.5, 1.2, 0.0, 0.0, 0.0, 1.2, 3.5];
const MAX_RESULTS = 3;
const BET_STEP = 10;
const BET_MIN = 10;
const BET_MAX = 500;

const PHYSICS = {
  gravity: 0.55,
  restitutionVert: 0.78,
  restitutionHoriz: 0.58,
  friction: 0.994,
  maxVx: 2.8,
  houseBias: 0.018,
};

const Plinko = () => {
  const containerRef = useRef(null);
  const sketchRef = useRef(null);
  const ballsRef = useRef([]);
  const pegsRef = useRef([]);
  const scaleRef = useRef(1);
  const resultsRef = useRef([]);
  const dropLockRef = useRef(false);

  const { user, wallet, refreshWallet } = useAuth();
  const { formatMoney, currency } = useCurrency();
  const { addNotification } = useNotifications();

  const [bet, setBet] = useState(BET_MIN);
  const [results, setResults] = useState([]);
  const [balance, setBalance] = useState(0);
  const [dropping, setDropping] = useState(false);
  const [recentGames, setRecentGames] = useState([]);

  const betRef = useRef(bet);
  betRef.current = bet;
  const userRef = useRef(user);
  userRef.current = user;
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const currencyRef = useRef(currency);
  currencyRef.current = currency;

  const updateBalance = useCallback(() => {
    const bal = Number(walletRef.current?.balance || 0);
    setBalance(bal);
  }, []);

  useEffect(() => {
    updateBalance();
  }, [wallet, updateBalance]);

  const fetchRecentGames = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("plinko_games")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentGames(data || []);
    } catch (e) {
      console.error("Failed to fetch game history", e);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentGames();
  }, [fetchRecentGames]);

  const handleLanding = useCallback(
    async (zoneIdx) => {
      if (zoneIdx < 0 || zoneIdx >= ZONES.length || !userRef.current) return;

      const multiplier = ODDS[zoneIdx];
      const currentBet = betRef.current;
      const winAmount = Math.floor(currentBet * multiplier);

      try {
        if (multiplier > 0 && winAmount > 0) {
          const { error: creditErr } = await supabase.rpc("credit_wallet", {
            p_user_id: userRef.current.id,
            p_amount: winAmount,
            p_bonus: false,
          });
          if (creditErr) throw creditErr;

          await supabase.from("transactions").insert({
            user_id: userRef.current.id,
            type: "plinko_win",
            amount: winAmount,
            currency: currencyRef.current || "KES",
            status: "successful",
            provider: "plinko",
            meta: { zone: ZONES[zoneIdx], multiplier, bet: currentBet },
          });

          addNotification({
            category: "success",
            title: "Plinko Win!",
            body: `Ball landed in ${ZONES[zoneIdx]} — ${multiplier}x = ${formatMoney(winAmount)}`,
          });

          confetti({
            particleCount: 60,
            spread: 55,
            origin: { y: 0.65 },
            colors: ["#ffd966", "#60a5fa"],
          });
        } else {
          addNotification({
            category: "warning",
            title: "Plinko Loss",
            body: `Ball landed in ${ZONES[zoneIdx]} — 0x. Better luck next time!`,
          });
        }

        await supabase.from("plinko_games").insert({
          user_id: userRef.current.id,
          bet_amount: currentBet,
          zone_index: zoneIdx,
          zone_name: ZONES[zoneIdx],
          multiplier: multiplier,
          win_amount: winAmount,
          currency: currencyRef.current || "KES",
        });

        await refreshWallet();
        await fetchRecentGames();
      } catch (e) {
        console.error("Plinko landing error", e);
        addNotification({
          category: "error",
          title: "Plinko Error",
          body: e.message || "Failed to process result",
        });
      }
    },
    [refreshWallet, fetchRecentGames, addNotification, formatMoney]
  );

  const dropBall = useCallback(async () => {
    if (!user) {
      addNotification({
        category: "warning",
        title: "Sign in required",
        body: "Please sign in to play Plinko.",
      });
      return;
    }

    if (resultsRef.current.length >= MAX_RESULTS) {
      addNotification({
        category: "warning",
        title: "Reset required",
        body: "Press Reset to drop again.",
      });
      return;
    }

    const bal = Number(wallet?.balance || 0);
    if (bal < bet) {
      addNotification({
        category: "error",
        title: "Insufficient balance",
        body: `You need at least ${formatMoney(bet)} to play.`,
      });
      return;
    }

    setDropping(true);
    dropLockRef.current = true;
    try {
      const { error: debitErr } = await supabase.rpc("debit_wallet", {
        p_user_id: user.id,
        p_amount: bet,
      });
      if (debitErr) throw debitErr;

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "plinko_bet",
        amount: -bet,
        currency: currency || "KES",
        status: "successful",
        provider: "plinko",
        meta: { bet },
      });

      await refreshWallet();

      const s = scaleRef.current;
      const sketch = sketchRef.current;
      if (sketch) {
        const w = sketch.width;
        ballsRef.current.push({
          x: w / 2 + sketch.random(-15, 15) * s,
          y: 8 * s,
          vx: sketch.random(-0.3, 0.3) * s,
          vy: 0,
          r: 9 * s,
          trail: [],
          landed: false,
        });
      }
    } catch (e) {
      addNotification({
        category: "error",
        title: "Bet failed",
        body: e.message || "Could not place bet",
      });
    } finally {
      setDropping(false);
      dropLockRef.current = false;
    }
  }, [user, wallet, bet, currency, refreshWallet, addNotification, formatMoney]);

  const resetGame = useCallback(() => {
    resultsRef.current = [];
    ballsRef.current = [];
    setResults([]);
  }, []);

  // p5 sketch
  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p) => {
      p.setup = () => {
        const size = Math.min(p.windowHeight * 0.55, 380);
        scaleRef.current = size / 600;
        const canvas = p.createCanvas(size, size);
        canvas.parent(containerRef.current);
        initPegs(p);
      };

      p.windowResized = () => {
        const size = Math.min(p.windowHeight * 0.55, 380);
        scaleRef.current = size / 600;
        p.resizeCanvas(size, size);
        initPegs(p);
      };

      const initPegs = (p) => {
        const pegs = [];
        const usableWidth = p.width - 80 * scaleRef.current;
        const spacing = usableWidth / 6;
        const startY = 50 * scaleRef.current;
        for (let row = 0; row < 7; row++) {
          const cols = row + 1;
          for (let col = 0; col < cols; col++) {
            const x = p.width / 2 + (col - row / 2) * spacing;
            const y = startY + row * spacing;
            pegs.push({ x, y, r: 4.5 * scaleRef.current, glow: 0 });
          }
        }
        pegsRef.current = pegs;
      };

      p.draw = () => {
        p.background(8, 16, 32);

        // Drop zone highlight
        p.noStroke();
        p.fill(255, 200, 50, 25);
        p.rect(
          p.width / 2 - 50 * scaleRef.current,
          0,
          100 * scaleRef.current,
          40 * scaleRef.current,
          0,
          0,
          8,
          8
        );

        // Draw pegs
        pegsRef.current.forEach((peg) => {
          if (peg.glow > 0) {
            p.fill(255, 180, 60, peg.glow * 255);
            p.ellipse(peg.x, peg.y, peg.r * 3);
            peg.glow -= 0.08;
          }
          p.fill(peg.glow > 0 ? "#ffcc44" : "#b8d0f0");
          p.ellipse(peg.x, peg.y, peg.r * 2);
        });

        // Zone background gradient
        const zoneH = 55 * scaleRef.current;
        const zoneY = p.height - zoneH;
        const zoneW = p.width / ZONES.length;
        ZONES.forEach((_, i) => {
          const x = i * zoneW;
          let c1;
          if (ODDS[i] === 0) c1 = p.color(60, 10, 10, 120);
          else if (ODDS[i] < 1) c1 = p.color(20, 40, 80, 120);
          else if (ODDS[i] < 2) c1 = p.color(20, 80, 40, 120);
          else c1 = p.color(80, 60, 10, 120);
          p.noStroke();
          p.fill(c1);
          p.rect(x, zoneY, zoneW, zoneH);
        });

        // Zone dividers
        p.stroke(255, 255, 255, 35);
        p.strokeWeight(1);
        for (let i = 0; i <= ZONES.length; i++) {
          const x = i * zoneW;
          p.line(x, p.height - 55 * scaleRef.current, x, p.height);
        }

        // Zone labels
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        ZONES.forEach((_, i) => {
          const x = i * zoneW + zoneW / 2;
          p.fill(255, 255, 240);
          p.textSize(7 * scaleRef.current);
          p.textStyle(p.BOLD);
          p.text(ZONES[i].replace("Leg ", "L"), x, p.height - 32 * scaleRef.current);
          p.fill(255, 217, 102);
          p.textSize(6 * scaleRef.current);
          p.text(ODDS[i].toFixed(1) + "x", x, p.height - 16 * scaleRef.current);
        });

        // Physics
        const dt = p.deltaTime / 16.67;
        ballsRef.current = ballsRef.current.filter((b) => b.y < p.height - 55 * scaleRef.current);

        ballsRef.current.forEach((b) => {
          b.vy += PHYSICS.gravity * scaleRef.current * dt;
          b.vx *= PHYSICS.friction;
          b.vy *= PHYSICS.friction;

          // Subtle nudge toward center to favor house
          const centerX = p.width / 2;
          const distFromCenter = b.x - centerX;
          b.vx -= Math.sign(distFromCenter) * PHYSICS.houseBias * scaleRef.current * dt;

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 6) b.trail.shift();

          // Walls
          const wall = 12 * scaleRef.current;
          if (b.x < b.r + wall) {
            b.x = b.r + wall;
            b.vx *= -0.5;
          }
          if (b.x > p.width - b.r - wall) {
            b.x = p.width - b.r - wall;
            b.vx *= -0.5;
          }

          // Peg collisions
          pegsRef.current.forEach((peg) => {
            const dx = b.x - peg.x;
            const dy = b.y - peg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.r + peg.r) {
              peg.glow = 1;
              const nx = dx / dist;
              const ny = dy / dist;
              const vRel = b.vx * nx + b.vy * ny;
              b.vx -= 1.9 * vRel * nx * PHYSICS.restitutionHoriz;
              b.vy -= 1.9 * vRel * ny * PHYSICS.restitutionVert;
              b.vx = p.constrain(b.vx, -PHYSICS.maxVx * scaleRef.current, PHYSICS.maxVx * scaleRef.current);
              const overlap = b.r + peg.r - dist + 0.5 * scaleRef.current;
              b.x += nx * overlap;
              b.y += ny * overlap;
            }
          });

          // Landing
          if (b.y >= p.height - 55 * scaleRef.current && !b.landed && resultsRef.current.length < MAX_RESULTS) {
            const zoneIdx = Math.floor(b.x / zoneW);
            if (zoneIdx >= 0 && zoneIdx < ZONES.length && !resultsRef.current.includes(ZONES[zoneIdx])) {
              resultsRef.current.push(ZONES[zoneIdx]);
              setResults([...resultsRef.current]);
              handleLanding(zoneIdx);
            }
            b.landed = true;
          }

          // Draw trail
          b.trail.forEach((t, i) => {
            const alpha = (i / b.trail.length) * 180;
            p.fill(255, 215, 80, alpha);
            p.ellipse(t.x, t.y, b.r * 1.4 * (i / b.trail.length));
          });

          // Draw ball
          p.fill("#FFD966");
          p.stroke(255, 240, 200);
          p.strokeWeight(1);
          p.ellipse(b.x, b.y, b.r * 2);
          p.noStroke();
        });
      };

      p.mousePressed = () => {
        if (
          p.mouseY < 40 * scaleRef.current &&
          p.mouseX > p.width / 2 - 50 * scaleRef.current &&
          p.mouseX < p.width / 2 + 50 * scaleRef.current
        ) {
          dropBall();
        }
      };

      p.touchStarted = () => {
        if (p.touches[0] && p.touches[0].y < 40 * scaleRef.current) {
          dropBall();
          return false;
        }
      };
    };

    const instance = new p5(sketch);
    sketchRef.current = instance;

    return () => {
      instance.remove();
      sketchRef.current = null;
    };
  }, [handleLanding, dropBall]);

  const adjustBet = (delta) => {
    setBet((prev) => {
      const next = prev + delta;
      if (next < BET_MIN) return BET_MIN;
      if (next > BET_MAX) return BET_MAX;
      return next;
    });
  };

  return (
    <div className="plinko-page">
      <div className="plinko-header">
        <h1 className="plinko-title">
          <i className="fas fa-circle-dot"></i> Gold Plinko
        </h1>
        <div className="balance-display">
          <i className="fas fa-coins"></i>
          <span>{formatMoney(balance)}</span>
        </div>
      </div>

      <div className="game-area">
        <div className="canvas-wrapper" ref={containerRef}></div>
        <aside className="results-panel">
          <div className="results-title">Results</div>
          <div className="results-list">
            {results.length === 0 ? (
              <div className="results-empty">Drop to play</div>
            ) : (
              results.map((r, i) => (
                <div className="result-item" key={i}>
                  {r}
                </div>
              ))
            )}
          </div>
          {results.length >= MAX_RESULTS && (
            <button className="btn btn-reset" onClick={resetGame}>
              <i className="fas fa-redo"></i> Reset
            </button>
          )}
        </aside>
      </div>

      <div className="controls-bar">
        <div className="odds-display">
          {ODDS.map((o, i) => {
            let cls = "odds-chip ";
            if (o === 0) cls += "zero";
            else if (o < 1) cls += "low";
            else if (o < 2) cls += "mid";
            else cls += "high";
            return (
              <span className={cls} key={i} title={ZONES[i]}>
                {o.toFixed(1)}x
              </span>
            );
          })}
        </div>

        <div className="bet-group">
          <label>Bet</label>
          <button className="btn btn-sm" onClick={() => adjustBet(-BET_STEP)}>
            <i className="fas fa-minus"></i>
          </button>
          <span className="bet-value">{bet}</span>
          <button className="btn btn-sm" onClick={() => adjustBet(BET_STEP)}>
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <button className="btn btn-primary" onClick={dropBall} disabled={dropping}>
          {dropping ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Dropping...
            </>
          ) : (
            <>
              <i className="fas fa-play"></i> Drop
            </>
          )}
        </button>

        <button className="btn btn-reset-sm" onClick={resetGame}>
          <i className="fas fa-redo"></i> Reset
        </button>
      </div>

      {recentGames.length > 0 && (
        <div className="game-history">
          <h3>Recent Plays</h3>
          <div className="history-list">
            {recentGames.map((g) => (
              <div className={`history-item ${g.win_amount > 0 ? "win" : "loss"}`} key={g.id}>
                <span className="hist-zone">{g.zone_name}</span>
                <span className="hist-mult">{Number(g.multiplier).toFixed(1)}x</span>
                <span className="hist-bet">{formatMoney(g.bet_amount)}</span>
                <span className="hist-win">
                  {g.win_amount > 0 ? `+${formatMoney(g.win_amount)}` : formatMoney(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Plinko;


export default Plinko