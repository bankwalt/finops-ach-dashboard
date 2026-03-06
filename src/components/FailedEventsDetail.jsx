import { useDashboard } from '../context/DashboardContext';
import { MSG_STATE_LABELS, MSG_DIRECTION_LABELS, ACH_EVENT_TYPES } from '../data/mockData';

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function truncateId(id) {
  if (!id || id.length <= 20) return id;
  return id.slice(0, 10) + '...' + id.slice(-8);
}

function getMsgStateBadgeVariant(state) {
  if (state === 2001) return 'success';
  if (state === 2003) return 'error';
  if (state === 3000) return 'warning';
  if (state === 2000) return 'info';
  return 'neutral';
}

export default function FailedEventsDetail() {
  const { failedEvents, expandedEventId, toggleExpandedEvent, failedEventFilter, setFailedFilter } = useDashboard();

  if (!failedEvents) return null;

  const filtered = failedEventFilter
    ? failedEvents.filter(e => e.eventType === failedEventFilter)
    : failedEvents;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Failed Events</h2>
        <div className="filter-controls">
          <select
            className="filter-select"
            value={failedEventFilter || ''}
            onChange={e => setFailedFilter(e.target.value || null)}
          >
            <option value="">All Types ({failedEvents.length})</option>
            {ACH_EVENT_TYPES.map(type => {
              const count = failedEvents.filter(e => e.eventType === type).length;
              if (count === 0) return null;
              return (
                <option key={type} value={type}>{type} ({count})</option>
              );
            })}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No failed events for this filter.</div>
      ) : (
        <div className="table-wrapper">
          <table className="failed-table">
            <thead>
              <tr>
                <th className="th-expand"></th>
                <th>Event ID</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Error Time</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(event => {
                const isExpanded = expandedEventId === event.eventId;
                return (
                  <FailedEventRow
                    key={event.eventId}
                    event={event}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpandedEvent(event.eventId)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FailedEventRow({ event, isExpanded, onToggle }) {
  const variant = getMsgStateBadgeVariant(event.msgState);

  return (
    <>
      <tr className={`failed-row ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
        <td className="cell-expand">
          <span className={`chevron ${isExpanded ? 'chevron-open' : ''}`}>&#9654;</span>
        </td>
        <td className="cell-mono" title={event.eventId}>{truncateId(event.eventId)}</td>
        <td><span className="event-type-badge">{event.eventType}</span></td>
        <td>{MSG_DIRECTION_LABELS[event.msgDirection] || event.msgDirection}</td>
        <td className="cell-mono">{formatDateTime(event.endDtm)}</td>
        <td>
          <span className={`status-badge badge-${variant}`}>
            {MSG_STATE_LABELS[event.msgState] || event.msgState}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="expand-row">
          <td colSpan={6}>
            <div className="expand-content">
              <div className="expand-meta">
                <div className="meta-item">
                  <span className="meta-label">Full Event ID</span>
                  <span className="meta-value mono">{event.eventId}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Calendar</span>
                  <span className="meta-value">{event.calendarType} / {event.calendarId}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Channel</span>
                  <span className="meta-value mono">{event.channelId}</span>
                </div>
                {event.errInfo?.retryCnt != null && (
                  <div className="meta-item">
                    <span className="meta-label">Retry Count</span>
                    <span className="meta-value">{event.errInfo.retryCnt}</span>
                  </div>
                )}
              </div>
              {event.errInfo?.errors?.length > 0 && (
                <div className="error-list">
                  <h4 className="error-list-title">Error Details</h4>
                  {event.errInfo.errors.map((err, i) => (
                    <div key={i} className="error-detail">
                      <div className="error-header">
                        <span className="error-code">{err.errCode}</span>
                        <span className="error-time">{formatDateTime(err.errDtm)}</span>
                      </div>
                      <p className="error-desc">{err.errDesc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
