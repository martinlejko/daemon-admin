/**
 * Application sidebar navigation component
 */

import { chakra } from '@chakra-ui/react';
import { 
  FiHome, 
  FiServer, 
  FiSettings, 
  FiActivity, 
  FiX,
  FiChevronLeft,
  FiChevronRight,
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
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex="10"
          display={{ base: 'block', lg: 'none' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <chakra.div
        position="fixed"
        top="0"
        left="0"
        h="100vh"
        w={sidebarCollapsed ? '16' : '64'}
        bg="white"
        _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
        borderRightWidth="1px"
        borderColor="gray.200"
        transition="all 0.2s"
        transform={{
          base: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          lg: 'translateX(0)',
        }}
        zIndex="20"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <chakra.div
          h="16"
          px={sidebarCollapsed ? '4' : '6'}
          borderBottomWidth="1px"
          borderColor="gray.200"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          {!sidebarCollapsed && (
            <chakra.div display="flex" alignItems="center" gap="3">
              <chakra.div
                w="8"
                h="8"
                bg="blue.500"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <chakra.span color="white" fontWeight="bold" fontSize="lg">
                  O
                </chakra.span>
              </chakra.div>
              <chakra.span fontSize="lg" fontWeight="bold" color="gray.900" _dark={{ color: 'white' }}>
                Owleyes
              </chakra.span>
            </chakra.div>
          )}

          <chakra.div display="flex" gap="1">
            {/* Collapse button (desktop) */}
            <chakra.button
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={toggleSidebarCollapsed}
              display={{ base: 'none', lg: 'flex' }}
              p="2"
              bg="transparent"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderRadius="md"
              alignItems="center"
              justifyContent="center"
            >
              {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </chakra.button>

            {/* Close button (mobile) */}
            <chakra.button
              aria-label="Close sidebar"
              onClick={onClose}
              display={{ base: 'flex', lg: 'none' }}
              p="2"
              bg="transparent"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
              borderRadius="md"
              alignItems="center"
              justifyContent="center"
            >
              <FiX />
            </chakra.button>
          </chakra.div>
        </chakra.div>

        {/* Navigation */}
        <chakra.div
          gap="1"
          p={sidebarCollapsed ? '2' : '4'}
          flex="1"
          display="flex"
          flexDirection="column"
        >
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link key={item.href} to={item.href}>
                <chakra.button
                  bg={active ? 'blue.500' : 'transparent'}
                  color={active ? 'white' : 'gray.700'}
                  _dark={{ color: active ? 'white' : 'gray.200' }}
                  justifyContent={sidebarCollapsed ? 'center' : 'flex-start'}
                  h="10"
                  px={sidebarCollapsed ? '0' : '4'}
                  borderRadius="md"
                  fontWeight="medium"
                  width="100%"
                  _hover={{
                    bg: active ? 'blue.600' : 'gray.100',
                    _dark: { bg: active ? 'blue.600' : 'gray.800' },
                  }}
                  display="flex"
                  alignItems="center"
                  gap="3"
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
                          color="white"
                          fontSize="xs"
                          px="2"
                          py="1"
                          borderRadius="full"
                          minW="5"
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
            <chakra.hr borderColor="gray.200" _dark={{ borderColor: 'gray.700' }} />
            <chakra.div p="4">
              <chakra.p fontSize="xs" color="gray.500" textAlign="center">
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