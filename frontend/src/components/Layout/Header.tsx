/**
 * Application header component
 */

import { chakra } from '@chakra-ui/react';
import {
  FiBell,
  FiChevronRight,
  FiMenu,
  FiMoon,
  FiRefreshCw,
  FiSettings,
  FiSun,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useHealthCheck } from '@/hooks/useApi';
import { useUIStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  onSidebarOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarOpen }) => {
  const {
    pageTitle,
    breadcrumbs,
    notifications,
    clearNotifications,
  } = useUIStore();
  
  const { isDark, toggleTheme } = useTheme();

  const { refetch: refetchHealth, isFetching: isRefreshing } = useHealthCheck();

  const unreadNotifications = notifications.filter((n) => !n.autoClose).length;

  const handleRefresh = () => {
    refetchHealth();
  };

  return (
    <chakra.div
      bg="bg.surface"
      borderBottomWidth="1px"
      borderColor="border"
      h="16"
      px="6"
      py="4"
      backdropFilter="blur(8px)"
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <chakra.div display="flex" h="full" justifyContent="space-between">
        {/* Left side */}
        <chakra.div alignItems="center" display="flex" gap="4">
          {/* Mobile menu button */}
          <chakra.button
            _hover={{ bg: 'bg.subtle' }}
            alignItems="center"
            aria-label="Open navigation menu"
            bg="transparent"
            borderRadius="md"
            display={{ base: 'flex', lg: 'none' }}
            justifyContent="center"
            onClick={onSidebarOpen}
            p="2"
            color="text.subtle"
            transition="all 0.2s"
          >
            <FiMenu />
          </chakra.button>

          {/* Page title and breadcrumbs */}
          <chakra.div>
            <chakra.h1
              color="text"
              fontSize="lg"
              fontWeight="semibold"
            >
              {pageTitle}
            </chakra.h1>
            {breadcrumbs.length > 1 && (
              <chakra.nav
                alignItems="center"
                color="text.subtle"
                display="flex"
                fontSize="sm"
                gap="1"
                mt="1"
              >
                {breadcrumbs.map((crumb, index) => (
                  <chakra.div
                    alignItems="center"
                    display="flex"
                    gap="1"
                    key={index}
                  >
                    {crumb.href ? (
                      <Link to={crumb.href}>
                        <chakra.span _hover={{ color: 'accent' }} transition="all 0.2s">
                          {crumb.label}
                        </chakra.span>
                      </Link>
                    ) : (
                      <chakra.span>{crumb.label}</chakra.span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <FiChevronRight size={12} />
                    )}
                  </chakra.div>
                ))}
              </chakra.nav>
            )}
          </chakra.div>
        </chakra.div>

        {/* Right side */}
        <chakra.div alignItems="center" display="flex" gap="2">
          {/* Refresh button */}
          <chakra.button
            _disabled={{ opacity: 0.5 }}
            _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
            alignItems="center"
            aria-label="Refresh data"
            bg="transparent"
            borderRadius="md"
            disabled={isRefreshing}
            display="flex"
            justifyContent="center"
            onClick={handleRefresh}
            p="2"
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
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              alignItems="center"
              aria-label="Notifications"
              bg="transparent"
              borderRadius="md"
              display="flex"
              justifyContent="center"
              p="2"
            >
              <FiBell />
              {unreadNotifications > 0 && (
                <chakra.span
                  alignItems="center"
                  bg="red.500"
                  borderRadius="full"
                  color="white"
                  display="flex"
                  fontSize="xs"
                  h="5"
                  justifyContent="center"
                  minW="5"
                  position="absolute"
                  right="-1"
                  top="-1"
                >
                  {unreadNotifications}
                </chakra.span>
              )}
            </chakra.button>
          </chakra.div>

          {/* Theme toggle */}
          <chakra.button
            _hover={{ bg: 'bg.subtle' }}
            alignItems="center"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            bg="transparent"
            borderRadius="md"
            display="flex"
            justifyContent="center"
            onClick={toggleTheme}
            p="2"
            color="text.subtle"
            transition="all 0.2s"
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </chakra.button>

          {/* Settings menu */}
          <Link to="/settings">
            <chakra.button
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              alignItems="center"
              aria-label="Settings"
              bg="transparent"
              borderRadius="md"
              display="flex"
              justifyContent="center"
              p="2"
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
