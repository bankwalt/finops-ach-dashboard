import { useExceptions } from '../context/ExceptionsContext';
import { EXCEPTION_CATEGORY_LABELS } from '../data/exceptionsMockData';

const CATEGORY_KEYS = [
  'achDebitDecisioning',
  'payoutRetryQueue',
  'vanExceptions',
  'reconExceptions',
  'achProcessingErrors',
  'achReturns',
  'rtpFedNowExceptions',
  'payoutExceptions',
  'infraAlerts',
];

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
            </button>
          );
        })}
      </div>
    </div>
  );
}
