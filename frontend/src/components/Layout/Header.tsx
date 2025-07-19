/**
 * Application header component
 */

import { chakra } from '@chakra-ui/react';
import {
  FiMenu,
  FiSun,
  FiMoon,
  FiRefreshCw,
  FiBell,
  FiSettings,
  FiChevronRight,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/store';
import { useHealthCheck } from '@/hooks/useApi';

interface HeaderProps {
  onSidebarOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarOpen }) => {
  const {
    isDarkMode,
    toggleDarkMode,
    pageTitle,
    breadcrumbs,
    notifications,
    clearNotifications,
  } = useUIStore();

  const { refetch: refetchHealth, isFetching: isRefreshing } = useHealthCheck();

  const unreadNotifications = notifications.filter(n => !n.autoClose).length;

  const handleRefresh = () => {
    refetchHealth();
  };

  return (
    <chakra.div
      bg="white"
      _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
      borderBottomWidth="1px"
      borderColor="gray.200"
      px="6"
      py="4"
      h="16"
    >
      <chakra.div display="flex" justifyContent="space-between" h="full">
        {/* Left side */}
        <chakra.div display="flex" alignItems="center" gap="4">
          {/* Mobile menu button */}
          <chakra.button
            aria-label="Open navigation menu"
            onClick={onSidebarOpen}
            display={{ base: 'flex', lg: 'none' }}
            p="2"
            bg="transparent"
            _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
            borderRadius="md"
            alignItems="center"
            justifyContent="center"
          >
            <FiMenu />
          </chakra.button>

          {/* Page title and breadcrumbs */}
          <chakra.div>
            <chakra.h1 fontSize="lg" fontWeight="semibold" color="gray.900" _dark={{ color: 'white' }}>
              {pageTitle}
            </chakra.h1>
            {breadcrumbs.length > 1 && (
              <chakra.nav
                fontSize="sm"
                color="gray.500"
                mt="1"
                display="flex"
                alignItems="center"
                gap="1"
              >
                {breadcrumbs.map((crumb, index) => (
                  <chakra.div key={index} display="flex" alignItems="center" gap="1">
                    {crumb.href ? (
                      <Link to={crumb.href}>
                        <chakra.span _hover={{ color: 'blue.500' }}>
                          {crumb.label}
                        </chakra.span>
                      </Link>
                    ) : (
                      <chakra.span>{crumb.label}</chakra.span>
                    )}
                    {index < breadcrumbs.length - 1 && <FiChevronRight size={12} />}
                  </chakra.div>
                ))}
              </chakra.nav>
            )}
          </chakra.div>
        </chakra.div>

        {/* Right side */}
        <chakra.div display="flex" alignItems="center" gap="2">
          {/* Refresh button */}
          <chakra.button
            aria-label="Refresh data"
            onClick={handleRefresh}
            p="2"
            bg="transparent"
            _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
            borderRadius="md"
            disabled={isRefreshing}
            _disabled={{ opacity: 0.5 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <chakra.div
              animation={isRefreshing ? 'spin 1s linear infinite' : undefined}
            >
              <FiRefreshCw />
            </chakra.div>
          </chakra.button>

          {/* Notifications */}
          <chakra.div position="relative">
            <chakra.button
              aria-label="Notifications"
              p="2"
              bg="transparent"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <FiBell />
              {unreadNotifications > 0 && (
                <chakra.span
                  position="absolute"
                  top="-1"
                  right="-1"
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  minW="5"
                  h="5"
                  fontSize="xs"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {unreadNotifications}
                </chakra.span>
              )}
            </chakra.button>
          </chakra.div>

          {/* Theme toggle */}
          <chakra.button
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleDarkMode}
            p="2"
            bg="transparent"
            _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {isDarkMode ? <FiSun /> : <FiMoon />}
          </chakra.button>

          {/* Settings menu */}
          <Link to="/settings">
            <chakra.button
              aria-label="Settings"
              p="2"
              bg="transparent"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <FiSettings />
            </chakra.button>
          </Link>
        </chakra.div>
      </chakra.div>
    </chakra.div>
  );
};

export default Header;