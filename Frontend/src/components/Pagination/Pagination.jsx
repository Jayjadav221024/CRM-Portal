import { memo } from 'react';
import useLeadsStore from '../../store/leadsStore';
import styles from './Pagination.module.css';

const Pagination = memo(({ pagination }) => {
  const { page, setPage, limit, setLimit } = useLeadsStore();

  if (!pagination) return null;

  const { total, totalPages, hasNextPage, hasPrevPage } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }

    return pages;
  };

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        Showing <strong>{from.toLocaleString()}–{to.toLocaleString()}</strong> of{' '}
        <strong>{total.toLocaleString()}</strong> leads
      </div>

      <div className={styles.controls}>
        <select
          className={styles.limitSelect}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>

        <div className={styles.pages}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(1)}
            disabled={!hasPrevPage}
            aria-label="First page"
          >«</button>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevPage}
            aria-label="Previous page"
          >‹</button>

          {getPageNumbers().map((p, i) =>
            p === '...'
              ? <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
              : (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >{p}</button>
              )
          )}

          <button
            className={styles.pageBtn}
            onClick={() => setPage(page + 1)}
            disabled={!hasNextPage}
            aria-label="Next page"
          >›</button>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(totalPages)}
            disabled={!hasNextPage}
            aria-label="Last page"
          >»</button>
        </div>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';
export default Pagination;