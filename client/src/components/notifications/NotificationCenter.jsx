/**
 * Notification Center Component
 * Real-time notification display with glassmorphism design
 */

import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { useSocket } from '../../context/SocketContext';
import { Button, Badge, Card } from '../ui';

const NotificationCenter = ({
  className = '',
  maxVisible = 5,
  autoHide = true,
  autoHideDelay = 5000,
  ...props
}) => {
  const { 
    notifications, 
    unreadCount, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useSocket();
  
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update visible notifications
  useEffect(() => {
    const unreadNotifications = notifications
      .filter(notif => !notif.read)
      .slice(0, maxVisible);
    
    setVisibleNotifications(unreadNotifications);
  }, [notifications, maxVisible]);

  // Auto-hide notifications
  useEffect(() => {
    if (!autoHide) return;

    const timers = visibleNotifications.map(notification => {
      if (notification.type !== 'error' && notification.type !== 'warning') {
        return setTimeout(() => {
          markNotificationRead(notification.id);
        }, autoHideDelay);
      }
      return null;
    }).filter(Boolean);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications, autoHide, autoHideDelay, markNotificationRead]);

  // Get notification icon
  const getNotificationIcon = (type, category) => {
    if (category === 'code_analysis') {
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }

    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Get notification colors
  const getNotificationColors = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'info':
      default:
        return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
    
    // Handle notification action if provided
    if (notification.action) {
      notification.action();
    }
  };

  // Render notification item
  const renderNotification = (notification, index) => {
    const colors = getNotificationColors(notification.type);
    const icon = getNotificationIcon(notification.type, notification.category);

    return (
      <div
        key={notification.id}
        className={twMerge(
          'relative overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300 ease-in-out',
          'transform hover:scale-[1.02] cursor-pointer',
          'animate-in slide-in-from-right duration-300',
          colors
        )}
        style={{ animationDelay: `${index * 100}ms` }}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {icon}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {notification.title && (
                    <p className="text-sm font-medium text-white mb-1">
                      {notification.title}
                    </p>
                  )}
                  <p className="text-sm text-gray-300">
                    {notification.message}
                  </p>
                  {notification.details && (
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.details}
                    </p>
                  )}
                </div>
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationRead(notification.id);
                  }}
                  className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Metadata */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(notification.timestamp || notification.receivedAt)}
                </span>
                
                {notification.category && (
                  <Badge variant="outline-primary" size="xs">
                    {notification.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar for auto-hide */}
        {autoHide && notification.type !== 'error' && notification.type !== 'warning' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div 
              className="h-full bg-current opacity-50 animate-pulse"
              style={{
                animation: `shrink ${autoHideDelay}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    );
  };

  if (visibleNotifications.length === 0 && !isExpanded) {
    return null;
  }

  return (
    <div 
      className={twMerge(
        'fixed top-20 right-4 z-50 w-80 max-w-sm space-y-3',
        className
      )}
      {...props}
    >
      {/* Notification count badge */}
      {unreadCount > maxVisible && !isExpanded && (
        <div className="text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="mb-3"
          >
            +{unreadCount - maxVisible} more notifications
          </Button>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-3">
        {(isExpanded ? notifications.filter(n => !n.read) : visibleNotifications)
          .map((notification, index) => renderNotification(notification, index))
        }
      </div>

      {/* Actions */}
      {(visibleNotifications.length > 0 || isExpanded) && (
        <div className="flex justify-center space-x-2 pt-2">
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </Button>
          )}
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllNotificationsRead}
            >
              Mark All Read
            </Button>
          )}
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slide-in-from-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Connection Status Indicator Component
export const ConnectionStatus = ({ className = '' }) => {
  const { isConnected, connectionStatus, error } = useSocket();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return error || 'Connection Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={twMerge('flex items-center space-x-2', className)}>
      <div className={twMerge('w-2 h-2 rounded-full', getStatusColor())} />
      <span className="text-xs text-gray-400">
        {getStatusText()}
      </span>
    </div>
  );
};

// Real-time Activity Feed Component
export const ActivityFeed = ({ className = '', maxItems = 10 }) => {
  const { notifications } = useSocket();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Filter and format notifications as activities
    const recentActivities = notifications
      .filter(notif => notif.category === 'code_analysis' || notif.category === 'team')
      .slice(0, maxItems)
      .map(notif => ({
        id: notif.id,
        type: notif.category,
        message: notif.message,
        timestamp: notif.timestamp || notif.receivedAt,
        user: notif.user || 'System'
      }));
    
    setActivities(recentActivities);
  }, [notifications, maxItems]);

  if (activities.length === 0) {
    return (
      <Card variant="glass" className={className}>
        <div className="text-center py-8">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-gray-400">No recent activity</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={className}>
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
      </div>
      
      <div className="divide-y divide-white/5">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{activity.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{activity.user}</span>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NotificationCenter;