/**
 * Main application component with routing and providers
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from '@/components/Layout/layout';
import AddServer from '@/pages/AddServer';
import Dashboard from '@/pages/Dashboard';
import EditServer from '@/pages/EditServer';
import EditService from '@/pages/EditService';
import NotFound from '@/pages/NotFound';
import ServerDetail from '@/pages/ServerDetail';
import Servers from '@/pages/Servers';
import ServiceDetail from '@/pages/ServiceDetail';
import Services from '@/pages/Services';
import Settings from '@/pages/Settings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route element={<Layout />} path="/">
            <Route element={<Dashboard />} index />

            {/* Server routes */}
            <Route element={<Servers />} path="servers" />
            <Route element={<AddServer />} path="servers/new" />
            <Route element={<ServerDetail />} path="servers/:id" />
            <Route element={<EditServer />} path="servers/:id/edit" />

            {/* Service routes */}
            <Route element={<Services />} path="services" />
            <Route element={<ServiceDetail />} path="services/:id" />
            <Route element={<EditService />} path="services/:id/edit" />

            {/* Settings routes */}
            <Route element={<Settings />} path="settings" />

            {/* 404 route */}
            <Route element={<NotFound />} path="*" />
          </Route>
        </Routes>
      </Router>

      {/* React Query Devtools (only in development) */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;
