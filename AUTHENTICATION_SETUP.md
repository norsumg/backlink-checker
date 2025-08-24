# Authentication System Setup Guide

This guide explains how to set up the authentication system for the Backlink Price Finder application, including Google OAuth integration.

## Features

- **Local Authentication**: Email/password registration and login
- **Google OAuth**: Sign in with Google accounts
- **JWT Tokens**: Secure token-based authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Management**: User profiles with avatar support

## Backend Setup

### 1. Install Dependencies

The following packages have been added to `backend/requirements.txt`:
- `google-auth==2.23.4` - Google OAuth verification
- `python-jose[cryptography]==3.3.0` - JWT token handling (already present)
- `passlib[bcrypt]==1.7.4` - Password hashing (already present)

### 2. Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backlink_checker

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin
ADMIN_PASSWORD=change-this-admin-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# App Settings
DEBUG=true
APP_NAME=Backlink Price Finder
VERSION=1.0.0
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
7. Copy the Client ID and Client Secret to your `.env` file

### 4. Database Migration

Run the database migration to create the users table:

```bash
cd backend
alembic upgrade head
```

This will create the `users` table with all necessary fields for authentication.

## Frontend Setup

### 1. Install Dependencies

The following packages have been added to `frontend/package.json`:
- `jwt-decode` - JWT token decoding

### 2. Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Google OAuth Script

The Google OAuth script is automatically loaded from `https://accounts.google.com/gsi/client` when the app initializes.

## API Endpoints

### Authentication Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/google` - Google OAuth authentication
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/refresh` - Refresh access token

### Protected Endpoints

All existing endpoints remain accessible, but you can now protect them using the `get_current_user` dependency:

```python
from app.api.v1.endpoints.auth import get_current_user

@router.get("/protected")
async def protected_endpoint(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.email}"}
```

## Usage

### User Registration

Users can register with:
- Email (required)
- Password (required, minimum 6 characters)
- Full name (optional)
- Username (optional)

### User Login

Users can login with:
- Email and password
- Google OAuth (one-click sign-in)

### Authentication Flow

1. User visits the app
2. If not authenticated, redirected to `/auth`
3. User can choose to login or register
4. After successful authentication, redirected to the main app
5. JWT token stored in localStorage
6. Token automatically included in API requests
7. Protected routes check authentication status

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt
- **JWT Tokens**: Secure, time-limited access tokens
- **Token Verification**: Automatic token validation on protected endpoints
- **Google OAuth**: Secure third-party authentication
- **CORS Protection**: Configured CORS middleware
- **Input Validation**: Pydantic schema validation

## User Experience

- **Seamless Integration**: Authentication integrates with existing UI
- **Persistent Sessions**: Users stay logged in across browser sessions
- **User Profile**: Shows user avatar, name, and email in header
- **Responsive Design**: Works on all device sizes
- **Loading States**: Proper loading indicators during authentication
- **Error Handling**: Clear error messages for failed attempts

## Troubleshooting

### Common Issues

1. **Google OAuth not working**: Check that `GOOGLE_CLIENT_ID` is set correctly
2. **Database errors**: Ensure the migration has been run
3. **CORS issues**: Verify CORS settings in backend config
4. **Token expiration**: Tokens expire after 30 minutes by default

### Development Tips

- Use browser dev tools to inspect network requests
- Check browser console for JavaScript errors
- Verify environment variables are loaded correctly
- Test with both local and Google authentication

## Production Considerations

- Change `SECRET_KEY` to a strong, random value
- Set `DEBUG=false` in production
- Use HTTPS in production
- Configure proper CORS origins
- Set up proper database credentials
- Consider using environment-specific configuration files
- Implement rate limiting for authentication endpoints
- Add logging for security events
- Consider implementing refresh token rotation

## Migration from Existing System

The authentication system is designed to work alongside your existing admin authentication:

- Existing admin endpoints continue to work
- New user authentication is completely separate
- Admin users can still access admin features
- Regular users get access to main app features

## Support

For issues or questions about the authentication system:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure database migrations have been applied
4. Test with a fresh browser session
