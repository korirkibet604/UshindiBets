// Normalize a match from either the betika-api server (transformed camelCase)
// or the raw live.betika.com endpoint (snake_case fields) into a consistent UI shape.
export const normalizeMatch = (m) => {
  const startTime = m.startTime || m.start_time || "";
  let date = "";
  let time = "";
  if (startTime) {
    const parts = startTime.split(" ");
    date = parts[0] || "";
    time = parts[1] || "";
  }

  const homeOdd = m.homeOdd ?? m.home_odd;
  const neutralOdd = m.neutralOdd ?? m.neutral_odd;
  const awayOdd = m.awayOdd ?? m.away_odd;

  const odds = {
    home: num(homeOdd),
    draw: num(neutralOdd),
    away: num(awayOdd),
  };

  // Markets: transformed API uses { sub_type_id, name, odds: [...] }
  // Raw live uses { sub_type_id, name, market_active, odds: [...] }
  const markets = (m.odds || m.markets || []).map((mk) => ({
    id: mk.sub_type_id ?? mk.subTypeId ?? mk.id,
    name: mk.name,
    active: mk.market_active !== undefined ? mk.market_active === 1 : mk.active !== false,
    odds: (mk.odds || []).map((o) => ({
      display: o.display,
      key: o.odd_key ?? o.key,
      value: num(o.odd_value ?? o.value),
      specialBetValue: (o.special_bet_value ?? o.specialBetValue) || "",
      outcomeId: o.outcome_id ?? o.outcomeId,
      active: o.odd_active !== undefined ? o.odd_active === 1 : o.active !== false,
    })),
  }));

  return {
    id: m.id ?? m.match_id,
    homeTeam: m.homeTeam || m.home_team || "Home",
    awayTeam: m.awayTeam || m.away_team || "Away",
    startTime,
    date,
    time,
    competition: m.competition || m.competition_name || "",
    category: m.category || "",
    sportId: m.sportId || m.sport_id || "",
    sportName: m.sportName || m.sport_name || "Soccer",
    competitionId: m.competitionId || m.competition_id || "",
    sideBets: m.sideBets ?? m.side_bets ?? "0",
    odds,
    markets,
    // Live-specific fields
    isLive: !!(m.liveStatus || m.match_status === "ACTIVE" || m.live_match_status === 1),
    liveStatus: m.liveStatus ?? m.match_status ?? m.event_status ?? "",
    currentScore: m.currentScore ?? m.current_score ?? "",
    matchTime: m.matchTime ?? m.match_time ?? "",
    eventStatus: m.eventStatus ?? m.event_status ?? "",
    homeRedCard: m.home_red_card ?? 0,
    awayRedCard: m.away_red_card ?? 0,
    isEsport: !!(m.isEsport ?? m.is_esport),
    isSrl: !!(m.isSrl ?? m.is_srl),
  };
};

const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

export const normalizeMatches = (list = []) => (list || []).map(normalizeMatch);

export const extractLeagues = (matches = []) => {
  const map = new Map();
  matches.forEach((m) => {
    const key = m.category || m.competition;
    if (key && !map.has(key)) {
      map.set(key, {
        id: m.competitionId || key,
        name: m.competition ? `${m.category} • ${m.competition}` : key,
        category: m.category,
        competition: m.competition,
      });
    }
  });
  return Array.from(map.values());
};

export const extractSports = (matches = []) => {
  const map = new Map();
  matches.forEach((m) => {
    if (m.sportId && !map.has(m.sportId)) {
      map.set(m.sportId, { id: m.sportId, name: m.sportName });
    }
  });
  return Array.from(map.values());
};
