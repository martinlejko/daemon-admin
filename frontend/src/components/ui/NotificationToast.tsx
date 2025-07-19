/**
 * Modern notification toast component with animations and modern design
 */

import { chakra } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';
import { useUIStore } from '@/store';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();
  const [visibleNotifications, setVisibleNotifications] = useState(notifications);

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
      position="fixed"
      top="4"
      right="4"
      zIndex="100"
      display="flex"
      flexDirection="column"
      gap="3"
      maxW="md"
      w="full"
      pointerEvents="none"
    >
      {visibleNotifications.map((notification) => {
        const colors = getNotificationColors(notification.type);
        const icon = getNotificationIcon(notification.type);

        return (
          <chakra.div
            key={notification.id}
            bg={colors.bg}
            border="1px solid"
            borderColor={colors.border}
            borderRadius="lg"
            boxShadow="lg"
            p="4"
            position="relative"
            animation="fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            backdropFilter="blur(8px)"
            pointerEvents="auto"
            maxW="full"
          >
            <chakra.div display="flex" alignItems="flex-start" gap="3">
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
                
                <chakra.p
                  color="text.muted"
                  fontSize="xs"
                  mt="1"
                >
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
                position="absolute"
                bottom="0"
                left="0"
                right="0"
                h="1"
                bg={colors.icon}
                borderRadius="0 0 lg lg"
                animation="progressBar 5s linear"
                opacity="0.3"
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
