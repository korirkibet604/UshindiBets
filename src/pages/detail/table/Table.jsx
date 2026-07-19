import './Table.scss'
import { useStandings } from '../../../hooks/useStandings'

function Table({ match }) {

    // Use the standings hook
    const { standings, loading: standingsLoading, error, refetch } = useStandings(match?.event?.tournament?.uniqueTournament?.id, match?.event?.season?.id)
    // Show error state
    if (error) {
        return (
            <div className="tab-content active" id="table">
                <h2>League Table</h2>
                <div className="error">
                    Error loading standings: {error}
                    <button onClick={refetch} className="retry-btn">Retry</button>
                </div>
            </div>
        )
    }

    // Helper function to determine row highlighting
    /*const getRowClassName = (position, promotion) => {
        if (!position) return ''

        const pos = parseInt(position)

        // Champions League spots (usually top 4)
        if (pos <= 4) return 'champions-league'

        // Europa League spots (usually 5-6)
        if (pos === 5 || pos === 6) return 'europa-league'

        // Relegation zone (usually bottom 3)
        if (pos >= 18) return 'relegation'

        // Check promotion object for special highlighting
        if (promotion?.name === 'Champions League') return 'champions-league'
        if (promotion?.name === 'UEFA Europa League') return 'europa-league'

        return ''
    }*/

    return (
        <div className="tab-content active" id="table">
            <h2>{ match?.event?.tournament?.name || 'League'} Table</h2>
            <table className="league-table">
                <thead>
                    <tr>
                        <th className="position">#</th>
                        <th>Team</th>
                        <th>PL</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GD</th>
                        <th>Pts</th>
                    </tr>
                </thead>
                {<tbody>
                    {standings && standings[0]?.tableRows?.map((row, index) => (
                        <tr
                            key={row.id || index}
                        >
                            <td className="position">{row.position}</td>
                            <td className="team-cell">
                                <img
                                    src={`https://img.sofascore.com/api/v1/team/${row.team.id}/image`}
                                    alt={row.team.name}
                                    className="team-logo-small"
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                    }}
                                />
                                <span className="team-name">{row.team.name}</span>
                            </td>
                            <td>{row.totalFields?.matchesTotal || '-'}</td>
                            <td>{row.totalFields?.winsTotal || '-'}</td>
                            <td>{row.totalFields?.drawsTotal || '-'}</td>
                            <td>{row.totalFields?.lossesTotal || '-'}</td>
                            <td>{row.totalFields?.scoreDiffFormattedTotal || '-'}</td>
                            <td className="points">
                                <strong>{row.totalFields?.pointsTotal || '-'}</strong>
                            </td>
                        </tr>
                    ))}
                </tbody>}
            </table>

            {/* Legend for table highlights */}
            <div className="table-legend">
                <div className="legend-item">
                    <span className="legend-color champions-league"></span>
                    <span>Champions League</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color europa-league"></span>
                    <span>Europa League</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color relegation"></span>
                    <span>Relegation</span>
                </div>
            </div>
        </div>
    )
}

export default Table;