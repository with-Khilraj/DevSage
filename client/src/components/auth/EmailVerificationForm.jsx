/**
 * Email Verification Form Component
 * Email verification with resend functionality
 */

import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Badge } from '../ui';

const EmailVerificationForm = ({
  email,
  onVerificationComplete,
  onSwitchToLogin,
  className = '',
  ...props
}) => {
  const { verifyEmail, resendVerification } = useAuth();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Start countdown timer
  useEffect(() => {
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

    return () => clearInterval(timer);
  }, []);

  // Handle verification code input
  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
    
    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerification(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newCode = [...verificationCode];
        newCode[index - 1] = '';
        setVerificationCode(newCode);
      }
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setVerificationCode(newCode);
      handleVerification(pastedData);
    }
  };

  // Handle verification
  const handleVerification = async (code) => {
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await verifyEmail(code);
      
      if (result.success) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          onVerificationComplete?.();
        }, 1500);
      } else {
        if (result.code === 'INVALID_VERIFICATION_TOKEN') {
          setError('Invalid or expired verification code. Please request a new one.');
        } else {
          setError(result.error || 'Verification failed');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manual verification
  const handleSubmit = (e) => {
    e.preventDefault();
    const code = verificationCode.join('');
    handleVerification(code);
  };

  // Handle resend
  const handleResend = async () => {
    if (!canResend) return;
    
    setIsResending(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await resendVerification(email);
      
      if (result.success) {
        setSuccess('Verification code sent! Check your email.');
        setCanResend(false);
        setCountdown(60);
        
        // Restart countdown
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
      } else {
        setError(result.error || 'Failed to resend verification code');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
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
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
        <p className="text-gray-400">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-white font-medium mt-1">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-xl">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          </div>
        )}

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

        {/* Verification Code Input */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-white text-center">
            Enter Verification Code
          </label>
          
          <div className="flex justify-center space-x-3">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isSubmitting || success}
                className={twMerge(
                  'w-12 h-12 text-center text-xl font-bold rounded-xl',
                  'bg-white/10 backdrop-blur-md border text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  success ? 'border-green-400/50 bg-green-500/10' :
                  error ? 'border-red-400/50 bg-red-500/10' :
                  'border-white/20 hover:border-white/30'
                )}
              />
            ))}
          </div>
          
          <p className="text-xs text-gray-400 text-center">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting || success || verificationCode.some(digit => digit === '')}
        >
          {isSubmitting ? 'Verifying...' : 'Verify Email'}
        </Button>

        {/* Resend Section */}
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-400">
            Didn't receive the code?
          </p>
          
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleResend}
            disabled={!canResend || isResending || success}
            loading={isResending}
          >
            {isResending ? 'Resending...' : 
             !canResend ? `Resend in ${countdown}s` : 
             'Resend Code'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="space-y-2 text-xs text-gray-400 text-center">
          <p>📧 Check your email inbox and spam folder</p>
          <p>⏰ Code expires in 24 hours</p>
          <p>🔄 You can request a new code if needed</p>
        </div>

        {/* Back to Login */}
        <div className="text-center pt-4 border-t border-white/10">
          <button
            type="button"
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
      </form>

      {/* Demo Badge */}
      <div className="mt-6 text-center">
        <Badge variant="success" size="sm">
          🚀 Hackathon Demo
        </Badge>
      </div>
    </Card>
  );
};

export default EmailVerificationForm;