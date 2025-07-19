/**
 * Notification toast component using Chakra UI's toast system
 */

import { useEffect } from 'react';
import { useUIStore } from '@/store';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();

  useEffect(() => {
    // Auto-remove notifications after delay
    notifications.forEach((notification) => {
      if (notification.autoClose) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);

  return null; // This component doesn't render anything directly for now
};

export default NotificationToast;
