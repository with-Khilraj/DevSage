---
inclusion: fileMatch
fileMatchPattern: "**/routes/**"
---

# API Design Guidelines

## RESTful API Standards

### HTTP Methods
- GET: Retrieve data (idempotent)
- POST: Create new resources
- PUT: Update entire resources (idempotent)
- PATCH: Partial updates
- DELETE: Remove resources (idempotent)

### URL Structure
- Use nouns, not verbs in URLs
- Use plural nouns for collections
- Use consistent naming conventions
- Implement proper nesting for relationships
- Keep URLs simple and intuitive

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Response Format

### Success Response
```javascript
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [/* error details */]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Pagination
```javascript
{
  "success": true,
  "data": [/* array of items */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Error Handling

### Validation Errors
- Provide specific field-level errors
- Include helpful error messages
- Use consistent error codes
- Implement proper input sanitization
- Log validation failures

### Rate Limiting
- Return 429 status code
- Include Retry-After header
- Provide clear error messages
- Implement progressive delays
- Log rate limit violations

## Documentation

### API Documentation
- Document all endpoints
- Include request/response examples
- Specify required parameters
- Document error responses
- Keep documentation up to date

### Versioning
- Use URL versioning (/api/v1/)
- Maintain backward compatibility
- Deprecate old versions gracefully
- Communicate changes clearly
- Provide migration guides