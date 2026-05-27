import { memo, useCallback, useEffect } from 'react';
import useLeadsStore from '../../store/leadsStore';
import { useOwners } from '../../hooks/useLeads';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './LeadsFilters.module.css';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const LeadsFilters = memo(() => {
  const {
    status, setStatus,
    owner, setOwner,
    searchInput, setSearchInput,
    setSearchQuery,
    resetFilters,
  } = useLeadsStore();

  const { data: owners = [] } = useOwners();

  // Debounce the table search input separately from global search
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, [setSearchInput]);

  const hasActiveFilters = status || owner || searchInput;

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        {/* Table search */}
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Filter by name, email, company…"
            value={searchInput}
            onChange={handleSearchChange}
            className={styles.searchInput}
            aria-label="Filter leads"
          />
          {searchInput && (
            <button className={styles.clearInput} onClick={() => setSearchInput('')} aria-label="Clear filter">×</button>
          )}
        </div>

        {/* Status filter */}
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        {/* Owner filter */}
        <select
          className={styles.select}
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          aria-label="Filter by owner"
        >
          <option value="">All Owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button className={styles.resetBtn} onClick={resetFilters}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}>
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
          Clear filters
        </button>
      )}
    </div>
  );
});

LeadsFilters.displayName = 'LeadsFilters';
export default LeadsFilters;