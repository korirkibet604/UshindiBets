// Normalize a betika-api match into a consistent shape for the UI.
// The raw `date` field is messy ("Spain • LaLiga\n08/05"); we keep league/competition separately
// and derive a display date from the `time` + `date` fields.
export const normalizeMatch = (m) => {
  const leagueParts = (m.league || "").split("•").map((s) => s.trim());
  const compParts = (m.competition || "").split("•").map((s) => s.trim());
  const league = leagueParts[0] || m.league || "Unknown";
  const competition = compParts[1] || leagueParts[1] || m.competition || league;

  // date field often looks like "Spain • LaLiga\n08/05" — extract trailing dd/mm
  let displayDate = m.date || "";
  const dateMatch = displayDate.match(/(\d{2}\/\d{2})/);
  if (dateMatch) displayDate = dateMatch[1];

  return {
    id: m.id,
    league,
    competition,
    date: displayDate,
    time: m.time || "",
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    odds: {
      home: m.odds?.home ?? null,
      draw: m.odds?.draw ?? null,
      away: m.odds?.away ?? null,
    },
    totalMarkets: m.totalMarkets || 0,
    markers: m.markers || [],
    matchUrl: m.matchUrl || "",
    scrapedAt: m.scrapedAt,
  };
};

export const normalizeMatches = (list = []) => (list || []).map(normalizeMatch);

// Extract unique leagues from normalized matches
export const extractLeagues = (matches = []) => {
  const map = new Map();
  matches.forEach((m) => {
    if (m.league && !map.has(m.league)) {
      map.set(m.league, { id: m.league, name: m.league, competition: m.competition });
    }
  });
  return Array.from(map.values());
};
