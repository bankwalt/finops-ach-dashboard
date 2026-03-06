import { useDashboard } from '../context/DashboardContext';

function formatTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getStatus(fird) {
  if (fird.received) return 'received';
  const now = new Date();
  const today = new Date();
  today.setHours(fird.deadlineHour, fird.deadlineMinute, 0, 0);
  if (now >= today) return 'overdue';
  return 'awaiting';
}

export default function FIRDStatus() {
  const { firdStatus } = useDashboard();

  if (!firdStatus) return null;

  const status = getStatus(firdStatus);

  return (
    <section className="panel fird-panel">
      <div className="fird-layout">
        <div className="fird-left">
          <h2 className="panel-title">FIRD File Status</h2>
          <span className="fird-deadline">Deadline: {firdStatus.deadline}</span>
        </div>
        <div className="fird-right">
          {status === 'received' && (
            <div className="fird-badge fird-received">
              <span className="fird-icon">&#10003;</span>
              <div>
                <div className="fird-badge-label">Received</div>
                <div className="fird-badge-time">{formatTime(firdStatus.receivedAt)}</div>
              </div>
            </div>
          )}
          {status === 'awaiting' && (
            <div className="fird-badge fird-awaiting">
              <span className="fird-icon">&mdash;</span>
              <div className="fird-badge-label">Awaiting</div>
            </div>
          )}
          {status === 'overdue' && (
            <div className="fird-badge fird-overdue">
              <span className="pulse-dot"></span>
              <div>
                <div className="fird-badge-label">Not Received — OVERDUE</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {firdStatus.fileName && status === 'received' && (
        <div className="fird-filename">{firdStatus.fileName}</div>
      )}
    </section>
  );
}
