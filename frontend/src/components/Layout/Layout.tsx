/**
 * Modern application layout component with responsive design
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

  const sidebarWidth = sidebarCollapsed ? '64px' : '280px';

  return (
    <chakra.div h="100vh" overflow="hidden" bg="bg">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

      {/* Main content area */}
      <chakra.div
        display="flex"
        flexDirection="column"
        h="100vh"
        ml={{ base: '0', lg: sidebarWidth }}
        transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        {/* Header */}
        <Header onSidebarOpen={handleSidebarOpen} />

        {/* Page content */}
        <chakra.div
          bg="bg.subtle"
          flex="1"
          overflow="auto"
          position="relative"
          minH="0"
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
              backdropFilter="blur(4px)"
            >
              <chakra.div
                alignItems="center"
                bg="bg.surface"
                borderRadius="xl"
                boxShadow="lg"
                display="flex"
                flexDirection="column"
                gap="4"
                p="8"
                border="1px solid"
                borderColor="border.subtle"
              >
                <chakra.div
                  animation="spin 1s linear infinite"
                  border="2px solid"
                  borderColor="border.muted"
                  borderRadius="full"
                  borderTopColor="accent"
                  h="8"
                  w="8"
                />
                {loadingMessage && (
                  <chakra.div
                    color="text.subtle"
                    textAlign="center"
                    fontSize="sm"
                    fontWeight="medium"
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
