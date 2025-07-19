/**
 * Main application component with routing and providers
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard';

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
            <Route
              element={<div>Servers page - coming soon</div>}
              path="servers"
            />
            <Route
              element={<div>Add server page - coming soon</div>}
              path="servers/new"
            />
            <Route
              element={<div>Server details page - coming soon</div>}
              path="servers/:id"
            />

            {/* Service routes */}
            <Route
              element={<div>Services page - coming soon</div>}
              path="services"
            />
            <Route
              element={<div>Service details page - coming soon</div>}
              path="services/:id"
            />

            {/* Settings routes */}
            <Route
              element={<div>Settings page - coming soon</div>}
              path="settings"
            />

            {/* 404 route */}
            <Route element={<div>Page not found</div>} path="*" />
          </Route>
        </Routes>
      </Router>

      {/* React Query Devtools (only in development) */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;
