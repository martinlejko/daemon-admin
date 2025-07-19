/**
 * Main application layout component
 */

import { chakra } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { useUIStore } from '@/store';
import NotificationToast from '../UI/NotificationToast';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const {
    isSidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    isLoading,
    loadingMessage,
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
        display="flex"
        flexDirection="column"
        h="100vh"
        ml={{ base: '0', lg: sidebarWidth }}
        transition="margin-left 0.2s"
      >
        {/* Header */}
        <Header onSidebarOpen={handleSidebarOpen} />

        {/* Page content */}
        <chakra.div
          _dark={{ bg: 'gray.800' }}
          bg="gray.50"
          flex="1"
          overflow="auto"
          position="relative"
        >
          {/* Loading overlay */}
          {isLoading && (
            <chakra.div
              alignItems="center"
              bg="blackAlpha.600"
              bottom="0"
              display="flex"
              justifyContent="center"
              left="0"
              position="absolute"
              right="0"
              top="0"
              zIndex="50"
            >
              <chakra.div
                _dark={{ bg: 'gray.900' }}
                alignItems="center"
                bg="white"
                borderRadius="lg"
                boxShadow="lg"
                display="flex"
                flexDirection="column"
                gap="4"
                p="8"
              >
                <chakra.div
                  animation="spin 1s linear infinite"
                  border="2px solid"
                  borderColor="gray.200"
                  borderRadius="full"
                  borderTopColor="blue.500"
                  h="8"
                  w="8"
                />
                {loadingMessage && (
                  <chakra.div
                    _dark={{ color: 'gray.400' }}
                    color="gray.600"
                    textAlign="center"
                  >
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
