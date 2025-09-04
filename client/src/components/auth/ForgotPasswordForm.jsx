/**
 * Forgot Password Form Component
 * Password reset request form with validation
 */

import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, Badge } from '../ui';

const ForgotPasswordForm = ({
  onSwitchToLogin,
  className = '',
  ...props
}) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Handle email change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  // Start countdown timer
  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setIsSubmitted(true);
        startCountdown();
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend
  const handleResend = async () => {
    if (!canResend) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        startCountdown();
      } else {
        setError(result.error || 'Failed to resend reset email');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setIsSubmitted(false);
    setEmail('');
    setError('');
    setCanResend(true);
    setCountdown(0);
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
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
        </h1>
        <p className="text-gray-400">
          {isSubmitted 
            ? 'We\'ve sent a password reset link to your email'
            : 'Enter your email address and we\'ll send you a link to reset your password'
          }
        </p>
      </div>

      {!isSubmitted ? (
        /* Reset Request Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Email Input */}
          <Input
            type="email"
            label="Email Address"
            placeholder="Enter your email address"
            value={email}
            onChange={handleEmailChange}
            disabled={isSubmitting}
            required
            leftIcon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
          </Button>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center justify-center space-x-2 mx-auto"
              disabled={isSubmitting}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Sign In</span>
            </button>
          </div>
        </form>
      ) : (
        /* Success State */
        <div className="space-y-6">
          {/* Success Message */}
          <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-xl">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-green-200 text-sm font-medium">Reset link sent!</p>
                <p className="text-green-300 text-xs mt-1">
                  Check your email at <strong>{email}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-sm text-gray-300">
            <p>📧 Check your email for a password reset link</p>
            <p>🔗 Click the link in the email to reset your password</p>
            <p>⏰ The link will expire in 10 minutes for security</p>
            <p>📁 Don't see it? Check your spam folder</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Resend Button */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleResend}
            disabled={!canResend || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Resending...' : 
             !canResend ? `Resend in ${countdown}s` : 
             'Resend Reset Link'}
          </Button>

          {/* Actions */}
          <div className="flex flex-col space-y-3 text-center">
            <button
              onClick={handleReset}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              disabled={isSubmitting}
            >
              Try Different Email
            </button>
            
            <button
              onClick={onSwitchToLogin}
              className="text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-2 mx-auto"
              disabled={isSubmitting}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      )}

      {/* Demo Badge */}
      <div className="mt-6 text-center">
        <Badge variant="warning" size="sm">
          🚀 Hackathon Demo
        </Badge>
      </div>
    </Card>
  );
};

export default ForgotPasswordForm;