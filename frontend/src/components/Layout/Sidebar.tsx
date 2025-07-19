/**
 * Modern sidebar navigation component with improved accessibility and design
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
        bg="bg.surface"
        borderColor="border"
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
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        w={sidebarCollapsed ? '16' : '70'}
        zIndex="20"
        boxShadow={{ base: isOpen ? 'lg' : 'none', lg: 'sm' }}
      >
        {/* Header */}
        <chakra.div
          alignItems="center"
          borderBottomWidth="1px"
          borderColor="border"
          display="flex"
          h="16"
          justifyContent="space-between"
          px={sidebarCollapsed ? '4' : '6'}
        >
          {!sidebarCollapsed && (
            <chakra.div alignItems="center" display="flex" gap="3">
              <chakra.div
                alignItems="center"
                bg="accent"
                borderRadius="lg"
                display="flex"
                h="9"
                justifyContent="center"
                w="9"
                boxShadow="sm"
              >
                <chakra.span color="white" fontSize="xl" fontWeight="bold">
                  O
                </chakra.span>
              </chakra.div>
              <chakra.span
                color="text"
                fontSize="xl"
                fontWeight="bold"
                letterSpacing="tight"
              >
                Owleyes
              </chakra.span>
            </chakra.div>
          )}

          <chakra.div display="flex" gap="1">
            {/* Collapse button (desktop) */}
            <chakra.button
              _hover={{ bg: 'bg.subtle' }}
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
              color="text.subtle"
              transition="all 0.2s"
            >
              {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </chakra.button>

            {/* Close button (mobile) */}
            <chakra.button
              _hover={{ bg: 'bg.subtle' }}
              alignItems="center"
              aria-label="Close sidebar"
              bg="transparent"
              borderRadius="md"
              display={{ base: 'flex', lg: 'none' }}
              justifyContent="center"
              onClick={onClose}
              p="2"
              color="text.subtle"
              transition="all 0.2s"
            >
              <FiX />
            </chakra.button>
          </chakra.div>
        </chakra.div>

        {/* Navigation */}
        <chakra.nav
          as="nav"
          display="flex"
          flex="1"
          flexDirection="column"
          gap="2"
          p={sidebarCollapsed ? '3' : '4'}
          pt="6"
        >
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link key={item.href} to={item.href}>
                <chakra.button
                  _hover={{
                    bg: active ? 'accent.emphasis' : 'bg.subtle',
                    transform: 'translateY(-1px)',
                  }}
                  alignItems="center"
                  bg={active ? 'accent' : 'transparent'}
                  borderRadius="lg"
                  color={active ? 'white' : 'text.subtle'}
                  display="flex"
                  fontWeight={active ? 'semibold' : 'medium'}
                  fontSize="sm"
                  gap="3"
                  h="11"
                  justifyContent={sidebarCollapsed ? 'center' : 'flex-start'}
                  px={sidebarCollapsed ? '0' : '4'}
                  width="100%"
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  position="relative"
                  overflow="hidden"
                >
                  {active && (
                    <chakra.div
                      position="absolute"
                      left="0"
                      top="0"
                      bottom="0"
                      width="3px"
                      bg="white"
                      borderRadius="0 2px 2px 0"
                    />
                  )}
                  <Icon size={18} />
                  {!sidebarCollapsed && (
                    <>
                      <chakra.span flex="1" textAlign="left">
                        {item.label}
                      </chakra.span>
                      {item.badge && (
                        <chakra.span
                          bg="negative"
                          borderRadius="full"
                          color="white"
                          fontSize="xs"
                          minW="5"
                          px="2"
                          py="1"
                          textAlign="center"
                          fontWeight="semibold"
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
        </chakra.nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <>
            <chakra.hr borderColor="border.subtle" />
            <chakra.div p="4">
              <chakra.p 
                color="text.muted" 
                fontSize="xs" 
                textAlign="center"
                fontWeight="medium"
              >
                Owleyes v1.0.0
              </chakra.p>
              <chakra.p 
                color="text.muted" 
                fontSize="xs" 
                textAlign="center"
                mt="1"
              >
                Server Management
              </chakra.p>
            </chakra.div>
          </>
        )}
      </chakra.div>
    </>
  );
};

export default Sidebar;
