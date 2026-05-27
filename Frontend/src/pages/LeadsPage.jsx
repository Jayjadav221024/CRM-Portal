import { Suspense, lazy, memo } from 'react';
import GlobalSearch from '../components/GlobalSearch/GlobalSearch';
import useAuthStore from '../store/authStore';
import styles from './LeadsPage.module.css';

// Code splitting — StatsCards loads on demand
const StatsCards = lazy(() => import('../components/StatsCards/StatsCards'));
const LeadsTable = lazy(() => import('../components/LeadsTable/LeadsTable'));

const TableFallback = () => (
  <div className={styles.tableSkeleton}>
    <div className={styles.skeletonBar} style={{ width: '100%', height: 40 }} />
    {Array.from({ length: 12 }, (_, i) => (
      <div key={i} className={styles.skeletonRow} style={{ animationDelay: `${i * 50}ms` }} />
    ))}
  </div>
);

const LeadsPage = memo(() => {
  const { user, logout } = useAuthStore();

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoMark}>CRM</div>
          <span className={styles.logoText}>LeadBase</span>
        </div>

        <nav className={styles.nav}>
          <a href="/" className={`${styles.navItem} `}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <rect x={3} y={3} width={7} height={7} rx={1} />
              <rect x={14} y={3} width={7} height={7} rx={1} />
              <rect x={3} y={14} width={7} height={7} rx={1} />
              <rect x={14} y={14} width={7} height={7} rx={1} />
            </svg>
            Dashboard
          </a>
          <a href="#" className={styles.navItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx={9} cy={7} r={4} />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Leads
          </a>
          <a href="#" className={styles.navItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <rect x={2} y={3} width={20} height={14} rx={2} />
              <path d="M8 21h8M12 17v4" />
            </svg>
            Contacts
          </a>
          <a href="#" className={styles.navItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Companies
          </a>
          <a href="#" className={styles.navItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Reports
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={logout} aria-label="Log out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1={21} y1={12} x2={9} y2={12} />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h1 className={styles.pageTitle}>Leads</h1>
            <span className={styles.breadcrumb}>Dashboard / Leads</span>
          </div>
          <GlobalSearch />
        </header>

        <div className={styles.content}>
          {/* Stats */}
          <section className={styles.section}>
            <Suspense fallback={<div className={styles.statsPlaceholder} />}>
              <StatsCards />
            </Suspense>
          </section>

          {/* Leads Table */}
          <section className={styles.section}>
            <div className={styles.tableHeader}>
              <h2 className={styles.sectionTitle}>All Leads</h2>
            </div>
            <Suspense fallback={<TableFallback />}>
              <LeadsTable />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
});

LeadsPage.displayName = 'LeadsPage';
export default LeadsPage;