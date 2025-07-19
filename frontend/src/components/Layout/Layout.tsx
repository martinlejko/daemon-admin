/**
 * Main application layout component
 */

import { chakra } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { useUIStore } from '@/store';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationToast from '../UI/NotificationToast';

const Layout: React.FC = () => {
  const { 
    isSidebarOpen, 
    setSidebarOpen, 
    sidebarCollapsed,
    isLoading,
    loadingMessage 
  } = useUIStore();

  const handleSidebarOpen = () => setSidebarOpen(true);
  const handleSidebarClose = () => setSidebarOpen(false);

  const sidebarWidth = sidebarCollapsed ? '64px' : '256px';

  return (
    <chakra.div h="100vh" overflow="hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

      {/* Main content area */}
      <chakra.div
        ml={{ base: '0', lg: sidebarWidth }}
        transition="margin-left 0.2s"
        h="100vh"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Header onSidebarOpen={handleSidebarOpen} />

        {/* Page content */}
        <chakra.div
          flex="1"
          overflow="auto"
          bg="gray.50"
          _dark={{ bg: 'gray.800' }}
          position="relative"
        >
          {/* Loading overlay */}
          {isLoading && (
            <chakra.div
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="blackAlpha.600"
              zIndex="50"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <chakra.div
                bg="white"
                _dark={{ bg: 'gray.900' }}
                p="8"
                borderRadius="lg"
                boxShadow="lg"
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap="4"
              >
                <chakra.div
                  w="8"
                  h="8"
                  border="2px solid"
                  borderColor="gray.200"
                  borderTopColor="blue.500"
                  borderRadius="full"
                  animation="spin 1s linear infinite"
                />
                {loadingMessage && (
                  <chakra.div textAlign="center" color="gray.600" _dark={{ color: 'gray.400' }}>
                    {loadingMessage}
                  </chakra.div>
                )}
              </chakra.div>
            </chakra.div>
          )}

          {/* Router outlet */}
          <Outlet />
        </chakra.div>
      </chakra.div>

      {/* Notification toasts */}
      <NotificationToast />
    </chakra.div>
  );
};

export default Layout;