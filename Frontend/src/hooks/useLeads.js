import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/apiClient';
import useLeadsStore from '../store/leadsStore';

// QUERY KEYS
export const leadsKeys = {
  all: ['leads'],
  lists: () => [...leadsKeys.all, 'list'],
  list: (params) => [...leadsKeys.lists(), params],
  detail: (id) => [...leadsKeys.all, 'detail', id],
  search: (q) => [...leadsKeys.all, 'search', q],
  owners: () => [...leadsKeys.all, 'owners'],
  stats: () => [...leadsKeys.all, 'stats'],
};

// GET LEADS
export function useLeads() {
  const getQueryParams = useLeadsStore((s) => s.getQueryParams);

  const params = getQueryParams();

  return useQuery({
    queryKey: leadsKeys.list(params),

    queryFn: () => leadsApi.getLeads(params),

    placeholderData: (prev) => prev,

    staleTime: 30000,

    gcTime: 5 * 60 * 1000,
  });
}

// GLOBAL SEARCH
export function useLeadSearch(query) {
  return useQuery({
    queryKey: leadsKeys.search(query),

    queryFn: () => leadsApi.search(query),

    enabled: query.length >= 2,

    staleTime: 15000,

    gcTime: 2 * 60 * 1000,
  });
}

// OWNERS
export function useOwners() {
  return useQuery({
    queryKey: leadsKeys.owners(),

    queryFn: () => leadsApi.getOwners(),

    staleTime: 5 * 60 * 1000,
  });
}

// STATS
export function useLeadStats() {
  return useQuery({
    queryKey: leadsKeys.stats(),

    queryFn: () => leadsApi.getStats(),

    staleTime: 2 * 60 * 1000,
  });
}

// CREATE LEAD
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadsApi.createLead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: leadsKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: leadsKeys.stats(),
      });
    },
  });
}

// UPDATE LEAD
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      leadsApi.updateLead(id, data),

    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: leadsKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: leadsKeys.detail(id),
      });
    },
  });
}

// DELETE LEAD
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadsApi.deleteLead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: leadsKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: leadsKeys.stats(),
      });
    },
  });
}