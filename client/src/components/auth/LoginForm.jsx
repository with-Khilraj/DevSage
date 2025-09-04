/**
 * Login Form Component
 * Beautiful glassmorphism login form with OAuth integration
 */

import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, Badge } from '../ui';

const LoginForm = ({
  onSwitchToRegister,
  onSwitchToForgotPassword,
  className = '',
  ...props
}) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.identifier.trim()) {
      errors.identifier = 'Email or username is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await login(
        formData.identifier,
        formData.password,
        formData.rememberMe
      );

      if (!result.success) {
        // Handle specific error codes
        if (result.code === 'ACCOUNT_LOCKED') {
          setFormErrors({
            general: 'Account is temporarily locked due to too many failed attempts'
          });
        } else if (result.code === 'ACCOUNT_INACTIVE') {
          setFormErrors({
            general: 'Account is not active. Please contact support.'
          });
        } else {
          setFormErrors({
            general: result.error || 'Login failed'
          });
        }
      }
    } catch (error) {
      setFormErrors({
        general: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OAuth login
  const handleOAuthLogin = (provider) => {
    // TODO: Implement OAuth login
    console.log(`OAuth login with ${provider}`);
    // This would typically redirect to the OAuth provider
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  return (
    <Card
      variant="glass"
      size="lg"
      className={twMerge('w-full max-w-md mx-auto', className)}
      {...props}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">DS</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400">Sign in to your DevSage account</p>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3 mb-6">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => handleOAuthLogin('github')}
          leftIcon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          }
        >
          Continue with GitHub
        </Button>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => handleOAuthLogin('gitlab')}
          leftIcon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.16l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.16l2.44 7.51L23 13.45a.84.84 0 01-.35.94z" />
            </svg>
          }
        >
          Continue with GitLab
        </Button>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => handleOAuthLogin('bitbucket')}
          leftIcon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.499.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
            </svg>
          }
        >
          Continue with Bitbucket
        </Button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-900/50 text-gray-400">Or continue with email</span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global Error */}
        {(error || formErrors.general) && (
          <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-200 text-sm">
                {error || formErrors.general}
              </p>
            </div>
          </div>
        )}

        {/* Email/Username Input */}
        <Input
          name="identifier"
          type="text"
          label="Email or Username"
          placeholder="Enter your email or username"
          value={formData.identifier}
          onChange={handleChange}
          error={formErrors.identifier}
          disabled={isSubmitting}
          required
          leftIcon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        {/* Password Input */}
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          disabled={isSubmitting}
          required
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-300">Remember me</span>
          </label>

          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            disabled={isSubmitting}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            disabled={isSubmitting}
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Demo Badge */}
      <div className="mt-4 text-center">
        <Badge variant="primary" size="sm">
          🚀 Hackathon Demo
        </Badge>
      </div>
    </Card>
  );
};

export default LoginForm;