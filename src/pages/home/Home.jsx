import "./Home.scss";
import Controls from "../../components/controls/Controls";
import { useNavigate } from "react-router-dom";
import { useBetikaMatches } from "../../hooks/useBetikaMatches";
import { useEffect, useState, useMemo, useCallback } from "react";
import { normalizeMatches, extractLeagues } from "../../utils/matchUtils";
import { useBetslip } from "../../context/BetslipContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { supabase } from "../../services/supabaseClient";

const BONUSES = [
  {
    type: "welcome",
    title: "Welcome Bonus",
    desc: "Get a 100% bonus on your first deposit up to {amt}",
    amount: 5000,
    requiresDeposit: true,
    cta: "Claim Now",
    icon: "fa-hand-holding-heart",
  },
  {
    type: "acca",
    title: "Acca Boost",
    desc: "Get up to 50% bonus on your accumulator wins",
    amount: 1000,
    requiresDeposit: false,
    cta: "Claim Boost",
    icon: "fa-chart-line",
  },
  {
    type: "freebet",
    title: "Free Bet Club",
    desc: "Earn a free bet bonus every week with our loyalty program",
    amount: 200,
    requiresDeposit: false,
    cta: "Join Club",
    icon: "fa-gift",
  },
];

function Home() {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(-1);
  const [sortBy, setSortBy] = useState(1);
  const { addSelection, selections } = useBetslip();
  const { formatMoney } = useCurrency();
  const { user, refreshWallet } = useAuth();
  const { addNotification } = useNotifications();
  const [claimedBonuses, setClaimedBonuses] = useState([]);
  const [claiming, setClaiming] = useState(null);

  const { matches, tags, loading, error, lastUpdate } = useBetikaMatches({
    sortId: sortBy,
    periodId: selectedPeriod,
    pollInterval: 60000,
  });

  const normalized = useMemo(() => normalizeMatches(matches), [matches]);
  const leagues = useMemo(() => extractLeagues(normalized), [normalized]);

  const filtered = useMemo(() => {
    let list = normalized;
    if (selectedLeague) {
      list = list.filter(
        (m) =>
          m.category === selectedLeague.category &&
          m.competition === selectedLeague.competition
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.homeTeam?.toLowerCase().includes(q) ||
          m.awayTeam?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q) ||
          m.competition?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [normalized, selectedLeague, searchQuery]);

  const fetchClaimedBonuses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bonus_claims")
      .select("*")
      .eq("user_id", user.id);
    setClaimedBonuses(data || []);
  }, [user]);

  useEffect(() => {
    fetchClaimedBonuses();
  }, [fetchClaimedBonuses]);

  const isClaimed = (type) => claimedBonuses.some((b) => b.bonus_type === type);

  const claimBonus = async (bonus) => {
    if (!user) {
      navigate("/register");
      return;
    }
    if (isClaimed(bonus.type)) return;
    setClaiming(bonus.type);
    try {
      const { error } = await supabase.rpc("credit_bonus", {
        p_user_id: user.id,
        p_amount: bonus.amount,
        p_bonus_type: bonus.type,
      });
      if (error) throw error;
      await refreshWallet();
      await fetchClaimedBonuses();
      await addNotification({
        category: "marketing",
        title: `${bonus.title} claimed!`,
        body: `${formatMoney(bonus.amount)} bonus has been added to your bonus balance. Use it on eligible sports bets.`,
      });
    } catch (e) {
      await addNotification({
        category: "error",
        title: "Failed to claim bonus",
        body: e.message,
      });
    } finally {
      setClaiming(null);
    }
  };

  const isPicked = (matchId, market, pick) =>
    selections.some((s) => s.matchId === matchId && s.market === market && s.pick === pick);

  const pickOdd = (match, market, pick, odds) => {
    addSelection({
      matchId: match.id,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      market,
      pick,
      odds,
    });
  };

  return (
    <div className="main-content">
      <Controls
        isLive={false}
        leagues={leagues}
        selectedLeague={selectedLeague}
        onLeagueChange={setSelectedLeague}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="section-header">
        <h2>
          <i className="fas fa-fire"></i> Featured Matches
        </h2>
        <span className="view-all">
          {loading ? "Loading..." : `${filtered.length} matches`}
        </span>
      </div>

      {error && <div className="no-matches">Unable to load matches: {error}. Retrying...</div>}

      <div className="matches-grid">
        {!loading && filtered.length === 0 && !error && (
          <div className="no-matches">No matches found. The data feed is warming up — check back shortly.</div>
        )}
        {filtered.slice(0, 12).map((match) => (
          <div className="match-card" key={match.id} onClick={() => navigate(`/live/${match.id}`)}>
            <div className="match-status">
              <span>{match.category} • {match.competition}</span>
              <span>{match.date} {match.time}</span>
            </div>
            <div className="match-teams">
              <div className="team">
                <div className="team-name">{match.homeTeam}</div>
              </div>
              <div className="match-score">
                <div className="score">-:-</div>
                <div className="match-time">{match.time || "TBD"}</div>
              </div>
              <div className="team">
                <div className="team-name">{match.awayTeam}</div>
              </div>
            </div>
            <div className="betting-options" onClick={(e) => e.stopPropagation()}>
              <div
                className={`bet-option ${isPicked(match.id, "1X2", "1") ? "selected" : ""}`}
                onClick={() => match.odds.home && pickOdd(match, "1X2", "1", match.odds.home)}
              >
                <div className="option-name">1</div>
                <div className="option-odds">{match.odds.home ? match.odds.home.toFixed(2) : "-"}</div>
              </div>
              <div
                className={`bet-option ${isPicked(match.id, "1X2", "X") ? "selected" : ""}`}
                onClick={() => match.odds.draw && pickOdd(match, "1X2", "X", match.odds.draw)}
              >
                <div className="option-name">X</div>
                <div className="option-odds">{match.odds.draw ? match.odds.draw.toFixed(2) : "-"}</div>
              </div>
              <div
                className={`bet-option ${isPicked(match.id, "1X2", "2") ? "selected" : ""}`}
                onClick={() => match.odds.away && pickOdd(match, "1X2", "2", match.odds.away)}
              >
                <div className="option-name">2</div>
                <div className="option-odds">{match.odds.away ? match.odds.away.toFixed(2) : "-"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <h2>
          <i className="fas fa-gift"></i> Special Offers
        </h2>
      </div>
      <div className="promotions">
        {BONUSES.map((bonus) => {
          const claimed = isClaimed(bonus.type);
          const descText = bonus.desc.replace("{amt}", formatMoney(bonus.amount));
          return (
            <div className={`promo-card ${claimed ? "claimed" : ""}`} key={bonus.type}>
              <div className="promo-icon">
                <i className={`fas ${bonus.icon}`}></i>
              </div>
              <h3 className="promo-title">{bonus.title}</h3>
              <p className="promo-desc">{descText}</p>
              {claimed ? (
                <button className="promo-btn claimed-btn" disabled>
                  <i className="fas fa-check"></i> Claimed
                </button>
              ) : (
                <button
                  className="promo-btn"
                  onClick={() => claimBonus(bonus)}
                  disabled={claiming === bonus.type}
                >
                  {claiming === bonus.type ? (
                    <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
                  ) : (
                    bonus.cta
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Home;
