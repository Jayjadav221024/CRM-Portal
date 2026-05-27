import { memo } from 'react';

const STATUS_CONFIG = {
  new:       { label: 'New',       color: 'var(--status-new)' },
  contacted: { label: 'Contacted', color: 'var(--status-contacted)' },
  qualified: { label: 'Qualified', color: 'var(--status-qualified)' },
  proposal:  { label: 'Proposal',  color: 'var(--status-proposal)' },
  won:       { label: 'Won',       color: 'var(--status-won)' },
  lost:      { label: 'Lost',      color: 'var(--status-lost)' },
};

const StatusBadge = memo(({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, color: 'var(--text-muted)' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: config.color,
        background: `${config.color}18`,
        border: `1px solid ${config.color}35`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
export default StatusBadge;