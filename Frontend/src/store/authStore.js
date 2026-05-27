import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/apiClient';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // LOGIN
      login: async (credentials) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          // API CALL
          const res = await authApi.login(credentials);

          // GET DATA FROM RESPONSE
          const { user, token } = res.data;

          // SAVE TOKEN
          localStorage.setItem('crm_token', token);

          // UPDATE STATE
          set({
            user,
            token,
            isLoading: false,
            error: null,
          });

          return {
            success: true,
          };

        } catch (err) {
          console.error(err);

          set({
            error: err.response?.data?.message || 'Login failed',
            isLoading: false,
          });

          return {
            success: false,
            error: err.response?.data?.message || 'Login failed',
          };
        }
      },

      // LOGOUT
      logout: () => {
        localStorage.removeItem('crm_token');

        set({
          user: null,
          token: null,
          error: null,
        });
      },

      // CLEAR ERROR
      clearError: () => {
        set({
          error: null,
        });
      },

      // CHECK AUTH
      isAuthenticated: () => {
        return !!get().token;
      },

      // CHECK ROLE
      hasRole: (...roles) => {
        const user = get().user;

        if (!user) return false;

        return roles.includes(user.role);
      },
    }),
    {
      name: 'crm-auth',

      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

// AUTO LOGOUT EVENT
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout();
});

export default useAuthStore;