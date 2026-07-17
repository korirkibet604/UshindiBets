import { useState, useEffect } from "react";
import "./Controls.scss";

function Controls({
  isLive = false,
  leagues = [],
  selectedLeague,
  onLeagueChange,
  searchQuery,
  onSearchChange,
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
    </div>
  );
}

export default Controls;
