import { useExceptions } from '../context/ExceptionsContext';
import { EXCEPTION_CATEGORY_LABELS } from '../data/exceptionsMockData';

const CATEGORY_KEYS = [
  'achDebitDecisioning',
  'vanExceptions',
  'reconExceptions',
  'achProcessingErrors',
  'achReturns',
  'rtpFedNowExceptions',
  'payoutExceptions',
  'infraAlerts',
];

function PriorityBreakdown({ data }) {
  const items = [
    { key: 'critical', count: data.critical },
    { key: 'high', count: data.high },
    { key: 'medium', count: data.medium },
    { key: 'low', count: data.low },
  ].filter(item => item.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="exc-category-breakdown">
      {items.map(item => (
        <span key={item.key} className="exc-priority-chip">
          <span className={`priority-dot priority-${item.key}`} />
          {item.count}
        </span>
      ))}
    </div>
  );
}

export default function ExceptionsSummary() {
  const { summary, activeCategory, setActiveCategory } = useExceptions();

  if (!summary) return null;

  const totalOpen = Object.values(summary).reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          Exception Queue
          <span className="count-badge">{totalOpen}</span>
        </h2>
      </div>
      <div className="exc-category-grid">
        {CATEGORY_KEYS.map(key => {
          const data = summary[key];
          if (!data) return null;
          const isActive = activeCategory === key;
          return (
            <button
              key={key}
              className={`exc-category-card ${isActive ? 'exc-category-card-active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              <div className="exc-category-name">
                {EXCEPTION_CATEGORY_LABELS[key]}
              </div>
              <div className="exc-category-count">{data.total}</div>
              <PriorityBreakdown data={data} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
