/**
 * Modern notification toast component with animations and modern design
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiX,
} from 'react-icons/fi';
import { useUIStore } from '@/store';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();
  const [visibleNotifications, setVisibleNotifications] =
    useState(notifications);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle size={20} />;
      case 'error':
        return <FiAlertCircle size={20} />;
      case 'warning':
        return <FiAlertTriangle size={20} />;
      case 'info':
      default:
        return <FiInfo size={20} />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'positive.subtle',
          border: 'positive.muted',
          icon: 'positive',
          text: 'positive.emphasis',
        };
      case 'error':
        return {
          bg: 'negative.subtle',
          border: 'negative.muted',
          icon: 'negative',
          text: 'negative.emphasis',
        };
      case 'warning':
        return {
          bg: 'warning.subtle',
          border: 'warning.muted',
          icon: 'warning',
          text: 'warning.emphasis',
        };
      case 'info':
      default:
        return {
          bg: 'accent.subtle',
          border: 'accent.muted',
          icon: 'accent',
          text: 'accent.emphasis',
        };
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <chakra.div
      display="flex"
      flexDirection="column"
      gap="3"
      maxW="md"
      pointerEvents="none"
      position="fixed"
      right="4"
      top="4"
      w="full"
      zIndex="9999"
    >
      {visibleNotifications.map((notification) => {
        const colors = getNotificationColors(notification.type);
        const icon = getNotificationIcon(notification.type);

        return (
          <chakra.div
            animation="fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            backdropFilter="blur(8px)"
            bg={colors.bg}
            border="1px solid"
            borderColor={colors.border}
            borderRadius="lg"
            boxShadow="lg"
            key={notification.id}
            maxW="full"
            p="4"
            pointerEvents="auto"
            position="relative"
          >
            <chakra.div alignItems="flex-start" display="flex" gap="3">
              <chakra.div color={colors.icon} flexShrink="0" mt="1">
                {icon}
              </chakra.div>

              <chakra.div flex="1" minW="0">
                <chakra.p
                  color={colors.text}
                  fontSize="sm"
                  fontWeight="medium"
                  lineHeight="1.5"
                  wordBreak="break-word"
                >
                  {notification.message}
                </chakra.p>

                <chakra.p color="text.muted" fontSize="xs" mt="1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </chakra.p>
              </chakra.div>

              <chakra.button
                _hover={{ bg: 'blackAlpha.100' }}
                aria-label="Close notification"
                borderRadius="md"
                color="text.subtle"
                flexShrink="0"
                h="6"
                onClick={() => removeNotification(notification.id)}
                p="1"
                transition="all 0.2s"
                w="6"
              >
                <FiX size={14} />
              </chakra.button>
            </chakra.div>

            {/* Progress bar for auto-close */}
            {notification.autoClose && (
              <chakra.div
                animation="progressBar 5s linear"
                bg={colors.icon}
                borderRadius="0 0 lg lg"
                bottom="0"
                h="1"
                left="0"
                opacity="0.3"
                position="absolute"
                right="0"
              />
            )}
          </chakra.div>
        );
      })}

      <style>
        {`
          @keyframes progressBar {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </chakra.div>
  );
};

export default NotificationToast;
