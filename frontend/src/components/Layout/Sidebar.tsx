/**
 * Application sidebar navigation component
 */

import { chakra } from '@chakra-ui/react';
import {
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiServer,
  FiSettings,
  FiX,
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: FiHome,
    href: '/',
  },
  {
    label: 'Servers',
    icon: FiServer,
    href: '/servers',
  },
  {
    label: 'Services',
    icon: FiActivity,
    href: '/services',
  },
  {
    label: 'Settings',
    icon: FiSettings,
    href: '/settings',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <chakra.div
          bg="blackAlpha.600"
          bottom="0"
          display={{ base: 'block', lg: 'none' }}
          left="0"
          onClick={onClose}
          position="fixed"
          right="0"
          top="0"
          zIndex="10"
        />
      )}

      {/* Sidebar */}
      <chakra.div
        _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
        bg="white"
        borderColor="gray.200"
        borderRightWidth="1px"
        display="flex"
        flexDirection="column"
        h="100vh"
        left="0"
        position="fixed"
        top="0"
        transform={{
          base: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          lg: 'translateX(0)',
        }}
        transition="all 0.2s"
        w={sidebarCollapsed ? '16' : '64'}
        zIndex="20"
      >
        {/* Header */}
        <chakra.div
          alignItems="center"
          borderBottomWidth="1px"
          borderColor="gray.200"
          display="flex"
          h="16"
          justifyContent="space-between"
          px={sidebarCollapsed ? '4' : '6'}
        >
          {!sidebarCollapsed && (
            <chakra.div alignItems="center" display="flex" gap="3">
              <chakra.div
                alignItems="center"
                bg="blue.500"
                borderRadius="md"
                display="flex"
                h="8"
                justifyContent="center"
                w="8"
              >
                <chakra.span color="white" fontSize="lg" fontWeight="bold">
                  O
                </chakra.span>
              </chakra.div>
              <chakra.span
                _dark={{ color: 'white' }}
                color="gray.900"
                fontSize="lg"
                fontWeight="bold"
              >
                Owleyes
              </chakra.span>
            </chakra.div>
          )}

          <chakra.div display="flex" gap="1">
            {/* Collapse button (desktop) */}
            <chakra.button
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              alignItems="center"
              aria-label={
                sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
              bg="transparent"
              borderRadius="md"
              display={{ base: 'none', lg: 'flex' }}
              justifyContent="center"
              onClick={toggleSidebarCollapsed}
              p="2"
            >
              {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </chakra.button>

            {/* Close button (mobile) */}
            <chakra.button
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              alignItems="center"
              aria-label="Close sidebar"
              bg="transparent"
              borderRadius="md"
              display={{ base: 'flex', lg: 'none' }}
              justifyContent="center"
              onClick={onClose}
              p="2"
            >
              <FiX />
            </chakra.button>
          </chakra.div>
        </chakra.div>

        {/* Navigation */}
        <chakra.div
          display="flex"
          flex="1"
          flexDirection="column"
          gap="1"
          p={sidebarCollapsed ? '2' : '4'}
        >
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link key={item.href} to={item.href}>
                <chakra.button
                  _dark={{ color: active ? 'white' : 'gray.200' }}
                  _hover={{
                    bg: active ? 'blue.600' : 'gray.100',
                    _dark: { bg: active ? 'blue.600' : 'gray.800' },
                  }}
                  alignItems="center"
                  bg={active ? 'blue.500' : 'transparent'}
                  borderRadius="md"
                  color={active ? 'white' : 'gray.700'}
                  display="flex"
                  fontWeight="medium"
                  gap="3"
                  h="10"
                  justifyContent={sidebarCollapsed ? 'center' : 'flex-start'}
                  px={sidebarCollapsed ? '0' : '4'}
                  width="100%"
                >
                  <Icon size={20} />
                  {!sidebarCollapsed && (
                    <>
                      <chakra.span flex="1" textAlign="left">
                        {item.label}
                      </chakra.span>
                      {item.badge && (
                        <chakra.span
                          bg="red.500"
                          borderRadius="full"
                          color="white"
                          fontSize="xs"
                          minW="5"
                          px="2"
                          py="1"
                          textAlign="center"
                        >
                          {item.badge}
                        </chakra.span>
                      )}
                    </>
                  )}
                </chakra.button>
              </Link>
            );
          })}
        </chakra.div>

        {/* Footer */}
        {!sidebarCollapsed && (
          <>
            <chakra.hr
              _dark={{ borderColor: 'gray.700' }}
              borderColor="gray.200"
            />
            <chakra.div p="4">
              <chakra.p color="gray.500" fontSize="xs" textAlign="center">
                Owleyes v1.0.0
              </chakra.p>
            </chakra.div>
          </>
        )}
      </chakra.div>
    </>
  );
};

export default Sidebar;
