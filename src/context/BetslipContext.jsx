import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useNotifications } from "./NotificationContext";
import { useCurrency } from "./CurrencyContext";
import { supabase } from "../services/supabaseClient";

const BetslipContext = createContext(null);

export const BetslipProvider = ({ children }) => {
  const { wallet, refreshWallet, user } = useAuth();
  const { addNotification } = useNotifications();
  const { formatMoney } = useCurrency();
  const [selections, setSelections] = useState([]);
  const [stake, setStake] = useState(100);
  const [useBonus, setUseBonus] = useState(false);
  const [visible, setVisible] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [lastError, setLastError] = useState(null);

  const addSelection = useCallback((sel) => {
    setLastError(null);
    setSelections((prev) => {
      const existingIdx = prev.findIndex(
        (s) => s.matchId === sel.matchId && s.market === sel.market
      );
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.pick === sel.pick) {
          return prev.filter((_, i) => i !== existingIdx);
        }
        const copy = [...prev];
        copy[existingIdx] = sel;
        return copy;
      }
      const filtered = prev.filter(
        (s) => !(s.matchId === sel.matchId && s.market === sel.market)
      );
      return [...filtered, sel];
    });
  }, []);

  const removeSelection = useCallback((matchId, market) => {
    setSelections((prev) => prev.filter((s) => !(s.matchId === matchId && s.market === market)));
  }, []);

  const clearSlip = useCallback(() => setSelections([]), []);

  const totalOdds = useMemo(
    () => selections.reduce((acc, s) => acc * Number(s.odds || 0), 1),
    [selections]
  );

  const potentialWin = useMemo(
    () => Number(stake) * totalOdds,
    [stake, totalOdds]
  );

  // Bonus cannot be used on live games or jackpots
  const hasLiveSelection = useMemo(
    () => selections.some((s) => s.isLive),
    [selections]
  );
  const canUseBonus = !hasLiveSelection && Number(wallet?.bonus_balance || 0) > 0;

  const placeBet = useCallback(async () => {
    setLastError(null);
    if (!user) {
      setLastError("Please sign in to place a bet.");
      throw new Error("Not authenticated");
    }
    if (selections.length === 0) {
      setLastError("Your bet slip is empty.");
      throw new Error("Empty slip");
    }
    const stakeNum = Number(stake);
    if (!stakeNum || stakeNum < 10) {
      setLastError("Minimum stake is 10.");
      throw new Error("Invalid stake");
    }

    // Bonus validation
    if (useBonus) {
      if (hasLiveSelection) {
        setLastError("Bonus cannot be used on live games.");
        throw new Error("Bonus restricted");
      }
      const bonusBal = Number(wallet?.bonus_balance || 0);
      if (bonusBal <= 0) {
        setLastError("No bonus balance available.");
        throw new Error("No bonus");
      }
    }

    const balance = Number(wallet?.balance || 0);
    const bonusBalance = useBonus ? Number(wallet?.bonus_balance || 0) : 0;
    const totalAvailable = balance + bonusBalance;
    if (stakeNum > totalAvailable) {
      setLastError("Insufficient balance. Please deposit.");
      throw new Error("Insufficient balance");
    }

    setPlacing(true);
    try {
      const { data: slip, error: slipErr } = await supabase
        .from("bet_slips")
        .insert({
          user_id: user.id,
          type: selections.length > 1 ? "accumulator" : "single",
          stake: stakeNum,
          total_odds: totalOdds,
          potential_win: potentialWin,
          status: "open",
          currency: wallet?.currency || "KES",
          meta: useBonus ? { used_bonus: true } : null,
        })
        .select()
        .maybeSingle();
      if (slipErr) throw slipErr;

      const rows = selections.map((s) => ({
        bet_slip_id: slip.id,
        match_id: s.matchId,
        match_name: s.matchName,
        market: s.market,
        pick: s.pick,
        odds: s.odds,
        status: "pending",
      }));
      const { error: selErr } = await supabase.from("bet_selections").insert(rows);
      if (selErr) throw selErr;

      // Debit from real balance first, then bonus
      let remainingStake = stakeNum;
      if (useBonus && bonusBalance > 0) {
        const bonusPart = Math.min(bonusBalance, remainingStake);
        const { error: bErr } = await supabase.rpc("credit_wallet", {
          p_user_id: user.id,
          p_amount: -bonusPart,
          p_bonus: true,
        });
        if (bErr) throw bErr;
        remainingStake -= bonusPart;
      }
      if (remainingStake > 0) {
        const { error: wErr } = await supabase.rpc("debit_wallet", {
          p_user_id: user.id,
          p_amount: remainingStake,
        });
        if (wErr) {
          await supabase.from("bet_slips").update({ status: "void" }).eq("id", slip.id);
          throw wErr;
        }
      }

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "bet_stake",
        amount: -stakeNum,
        currency: wallet?.currency || "KES",
        status: "successful",
        reference: slip.id,
        provider: "system",
        meta: { slip_id: slip.id, selections: selections.length, used_bonus: useBonus },
      });

      await refreshWallet();
      clearSlip();
      setUseBonus(false);

      await addNotification({
        category: "success",
        title: "Bet placed successfully!",
        body: `Your ${selections.length > 1 ? "accumulator" : "single"} bet of ${formatMoney(stakeNum)} at ${totalOdds.toFixed(2)} odds has been placed. Good luck!`,
        link: "/account",
      });

      return slip;
    } catch (e) {
      setLastError(e.message || "Failed to place bet");
      throw e;
    } finally {
      setPlacing(false);
    }
  }, [user, wallet, selections, stake, totalOdds, potentialWin, useBonus, hasLiveSelection, refreshWallet, clearSlip, addNotification, formatMoney]);

  return (
    <BetslipContext.Provider
      value={{
        selections,
        stake,
        setStake,
        useBonus,
        setUseBonus,
        canUseBonus,
        hasLiveSelection,
        visible,
        setVisible,
        addSelection,
        removeSelection,
        clearSlip,
        totalOdds,
        potentialWin,
        placeBet,
        placing,
        lastError,
        count: selections.length,
      }}
    >
      {children}
    </BetslipContext.Provider>
  );
};

export const useBetslip = () => {
  const ctx = useContext(BetslipContext);
  if (!ctx) throw new Error("useBetslip must be used within BetslipProvider");
  return ctx;
};

export default BetslipContext;
