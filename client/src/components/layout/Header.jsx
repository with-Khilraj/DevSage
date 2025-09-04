/**
 * Header Component
 * Main navigation header with glassmorphism design
 */

import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import Button, { IconButton } from '../ui/Button';
import Badge, { NotificationBadge } from '../ui/Badge';
import MultimodalInput from '../MultimodalInput';

const Header = ({
  onMenuToggle,
  className = '',
  ...props
}) => {
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications count
  const notificationCount = 3;

  const handleMultimodalResult = (result) => {
    console.log('Multimodal result:', result);
    // Handle the AI result here
    setShowSearch(false);
  };

  return (
    <header 
      className={twMerge(
        'sticky top-0 z-40 w-full backdrop-blur-md bg-white/5 border-b border-white/10',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
          />

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DS</span>
            </div>
            <h1 className="text-xl font-bold text-white hidden sm:block">
              DevSage
            </h1>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          {showSearch ? (
            <div className="relative">
              <MultimodalInput
                onResult={handleMultimodalResult}
                placeholder="Ask Kiro AI anything..."
                className="w-full"
                context={{
                  page: 'header',
                  user: user?.id
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(false)}
                className="absolute right-2 top-2"
                icon="✕"
              />
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowSearch(true)}
              className="w-full justify-start"
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            >
              <span className="text-gray-400">Ask Kiro AI anything...</span>
            </Button>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Mobile search button */}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          {/* Notifications */}
          <div className="relative">
            <NotificationBadge count={notificationCount}>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                }
              />
            </NotificationBadge>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* Mock notifications */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Code analysis completed for main.js</p>
                        <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">PR #123 was merged successfully</p>
                        <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Team insights report is ready</p>
                        <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10">
                  <Button variant="ghost" size="sm" fullWidth>
                    View All Notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.profile?.firstName?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white">
                  {user?.profile?.displayName || user?.username}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.email}
                </p>
              </div>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.profile?.firstName?.[0] || user?.username?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {user?.profile?.displayName || user?.username}
                      </p>
                      <p className="text-sm text-gray-400">
                        {user?.email}
                      </p>
                      {!user?.emailVerified && (
                        <Badge variant="warning" size="xs" className="mt-1">
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="justify-start"
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  >
                    Profile Settings
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="justify-start"
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  >
                    Preferences
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="justify-start"
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    }
                    onClick={logout}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="md:hidden border-t border-white/10 p-4">
          <MultimodalInput
            onResult={handleMultimodalResult}
            placeholder="Ask Kiro AI anything..."
            context={{
              page: 'header-mobile',
              user: user?.id
            }}
          />
        </div>
      )}

      {/* Click outside handlers */}
      {(showProfile || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowProfile(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;