import { useTM } from '../context/TMContext';
import { SEVERITY_CONFIG } from '../data/tmMockData';

export default function TMSummaryCards() {
  const { summary, filters, setSeverityFilter } = useTM();

  if (!summary) return null;

  const cards = [
    { key: 'total', label: 'Total Alerts', value: summary.total, color: '#64748b' },
    { key: 'LOW', label: 'Low', value: summary.bySeverity.LOW, color: SEVERITY_CONFIG.LOW.color },
    { key: 'MEDIUM', label: 'Medium', value: summary.bySeverity.MEDIUM, color: SEVERITY_CONFIG.MEDIUM.color },
    { key: 'HIGH', label: 'High', value: summary.bySeverity.HIGH, color: SEVERITY_CONFIG.HIGH.color },
    { key: 'CRITICAL', label: 'Critical', value: summary.bySeverity.CRITICAL, color: SEVERITY_CONFIG.CRITICAL.color },
    { key: 'pending', label: 'Pending Review', value: summary.pendingReview, color: '#8b5cf6' },
  ];

  return (
    <div className="tm-summary-grid">
      {cards.map(card => {
        const isActive = filters.severity === card.key;
        const isSeverity = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(card.key);
        return (
          <button
            key={card.key}
            className={`tm-summary-card ${isActive ? 'tm-summary-card-active' : ''}`}
            onClick={() => isSeverity ? setSeverityFilter(card.key) : null}
            style={{ '--card-color': card.color }}
          >
            <div className="tm-card-value">{card.value}</div>
            <div className="tm-card-label">{card.label}</div>
            {isActive && <div className="tm-card-indicator" />}
          </button>
        );
      })}
    </div>
  );
}
