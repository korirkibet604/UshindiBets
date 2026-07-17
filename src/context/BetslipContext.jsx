import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../services/supabaseClient";

const BetslipContext = createContext(null);

export const BetslipProvider = ({ children }) => {
  const { wallet, refreshWallet, user } = useAuth();
  const [selections, setSelections] = useState([]);
  const [stake, setStake] = useState(100);
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
        // same match+market: replace pick
        const existing = prev[existingIdx];
        if (existing.pick === sel.pick) {
          // toggle off
          return prev.filter((_, i) => i !== existingIdx);
        }
        const copy = [...prev];
        copy[existingIdx] = sel;
        return copy;
      }
      // remove any prior selection on the same match+market group (1X2 family)
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
    const balance = Number(wallet?.balance || 0);
    if (stakeNum > balance) {
      setLastError("Insufficient balance. Please deposit.");
      throw new Error("Insufficient balance");
    }
    setPlacing(true);
    try {
      // 1. create bet slip
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
        })
        .select()
        .maybeSingle();
      if (slipErr) throw slipErr;

      // 2. insert selections
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

      // 3. debit wallet
      const { error: wErr } = await supabase.rpc("debit_wallet", {
        p_user_id: user.id,
        p_amount: stakeNum,
      });
      if (wErr) {
        // best-effort: mark slip void
        await supabase.from("bet_slips").update({ status: "void" }).eq("id", slip.id);
        throw wErr;
      }

      // 4. record transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "bet_stake",
        amount: -stakeNum,
        currency: wallet?.currency || "KES",
        status: "successful",
        reference: slip.id,
        provider: "system",
        meta: { slip_id: slip.id, selections: selections.length },
      });

      await refreshWallet();
      clearSlip();
      return slip;
    } catch (e) {
      setLastError(e.message || "Failed to place bet");
      throw e;
    } finally {
      setPlacing(false);
    }
  }, [user, wallet, selections, stake, totalOdds, potentialWin, refreshWallet, clearSlip]);

  return (
    <BetslipContext.Provider
      value={{
        selections,
        stake,
        setStake,
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
