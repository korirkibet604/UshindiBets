// Normalize a betika-api match into a consistent shape for the UI.
// Real API fields: id, homeTeam, awayTeam, startTime ("YYYY-MM-DD HH:mm:ss"),
// competition, category, sportId, sportName, homeOdd, neutralOdd, awayOdd,
// odds[] (markets), sideBets, isEsport, isSrl.
export const normalizeMatch = (m) => {
  const startTime = m.startTime || "";
  let date = "";
  let time = "";
  if (startTime) {
    const parts = startTime.split(" ");
    date = parts[0] || "";
    time = parts[1] || "";
  }

  // Top-level 1X2 odds come as strings
  const odds = {
    home: num(m.homeOdd),
    draw: num(m.neutralOdd),
    away: num(m.awayOdd),
  };

  // Full markets array (each market: { sub_type_id, name, odds: [{display, odd_value, ...}] })
  const markets = (m.odds || []).map((mk) => ({
    id: mk.sub_type_id,
    name: mk.name,
    odds: (mk.odds || []).map((o) => ({
      display: o.display,
      key: o.odd_key,
      value: num(o.odd_value),
      specialBetValue: o.special_bet_value || "",
      outcomeId: o.outcome_id,
    })),
  }));

  return {
    id: m.id,
    homeTeam: m.homeTeam || "Home",
    awayTeam: m.awayTeam || "Away",
    startTime,
    date,
    time,
    competition: m.competition || "",
    category: m.category || "",
    sportId: m.sportId || "",
    sportName: m.sportName || "Soccer",
    competitionId: m.competitionId || "",
    sideBets: m.sideBets || "0",
    odds,
    markets,
    isEsport: !!m.isEsport,
    isSrl: !!m.isSrl,
  };
};

const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

export const normalizeMatches = (list = []) => (list || []).map(normalizeMatch);

// Extract unique categories (countries) from normalized matches
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

// Extract sports from normalized matches
export const extractSports = (matches = []) => {
  const map = new Map();
  matches.forEach((m) => {
    if (m.sportId && !map.has(m.sportId)) {
      map.set(m.sportId, { id: m.sportId, name: m.sportName });
    }
  });
  return Array.from(map.values());
};
