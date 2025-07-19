/**
 * Main application component with routing and providers
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            
            {/* Server routes */}
            <Route path="servers" element={<div>Servers page - coming soon</div>} />
            <Route path="servers/new" element={<div>Add server page - coming soon</div>} />
            <Route path="servers/:id" element={<div>Server details page - coming soon</div>} />
            
            {/* Service routes */}
            <Route path="services" element={<div>Services page - coming soon</div>} />
            <Route path="services/:id" element={<div>Service details page - coming soon</div>} />
            
            {/* Settings routes */}
            <Route path="settings" element={<div>Settings page - coming soon</div>} />
            
            {/* 404 route */}
            <Route path="*" element={<div>Page not found</div>} />
          </Route>
        </Routes>
      </Router>
      
      {/* React Query Devtools (only in development) */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;