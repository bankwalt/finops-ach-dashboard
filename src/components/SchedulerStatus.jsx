import { useDashboard } from '../context/DashboardContext';

function parseFrequency(freq) {
  if (!freq) return '--';
  const match = freq.match(/^1(D|BA)T(\d{2}):(\d{2})(AM|PM)$/);
  if (!match) return freq;
  const [, dayType, hour, min, ampm] = match;
  const dayLabel = dayType === 'D' ? 'Daily' : 'Business Day';
  return `${dayLabel} @ ${hour}:${min} ${ampm}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isOverdue(calendar) {
  if (!calendar.nextSchedDtm || !calendar.isScheduled) return false;
  return new Date(calendar.nextSchedDtm) < new Date();
}

export default function SchedulerStatus() {
  const { calendars } = useDashboard();

  if (!calendars || calendars.length === 0) return null;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">ACH Scheduler Status</h2>
        <span className="count-badge">{calendars.length} events</span>
      </div>
      <div className="table-wrapper">
        <table className="scheduler-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Type</th>
              <th>Frequency</th>
              <th>Next Scheduled</th>
              <th>Last Run</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {calendars.map(cal => {
              const overdue = isOverdue(cal);
              return (
                <tr key={cal._Id} className={overdue ? 'row-overdue' : ''}>
                  <td className="cell-name">{cal.name}</td>
                  <td>
                    <span className="event-type-badge">{cal.eventType}</span>
                  </td>
                  <td className="cell-mono">{parseFrequency(cal.eventFreq)}</td>
                  <td className="cell-mono">{formatDateTime(cal.nextSchedDtm)}</td>
                  <td className="cell-mono">{formatDateTime(cal.prevSchedDtm)}</td>
                  <td>
                    {overdue ? (
                      <span className="status-badge badge-error">Overdue</span>
                    ) : (
                      <span className="status-badge badge-success">On Schedule</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
