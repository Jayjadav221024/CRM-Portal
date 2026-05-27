import { create } from 'zustand';
 
/**
 * Centralized store for the leads table state.
 * Keeps pagination, sorting, and filters in one place so components
 * don't need to prop-drill or lift state manually.
 * Using Zustand avoids Context re-render cascades.
 */
const useLeadsStore = create((set, get) => ({
  // Pagination
  page: 1,
  limit: 25,
 
  // Sorting
  sortField: 'createdAt',
  sortOrder: 'desc',
 
  // Filters
  status: '',
  owner: '',
 
  // Search
  searchInput: '',   // Raw input (for controlled input)
  searchQuery: '',   // Debounced query (sent to API)
 
  // ─── Actions ──────────────────────────────────────────────────────────────
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
 
  setSort: (field) => {
    const { sortField, sortOrder } = get();
    if (sortField === field) {
      set({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc', page: 1 });
    } else {
      set({ sortField: field, sortOrder: 'asc', page: 1 });
    }
  },
 
  setStatus: (status) => set({ status, page: 1 }),
  setOwner: (owner) => set({ owner, page: 1 }),
 
  setSearchInput: (searchInput) => set({ searchInput }),
  setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
 
  resetFilters: () =>
    set({
      page: 1,
      status: '',
      owner: '',
      searchInput: '',
      searchQuery: '',
      sortField: 'createdAt',
      sortOrder: 'desc',
    }),
 
  // Build query params object for the API
  getQueryParams: () => {
    const { page, limit, sortField, sortOrder, status, owner, searchQuery } = get();
    return {
      page,
      limit,
      sortField,
      sortOrder,
      ...(status && { status }),
      ...(owner && { owner }),
      ...(searchQuery && { search: searchQuery }),
    };
  },
}));
 
export default useLeadsStore;