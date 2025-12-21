import { useEffect, useState } from 'react';
import { BETTING_FREE } from '../../constants'
import './Controls.scss'
import { useSports } from '../../hooks/useSports';

function Controls({isLive=false, leagues=[], selectedDate, onDateChange, selectedLeague, onLeagueChange, searchQuery, onSearchChange}) {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { sports, sportsLoading, sportsError } = useSports();
    const [selectedSport, setSelectedSport] = useState("");
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Generate categories from leagues
    const categories = [
        {
            id: 'all',
            label: "All Matches",
            icon: "fa-fire"
        },
        {
            id: 'favorites',
            label: "Favorites",
            icon: "fa-star"
        },
        ...(leagues ? leagues.map(league => ({
            id: league.id,
            label: league.name,
            icon: league.uniqueTournament ? league.uniqueTournament.id : league.id,//
            league: league
        })) : [])
    ];

    function displayDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();

        if (currentDate.toDateString() === today.toDateString()) {
            return currentDate.toLocaleDateString('en-US', options) + ' <span style={{color: var(--highlight);">(Today)</span>';
        } else {
            return currentDate.toLocaleDateString('en-US', options);
        }
    }

    const handleClick = (type) => {
        const newDate = new Date(currentDate);
        if (type === "add") {
            newDate.setDate(newDate.getDate() + 1);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
        onDateChange && onDateChange(newDate);
    }

    const handleDatePicker = () => {
        setShowDatePicker(true);
    }

    const handleDateChange = (e) => {
        if (e.target.value) {
            const newDate = new Date(e.target.value);
            setCurrentDate(newDate);
            onDateChange && onDateChange(newDate);
            setShowDatePicker(false);
        }
    }

    const handleTodayClick = () => {
        const today = new Date();
        setCurrentDate(today);
        onDateChange && onDateChange(today);
        setShowDatePicker(false);
    }

    const handleCategoryClick = (category) => {
        setSelectedCategory(category.id);
        if (category.id === 'all') {
            onLeagueChange && onLeagueChange(null);
        } else if (category.league) {
            onLeagueChange && onLeagueChange(category.league);
        }
    }

    const handleSearchChange = (e) => {
        onSearchChange && onSearchChange(e.target.value);
    }

    // Sync with parent selectedDate
    useEffect(() => {
        if (selectedDate) {
            setCurrentDate(selectedDate);
        }
    }, [selectedDate]);

    // Set default category
    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0]);
        }
    }, [categories]);

    useEffect(() => {
        sports.length > 0 && setSelectedSport(sports[0].sport_id);
    }, [sports]);

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showDatePicker && !e.target.closest('.date-picker-modal') && !e.target.closest('#datePicker')) {
                setShowDatePicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDatePicker]);

    return (
        <div>
            <div className="filters">
                {
                    sports.map(sport => {
                        return (<button
                            key={sport.sport_id}
                            className={`filter-btn ${sport.sport_id === selectedSport ? "active" : ""}`}
                            onClick={() => setSelectedSport(sport.sport_id)}
                        >{sport.sport_name}</button>)
                    })
                }
            </div>
            {!isLive && (
                <div className="date-selector">
                    <div className="date-navigation">
                        <button className="date-btn" id="prevDate" onClick={() => handleClick("minus")}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="current-date" id="currentDate" dangerouslySetInnerHTML={{ __html: displayDate() }}></div>
                        <button className="date-btn" id="nextDate" onClick={() => handleClick("add")}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <button className="date-calendar" id="datePicker" onClick={handleDatePicker}>
                        <i className="fas fa-calendar-alt"></i> Select Date
                    </button>

                    {/* Date Picker Modal */}
                    {showDatePicker && (
                        <div className="date-picker-modal" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '10px',
                            zIndex: 1000,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}>
                            <input
                                type="date"
                                value={currentDate.toISOString().split('T')[0]}
                                onChange={handleDateChange}
                                autoFocus
                            />
                            <button
                                onClick={handleTodayClick}
                                style={{
                                    marginLeft: '10px',
                                    padding: '5px 10px',
                                    background: 'var(--highlight)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                }}
                            >
                                Today
                            </button>
                        </div>
                    )}
                </div>
            )}
            {/* Controls */}
            <div className="controls">
                <div className="filters">
                    {
                        categories.map(category => {
                            return (<button
                                key={category.id}
                                className={`filter-btn ${category.id === selectedCategory ? "active" : ""}`}
                                onClick={() => handleCategoryClick(category)}
                            >
                                {
                                    ["fa-fire", "fa-star", "fa-futbol"].includes(category.icon) ? <i className={`fas ${category.icon}`}></i> :
                                    <img src={`https://img.sofascore.com/api/v1/unique-tournament/${category.icon}/image`} alt="" className=''/>
                                }
                                {category.label}
                            </button>)
                        })
                    }
                </div>
                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search for teams, leagues..."
                        value={searchQuery || ''}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>
        </div>
    )
}

export default Controls;