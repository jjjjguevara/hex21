---
title: API Error Codes
author: Hex21 API Team
date: 2024-04-01
tags: [documentation, api, reference, errors, codes]
description: A list of common error codes returned by the Hex21 CMS API.
id: api-errors
---

# API Error Codes

This guide explains how to handle errors in the Hex21 CMS API.

## Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional error details
    }
  }
}
```

## HTTP Status Codes

| Status Code | Description                                                  |
|------------|--------------------------------------------------------------|
| 400        | Bad Request - Invalid parameters or request format            |
| 401        | Unauthorized - Missing or invalid authentication              |
| 403        | Forbidden - Valid auth but insufficient permissions           |
| 404        | Not Found - Resource doesn't exist                           |
| 422        | Unprocessable Entity - Request validation failed             |
| 429        | Too Many Requests - Rate limit exceeded                      |
| 500        | Internal Server Error - Something went wrong on our end      |
| 503        | Service Unavailable - API is temporarily unavailable         |

## Error Codes

### Authentication Errors

| Code                  | Description                                        |
|----------------------|----------------------------------------------------|
| `INVALID_AUTH`       | Invalid authentication credentials                  |
| `EXPIRED_TOKEN`      | Authentication token has expired                   |
| `MISSING_AUTH`       | Authentication credentials not provided             |
| `REVOKED_TOKEN`      | Authentication token has been revoked              |

### Request Errors

| Code                  | Description                                        |
|----------------------|----------------------------------------------------|
| `INVALID_PARAMETERS` | One or more request parameters are invalid         |
| `MISSING_REQUIRED`   | Required parameter is missing                      |
| `INVALID_FORMAT`     | Request format is invalid                          |
| `INVALID_JSON`       | JSON payload is malformed                          |

### Resource Errors

| Code                  | Description                                        |
|----------------------|----------------------------------------------------|
| `NOT_FOUND`          | Requested resource was not found                   |
| `ALREADY_EXISTS`     | Resource already exists                            |
| `CONFLICT`           | Request conflicts with existing resource           |
| `GONE`               | Resource no longer exists                          |

### Rate Limiting Errors

| Code                  | Description                                        |
|----------------------|----------------------------------------------------|
| `RATE_LIMIT`         | Rate limit exceeded                                |
| `QUOTA_EXCEEDED`     | API quota exceeded                                 |

### Server Errors

| Code                  | Description                                        |
|----------------------|----------------------------------------------------|
| `INTERNAL_ERROR`     | Internal server error                              |
| `SERVICE_UNAVAILABLE`| Service temporarily unavailable                    |
| `DATABASE_ERROR`     | Database operation failed                          |

## Error Handling Examples

### JavaScript/TypeScript

```typescript
import { Hex21Client, Hex21Error } from '@hex21/sdk';

const client = new Hex21Client('your-api-key');

try {
  const article = await client.articles.get('invalid-slug');
} catch (error) {
  if (error instanceof Hex21Error) {
    switch (error.code) {
      case 'NOT_FOUND':
        console.error('Article not found:', error.message);
        break;
      case 'INVALID_AUTH':
        console.error('Authentication failed:', error.message);
        break;
      case 'RATE_LIMIT':
        console.error('Rate limit exceeded:', error.message);
        // Retry after waiting
        const retryAfter = error.details.retryAfter;
        break;
      default:
        console.error('API error:', error.message);
    }
  }
}
```

### Python

```python
from hex21 import Hex21Client, Hex21Error

client = Hex21Client('your-api-key')

try:
    article = client.articles.get('invalid-slug')
except Hex21Error as error:
    if error.code == 'NOT_FOUND':
        print(f'Article not found: {error.message}')
    elif error.code == 'INVALID_AUTH':
        print(f'Authentication failed: {error.message}')
    elif error.code == 'RATE_LIMIT':
        print(f'Rate limit exceeded: {error.message}')
        # Retry after waiting
        retry_after = error.details.get('retryAfter')
    else:
        print(f'API error: {error.message}')
```

## Best Practices

1. **Always Check Error Types**
   - Use the error code to determine the type of error
   - Handle common errors explicitly
   - Have a fallback for unexpected errors

2. **Retry Strategy**
   - Implement exponential backoff for rate limiting
   - Don't retry on authentication or validation errors
   - Set maximum retry attempts

3. **Error Logging**
   - Log error details for debugging
   - Include request ID in logs
   - Don't log sensitive information

4. **User Communication**
   - Display user-friendly error messages
   - Provide clear next steps
   - Include support contact for unresolvable errors

## Rate Limit Headers

When rate limiting occurs, check these response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1616789000
Retry-After: 60
```

## Support

If you encounter persistent errors or need assistance:

1. Check our [status page](https://status.hex21.dev)
2. Contact support at api@hex21.dev
3. Join our [Discord community](https://discord.gg/hex21) 