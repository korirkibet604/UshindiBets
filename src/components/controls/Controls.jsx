import { useState, useEffect } from "react";
import "./Controls.scss";

function Controls({
  isLive = false,
  leagues = [],
  selectedLeague,
  onLeagueChange,
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
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

  const todayStr = new Date().toISOString().split("T")[0];

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
        <div className="date-picker">
          <i className="fas fa-calendar-alt"></i>
          <input
            type="date"
            value={selectedDate || ""}
            onChange={(e) => onDateChange && onDateChange(e.target.value || null)}
            max={todayStr}
          />
          {selectedDate && (
            <button className="clear-date" onClick={() => onDateChange && onDateChange(null)}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="sort-dropdown">
          <i className="fas fa-sort-amount-down"></i>
          <select
            value={sortBy || "start_time"}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
          >
            <option value="start_time">Start Time</option>
            <option value="highlights">Highlights</option>
            <option value="top_leagues">Top Leagues</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default Controls;
