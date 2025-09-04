/**
 * Signup Form Component
 * Multi-step registration form with progress indicator
 */

import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, Badge, ProgressBar } from '../ui';

const SignupForm = ({
  onSwitchToLogin,
  invitationToken = null,
  className = '',
  ...props
}) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Profile Info
    firstName: '',
    lastName: '',
    jobTitle: '',
    company: '',
    technologies: [],
    
    // Step 3: Terms & Verification
    agreeToTerms: false,
    agreeToPrivacy: false,
    subscribeToUpdates: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

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

    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Handle technologies input
  const handleTechnologiesChange = (e) => {
    const value = e.target.value;
    const technologies = value.split(',').map(tech => tech.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      technologies
    }));
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[^a-zA-Z\d]/.test(password)) strength += 25;
    return Math.min(100, strength);
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'red';
    if (passwordStrength < 50) return 'yellow';
    if (passwordStrength < 75) return 'blue';
    return 'green';
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  // Validate current step
  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (!/^[a-zA-Z0-9_-]{3,30}$/.test(formData.username)) {
        errors.username = 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens';
      }
      
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (passwordStrength < 50) {
        errors.password = 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (step === 2) {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
    }
    
    if (step === 3) {
      if (!formData.agreeToTerms) {
        errors.agreeToTerms = 'You must agree to the Terms of Service';
      }
      if (!formData.agreeToPrivacy) {
        errors.agreeToPrivacy = 'You must agree to the Privacy Policy';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(totalSteps, prev + 1));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      const userData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.jobTitle,
        company: formData.company,
        technologies: formData.technologies,
        subscribeToUpdates: formData.subscribeToUpdates,
        invitationToken
      };

      const result = await register(userData);
      
      if (!result.success) {
        // Handle specific error codes
        if (result.code === 'USER_EXISTS') {
          if (result.field === 'email') {
            setFormErrors({ email: 'An account with this email already exists' });
            setCurrentStep(1);
          } else if (result.field === 'username') {
            setFormErrors({ username: 'This username is already taken' });
            setCurrentStep(1);
          }
        } else {
          setFormErrors({
            general: result.error || 'Registration failed'
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              name="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              disabled={isSubmitting}
              required
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <Input
              name="username"
              type="text"
              label="Username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              error={formErrors.username}
              disabled={isSubmitting}
              required
              helperText="3-30 characters, letters, numbers, underscores, and hyphens only"
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <div className="space-y-2">
              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                disabled={isSubmitting}
                required
              />
              
              {formData.password && (
                <div className="space-y-2">
                  <ProgressBar
                    progress={passwordStrength}
                    color={getPasswordStrengthColor()}
                    size="sm"
                  />
                  <p className={twMerge(
                    'text-xs',
                    passwordStrength < 25 ? 'text-red-400' :
                    passwordStrength < 50 ? 'text-yellow-400' :
                    passwordStrength < 75 ? 'text-blue-400' : 'text-green-400'
                  )}>
                    Password strength: {getPasswordStrengthText()}
                  </p>
                </div>
              )}
            </div>

            <Input
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              disabled={isSubmitting}
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="firstName"
                type="text"
                label="First Name"
                placeholder="Your first name"
                value={formData.firstName}
                onChange={handleChange}
                error={formErrors.firstName}
                disabled={isSubmitting}
                required
              />

              <Input
                name="lastName"
                type="text"
                label="Last Name"
                placeholder="Your last name"
                value={formData.lastName}
                onChange={handleChange}
                error={formErrors.lastName}
                disabled={isSubmitting}
                required
              />
            </div>

            <Input
              name="jobTitle"
              type="text"
              label="Job Title"
              placeholder="e.g. Software Engineer, Product Manager"
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={isSubmitting}
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              }
            />

            <Input
              name="company"
              type="text"
              label="Company"
              placeholder="Your company or organization"
              value={formData.company}
              onChange={handleChange}
              disabled={isSubmitting}
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />

            <Input
              name="technologies"
              type="text"
              label="Technologies"
              placeholder="React, Node.js, Python, etc. (comma-separated)"
              value={formData.technologies.join(', ')}
              onChange={handleTechnologiesChange}
              disabled={isSubmitting}
              helperText="List the technologies you work with"
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              }
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Terms and Privacy */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex-1">
                  <label className="text-sm text-gray-300">
                    I agree to the{' '}
                    <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                      Terms of Service
                    </a>
                  </label>
                  {formErrors.agreeToTerms && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.agreeToTerms}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeToPrivacy"
                  checked={formData.agreeToPrivacy}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex-1">
                  <label className="text-sm text-gray-300">
                    I agree to the{' '}
                    <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                      Privacy Policy
                    </a>
                  </label>
                  {formErrors.agreeToPrivacy && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.agreeToPrivacy}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="subscribeToUpdates"
                  checked={formData.subscribeToUpdates}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label className="text-sm text-gray-300">
                  Send me product updates and announcements (optional)
                </label>
              </div>
            </div>

            {/* Team Invitation Info */}
            {invitationToken && (
              <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-blue-200 text-sm">
                    You're joining a team! Your account will be automatically added to the team after registration.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
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
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">DS</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">Join DevSage and supercharge your development workflow</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        </div>
        <ProgressBar progress={progress} color="blue" size="sm" />
        
        {/* Step Labels */}
        <div className="flex justify-between mt-3 text-xs">
          <span className={currentStep >= 1 ? 'text-blue-400' : 'text-gray-500'}>Account</span>
          <span className={currentStep >= 2 ? 'text-blue-400' : 'text-gray-500'}>Profile</span>
          <span className={currentStep >= 3 ? 'text-blue-400' : 'text-gray-500'}>Verify</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Global Error */}
        {(error || formErrors.general) && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
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

        {/* Step Content */}
        <div className="mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between space-x-4">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="flex-1"
            >
              Previous
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              disabled={isSubmitting}
              className={currentStep === 1 ? 'w-full' : 'flex-1'}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              className={currentStep === 1 ? 'w-full' : 'flex-1'}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          )}
        </div>
      </form>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            disabled={isSubmitting}
          >
            Sign in
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

export default SignupForm;