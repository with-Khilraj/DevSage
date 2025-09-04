---
inclusion: fileMatch
fileMatchPattern: "**/*auth*"
---

# Security Best Practices

## Authentication & Authorization

### JWT Implementation
- Use secure JWT tokens with proper expiration
- Implement refresh token rotation
- Store tokens securely (httpOnly cookies)
- Validate tokens on every request
- Implement proper logout functionality

### Password Security
- Hash passwords with bcrypt (min 12 rounds)
- Implement password strength requirements
- Add rate limiting for login attempts
- Implement account lockout mechanisms
- Use secure password reset flows

### OAuth Integration
- Validate OAuth state parameters
- Use PKCE for public clients
- Store OAuth tokens securely
- Implement proper token refresh
- Handle OAuth errors gracefully

## Data Protection

### Input Validation
- Validate all user inputs server-side
- Sanitize data before database operations
- Use parameterized queries to prevent SQL injection
- Implement proper file upload validation
- Validate file types and sizes

### Data Encryption
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper key management
- Encrypt database connections
- Use secure random number generation

## API Security

### Rate Limiting
- Implement rate limiting on all endpoints
- Use different limits for different endpoint types
- Implement progressive delays for repeated failures
- Monitor and alert on suspicious activity
- Implement IP-based blocking when necessary

### CORS Configuration
- Configure CORS properly for production
- Whitelist only necessary origins
- Implement proper preflight handling
- Validate Origin headers
- Use credentials carefully

## Kiro AI Security

### Data Handling
- Never send sensitive data to AI services
- Sanitize code before AI analysis
- Validate AI-generated content
- Log AI interactions for audit
- Implement data retention policies

### Privacy Protection
- Anonymize user data in AI requests
- Implement proper consent mechanisms
- Respect user privacy preferences
- Comply with data protection regulations
- Provide data deletion capabilities