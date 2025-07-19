/**
 * Zustand store for global application state
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// UI state
interface UIState {
  // Sidebar state
  isSidebarOpen: boolean;
  sidebarCollapsed: boolean;


  // Layout state
  pageTitle: string;
  breadcrumbs: Array<{ label: string; href?: string }>;

  // Loading states
  isLoading: boolean;
  loadingMessage?: string;

  // Notification state
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    autoClose?: boolean;
  }>;
}

interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;


  // Layout actions
  setPageTitle: (title: string) => void;
  setBreadcrumbs: (
    breadcrumbs: Array<{ label: string; href?: string }>
  ) => void;

  // Loading actions
  setLoading: (loading: boolean, message?: string) => void;

  // Notification actions
  addNotification: (
    notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      // Initial state
      isSidebarOpen: true,
      sidebarCollapsed: false,
      pageTitle: 'Dashboard',
      breadcrumbs: [{ label: 'Dashboard' }],
      isLoading: false,
      loadingMessage: undefined,
      notifications: [],

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),


      // Layout actions
      setPageTitle: (title) => set({ pageTitle: title }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      // Loading actions
      setLoading: (loading, message) =>
        set({ isLoading: loading, loadingMessage: message }),

      // Notification actions
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = {
          ...notification,
          id,
          timestamp: new Date(),
          autoClose: notification.autoClose ?? true,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove notification after 5 seconds if autoClose is true
        if (newNotification.autoClose) {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'owleyes-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain UI preferences
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Server management state
interface ServerState {
  selectedServerId?: number;
  serverFilters: {
    search?: string;
    status?: string;
    enabled_only?: boolean;
  };
  serverView: 'list' | 'grid';
}

interface ServerActions {
  setSelectedServer: (id?: number) => void;
  setServerFilters: (filters: Partial<ServerState['serverFilters']>) => void;
  clearServerFilters: () => void;
  setServerView: (view: ServerState['serverView']) => void;
}

export const useServerStore = create<ServerState & ServerActions>()(
  persist(
    (set) => ({
      // Initial state
      selectedServerId: undefined,
      serverFilters: {},
      serverView: 'list',

      // Actions
      setSelectedServer: (id) => set({ selectedServerId: id }),
      setServerFilters: (filters) =>
        set((state) => ({
          serverFilters: { ...state.serverFilters, ...filters },
        })),
      clearServerFilters: () => set({ serverFilters: {} }),
      setServerView: (view) => set({ serverView: view }),
    }),
    {
      name: 'owleyes-server-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        serverView: state.serverView,
      }),
    }
  )
);

// Service management state
interface ServiceState {
  selectedServiceId?: number;
  serviceFilters: {
    server_id?: number;
    search?: string;
    status_filter?: string;
    service_type?: string;
    enabled_only?: boolean;
  };
  serviceView: 'list' | 'grid';
  showServiceLogs: boolean;
  logServiceId?: number;
}

interface ServiceActions {
  setSelectedService: (id?: number) => void;
  setServiceFilters: (filters: Partial<ServiceState['serviceFilters']>) => void;
  clearServiceFilters: () => void;
  setServiceView: (view: ServiceState['serviceView']) => void;
  setShowServiceLogs: (show: boolean, serviceId?: number) => void;
}

export const useServiceStore = create<ServiceState & ServiceActions>()(
  persist(
    (set) => ({
      // Initial state
      selectedServiceId: undefined,
      serviceFilters: {},
      serviceView: 'list',
      showServiceLogs: false,
      logServiceId: undefined,

      // Actions
      setSelectedService: (id) => set({ selectedServiceId: id }),
      setServiceFilters: (filters) =>
        set((state) => ({
          serviceFilters: { ...state.serviceFilters, ...filters },
        })),
      clearServiceFilters: () => set({ serviceFilters: {} }),
      setServiceView: (view) => set({ serviceView: view }),
      setShowServiceLogs: (show, serviceId) =>
        set({
          showServiceLogs: show,
          logServiceId: show ? serviceId : undefined,
        }),
    }),
    {
      name: 'owleyes-service-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        serviceView: state.serviceView,
      }),
    }
  )
);

// App settings state
interface AppSettings {
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // in seconds
  pageSize: number;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface AppSettingsActions {
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultAppSettings: AppSettings = {
  autoRefreshEnabled: true,
  autoRefreshInterval: 30,
  pageSize: 20,
  dateFormat: 'yyyy-MM-dd',
  timeFormat: '24h',
};

export const useAppSettingsStore = create<AppSettings & AppSettingsActions>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultAppSettings,

      // Actions
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetSettings: () => set(defaultAppSettings),
    }),
    {
      name: 'owleyes-app-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
