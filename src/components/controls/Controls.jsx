import { useState, useEffect } from "react";
import "./Controls.scss";

const SORT_OPTIONS = [
  { value: 1, label: "Highlights" },
  { value: 2, label: "Start Time" },
  { value: 3, label: "Top Leagues" },
];

const PERIOD_OPTIONS = [
  { value: -2, label: "Next 48 Hours" },
  { value: -1, label: "Today" },
  { value: 1, label: "Tomorrow" },
  { value: 2, label: "Day After Tomorrow" },
  { value: 3, label: "In 3 Days" },
  { value: 4, label: "In 4 Days" },
  { value: 5, label: "In 5 Days" },
  { value: 6, label: "In 6 Days" },
  { value: 7, label: "In 7 Days" },
];

function Controls({
  isLive = false,
  leagues = [],
  selectedLeague,
  onLeagueChange,
  searchQuery,
  onSearchChange,
  selectedPeriod,
  onPeriodChange,
  sortBy,
  onSortChange,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Matches", icon: "fa-fire" },
    { id: "favorites", label: "Favorites", icon: "fa-star" },
    ...(leagues || []).map((league) => ({
      id: league.id || league.name,
      label: league.name,
      icon: "fa-futbol",
      league,
    })),
  ];

  useEffect(() => {
    if (!selectedLeague) setSelectedCategory("all");
  }, [selectedLeague]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.id);
    if (category.id === "all" || category.id === "favorites") {
      onLeagueChange && onLeagueChange(null);
    } else if (category.league) {
      onLeagueChange && onLeagueChange(category.league);
    }
  };

  const handleSearchChange = (e) => onSearchChange && onSearchChange(e.target.value);

  return (
    <div>
      <div className="controls">
        <div className="filters">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`filter-btn ${category.id === selectedCategory ? "active" : ""}`}
              onClick={() => handleCategoryClick(category)}
            >
              <i className={`fas ${category.icon}`}></i>
              {category.label}
            </button>
          ))}
        </div>
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search teams, leagues..."
            value={searchQuery || ""}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="controls-secondary">
        {!isLive && (
          <div className="period-dropdown">
            <i className="fas fa-clock"></i>
            <select
              value={selectedPeriod ?? -1}
              onChange={(e) => onPeriodChange && onPeriodChange(Number(e.target.value))}
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="sort-dropdown">
          <i className="fas fa-sort-amount-down"></i>
          <select
            value={sortBy ?? 1}
            onChange={(e) => onSortChange && onSortChange(Number(e.target.value))}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default Controls;
