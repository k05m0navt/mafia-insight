# API Documentation

This directory contains comprehensive API documentation for the Mafia Insight application.

## API Overview

The Mafia Insight API provides endpoints for authentication, navigation, theme management, and permission control. All APIs follow RESTful conventions and return JSON responses.

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://mafiainsight.com/api`

### Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## API Categories

### Authentication API

- [Authentication Endpoints](./auth.md) - Login, signup, logout, and user management
- [User Management](./users.md) - User CRUD operations and role management
- [Permission Management](./permissions.md) - Permission configuration and validation

### Navigation API

- [Navigation Endpoints](./navigation.md) - Navigation state and page management
- [Theme Management](./theme.md) - Theme preferences and switching

### Data API

- [Players API](./players.md) - Player data management
- [Games API](./games.md) - Game data and statistics
- [Analytics API](./analytics.md) - Analytics and reporting

## API Standards

### Request Format

All requests should include:

- `Content-Type: application/json` header
- Proper authentication headers
- Valid request body (for POST/PUT requests)

### Response Format

All responses follow this structure:

```json
{
  "success": boolean,
  "data": object | array | null,
  "error": string | null,
  "message": string | null,
  "timestamp": string
}
```

### Error Handling

Errors are returned with appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Data endpoints**: 100 requests per minute
- **Admin endpoints**: 20 requests per minute

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null,
  "message": "Login successful"
}
```

### Signup

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## Navigation API

### Get Navigation State

```http
GET /api/navigation/state
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "activePage": "players",
    "visiblePages": ["home", "players", "analytics"],
    "lastUpdated": "2025-01-26T10:30:00Z"
  }
}
```

### Update Navigation State

```http
PUT /api/navigation/state
Authorization: Bearer <token>
Content-Type: application/json

{
  "activePage": "analytics"
}
```

## Theme API

### Get Theme Preference

```http
GET /api/navigation/theme
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "theme": "dark",
    "updatedAt": "2025-01-26T10:30:00Z"
  }
}
```

### Update Theme Preference

```http
PUT /api/navigation/theme
Authorization: Bearer <token>
Content-Type: application/json

{
  "theme": "light"
}
```

## Permission API

### Get User Permissions

```http
GET /api/auth/permissions
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "perm_1",
        "resource": "players",
        "action": "read",
        "roles": ["user", "admin"]
      }
    ]
  }
}
```

### Update Permissions (Admin Only)

```http
PUT /api/auth/admin/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": [
    {
      "id": "perm_1",
      "roles": ["user", "admin"]
    }
  ]
}
```

## SDK Usage

### JavaScript/TypeScript

```typescript
import { MafiaInsightAPI } from '@mafia-insight/api-client';

const api = new MafiaInsightAPI({
  baseURL: 'https://mafiainsight.com/api',
  token: 'your-jwt-token',
});

// Login
const user = await api.auth.login('user@example.com', 'password123');

// Get navigation state
const navState = await api.navigation.getState();

// Update theme
await api.theme.update('dark');
```

### cURL Examples

```bash
# Login
curl -X POST https://mafiainsight.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get user info
curl -X GET https://mafiainsight.com/api/auth/me \
  -H "Authorization: Bearer <token>"

# Update theme
curl -X PUT https://mafiainsight.com/api/navigation/theme \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark"}'
```

## Testing

### Test Environment

- **Base URL**: `http://localhost:3000/api`
- **Test Database**: Separate test database
- **Test Users**: Pre-configured test accounts

### Running API Tests

```bash
# Run all API tests
yarn test api/

# Run specific test suite
yarn test api/auth.test.ts

# Run with coverage
yarn test:coverage api/
```

### Test Data

Test data is automatically seeded when running tests. Use the following test accounts:

- **Admin**: `admin@test.com` / `password123`
- **User**: `user@test.com` / `password123`
- **Guest**: No authentication required

## Error Codes

| Code                       | Description                     | Solution                          |
| -------------------------- | ------------------------------- | --------------------------------- |
| `INVALID_CREDENTIALS`      | Email or password incorrect     | Check credentials                 |
| `EMAIL_NOT_CONFIRMED`      | Email not verified              | Check email for confirmation link |
| `TOO_MANY_REQUESTS`        | Rate limit exceeded             | Wait before retrying              |
| `INVALID_TOKEN`            | JWT token invalid               | Re-authenticate                   |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | Contact admin                     |
| `VALIDATION_ERROR`         | Request data invalid            | Check request format              |

## Changelog

### v1.0.0 (2025-01-26)

- Initial API release
- Authentication endpoints
- Navigation management
- Theme preferences
- Permission system
- Performance monitoring

## Support

For API support:

- **Documentation**: [docs.mafiainsight.com](https://docs.mafiainsight.com)
- **Issues**: [GitHub Issues](https://github.com/mafia-insight/api/issues)
- **Email**: api-support@mafiainsight.com
