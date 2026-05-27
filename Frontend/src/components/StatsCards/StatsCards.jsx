import { memo } from 'react';
import { useLeadStats } from '../../hooks/useLeads';
import styles from './StatsCards.module.css';

const STATUS_COLORS = {
  new: 'var(--status-new)',
  contacted: 'var(--status-contacted)',
  qualified: 'var(--status-qualified)',
  proposal: 'var(--status-proposal)',
  won: 'var(--status-won)',
  lost: 'var(--status-lost)',
};

const StatsCards = memo(() => {
  const {
    data,
    isLoading,
  } = useLeadStats();

  // FIX RESPONSE SHAPE
  const stats = data?.data || data;

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className={`${styles.card} ${styles.skeleton}`}
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return <h3>No stats found</h3>;
  }

  return (
    <div className={styles.grid}>
      {/* TOTAL */}
      <div className={`${styles.card} ${styles.totalCard}`}>
        <div className={styles.label}>
          Total Leads
        </div>

        <div className={styles.value}>
          {stats.total || 0}
        </div>
      </div>

      {/* STATUS CARDS */}
      {stats.byStatus?.map((item) => {
        const status = item._id;
        const count = item.count;

        return (
          <div
            key={status}
            className={styles.card}
          >
            <div className={styles.label}>
              {status}
            </div>

            <div
              className={styles.value}
              style={{
                color:
                  STATUS_COLORS[status],
              }}
            >
              {count}
            </div>

            <div className={styles.bar}>
              <div
                className={styles.barFill}
                style={{
                  width: `${
                    (count / stats.total) * 100
                  }%`,
                  background:
                    STATUS_COLORS[status],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

export default StatsCards;