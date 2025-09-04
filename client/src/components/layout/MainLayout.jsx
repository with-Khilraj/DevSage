/**
 * Main Layout Component
 * Responsive layout with Header, Sidebar, and MainContent
 */

import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = ({
  children,
  className = '',
  ...props
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when screen size changes
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
      </div>

      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuToggle={toggleSidebar} />

          {/* Main content */}
          <main 
            className={twMerge(
              'flex-1 overflow-auto p-4 lg:p-6',
              className
            )}
            {...props}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

// Content wrapper for consistent spacing and styling
export const MainContent = ({
  children,
  title,
  subtitle,
  action,
  breadcrumbs,
  className = '',
  ...props
}) => {
  return (
    <div className={twMerge('space-y-6', className)} {...props}>
      {/* Page header */}
      {(title || subtitle || action || breadcrumbs) && (
        <div className="space-y-4">
          {/* Breadcrumbs */}
          {breadcrumbs && (
            <nav className="flex items-center space-x-2 text-sm text-gray-400">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {crumb.href ? (
                    <a 
                      href={crumb.href}
                      className="hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={index === breadcrumbs.length - 1 ? 'text-white' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Title and action */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            
            {action && (
              <div className="flex-shrink-0 ml-4">
                {action}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
};

// Page container for consistent max-width and centering
export const PageContainer = ({
  children,
  maxWidth = '7xl',
  className = '',
  ...props
}) => {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  };

  return (
    <div 
      className={twMerge(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Section component for organizing content
export const Section = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  ...props
}) => {
  return (
    <section className={twMerge('space-y-4', className)} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {title && (
              <h2 className="text-xl font-semibold text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-400 text-sm">
                {subtitle}
              </p>
            )}
          </div>
          
          {action && (
            <div className="flex-shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>
      )}
      
      <div>
        {children}
      </div>
    </section>
  );
};

// Loading state component
export const LoadingLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
          <span className="text-white font-bold text-xl">DS</span>
        </div>
        <div className="space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-white font-medium">Loading DevSage...</p>
          <p className="text-gray-400 text-sm">Initializing Kiro AI services</p>
        </div>
      </div>
    </div>
  );
};

// Error state component
export const ErrorLayout = ({ 
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  showRetry = true
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 bg-red-500/20 border border-red-400/30 rounded-2xl flex items-center justify-center mx-auto">
          <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="text-gray-400">{message}</p>
        </div>
        
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default MainLayout;