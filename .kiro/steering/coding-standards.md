---
inclusion: always
---

# DevSage Coding Standards

## React/JavaScript Best Practices

### Component Structure
- Use functional components with hooks
- Implement proper error boundaries
- Use JSDoc comments for documentation
- Follow consistent naming conventions
- Implement proper prop validation

### Code Organization
- Feature-based folder structure
- Separate concerns (components, hooks, services)
- Use custom hooks for reusable logic
- Implement proper state management
- Keep components focused and small

### Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Lazy load components when appropriate
- Optimize re-renders with useCallback/useMemo
- Monitor bundle size and performance

### Testing
- Write unit tests for all components
- Test user interactions and edge cases
- Mock external dependencies
- Maintain 80%+ test coverage
- Use React Testing Library best practices

## Node.js Backend Standards

### API Design
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement consistent error handling
- Add comprehensive input validation
- Document all endpoints

### Security
- Validate all user inputs
- Use JWT with proper expiration
- Implement rate limiting
- Encrypt sensitive data
- Follow OWASP guidelines

### Database
- Use proper indexing strategies
- Implement data validation
- Handle connection errors gracefully
- Use transactions for complex operations
- Monitor query performance

## AI Integration Guidelines

### Kiro AI Best Practices
- Always validate Kiro AI suggestions before applying
- Provide context when calling Kiro AI services
- Handle AI service failures gracefully
- Cache AI analysis results for performance
- Log AI interactions for debugging

### Error Handling
- Implement fallback mechanisms for AI failures
- Provide meaningful error messages
- Log errors with proper context
- Implement retry logic with exponential backoff
- Monitor AI service performance