# Changelog

All notable changes to the Backlink Price Finder project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2025-09-07

### 🔧 Fixed
- **Google OAuth Authentication**: Fixed Google "Sign in with Google" functionality that was redirecting to homepage
- **Environment Variable Handling**: Properly configured VITE_GOOGLE_CLIENT_ID to be passed during Docker build process
- **Content Security Policy**: Updated CSP headers to allow Google OAuth stylesheets and scripts

### 🔒 Security
- **Environment Variables**: Moved all hardcoded secrets from docker-compose.yml to .env file
- **Secret Management**: Removed hardcoded API keys, database passwords, and OAuth secrets from version control
- **Configuration Security**: All sensitive configuration now properly managed through environment variables

### 📝 Documentation
- **Setup Instructions**: Added .env file configuration requirements to README
- **Security Best Practices**: Updated deployment documentation with proper secret management

## [2.2.0] - 2025-08-27

### 🚀 Added
- **Stripe Payment Integration**: Complete billing system with monthly unlimited plan ($4.99/month)
- **Subscription Management**: Stripe Customer Portal for users to manage subscriptions
- **Usage Tracking**: Enhanced plan-based search limits (3 for free, unlimited for paid)
- **Billing Dashboard**: New billing page for subscription status and management
- **Upgrade Prompts**: Smart prompts when users hit their search limits
- **Webhook Processing**: Automated subscription status updates via Stripe webhooks
- **Test Mode**: Full Stripe test environment for safe development and testing
- **Enhanced Admin Panel**: Complete overhaul with server-side search, sorting, and inline editing capabilities
- **Database-Wide Admin Search**: Real-time search across the entire database (121k+ records), not just loaded data
- **Server-Side Admin Sorting**: Efficient database-level sorting with visual indicators for all admin tables
- **Admin Inline Editing**: Edit marketplace and offer data directly in the table with save/cancel controls
- **CSV Upload Validation**: Enhanced validation to prevent zero-price entries from affecting price statistics
- **Zero-Price Cleanup Tools**: Admin endpoints to identify and remove invalid zero-price offers

### 🔧 Changed
- **User Model**: Added Stripe customer ID, subscription status, and billing fields
- **Plan System**: Simplified to two tiers - Free (3 searches) and Unlimited (999+ searches)
- **Header Navigation**: Added upgrade/billing buttons based on user plan status
- **Environment Management**: Improved docker-compose template structure for secure variable handling
- **Admin UI/UX**: Modern interface with improved table layouts, action buttons, and visual feedback
- **Admin Performance**: Server-side database search and sorting for true scalability (no more 100-record limits)

### 🐛 Fixed
- **Admin Plan Display**: Fixed billing page showing "Free Plan" instead of "Unlimited Plan" for admin users
- **Admin User Access**: Ensured admin users automatically get unlimited plan type in database
- **Homepage Price Statistics**: Fixed "Minimum: $0" issue by preventing zero-price entries in CSV uploads
- **React Hooks Error**: Fixed critical Error #310 that caused admin page crashes due to conditional hook usage
- **Environment Variable Loading**: Resolved Stripe configuration not loading in Docker containers
- **Database Connection**: Fixed PostgreSQL authentication issues during container restarts
- **Template Structure**: Restored proper docker-compose template pattern for maintainability
- **Variable Conflicts**: Cleaned up duplicate environment variables in .env files

### 📚 Documentation
- **STRIPE_SETUP.md**: Complete guide for configuring Stripe integration
- **Environment Setup**: Updated documentation for proper .env file management

## [2.1.0] - 2025-01-26

### 🚀 Added
- **Progress Indicators**: Real-time upload progress for CSV files with percentage tracking
- **Processing Status**: Visual feedback during CSV batch processing
- **Extended Timeouts**: Nginx configuration for handling large file uploads (up to 15 minutes)
- **Multi-worker Backend**: Concurrent request handling to prevent blocking during large uploads
- **Batch Processing**: Efficient processing of CSV files in 100-row batches with database commits

### 🔧 Changed
- **Backend Concurrency**: Updated docker-compose to use `--workers 2` instead of `--reload`
- **Timeout Configuration**: Extended nginx timeouts for CSV upload endpoint specifically
- **File Size Validation**: Added explicit 50MB file size checking before processing
- **Error Handling**: Improved error states and progress reset on upload failures

### 🐛 Fixed
- **Connection Timeouts**: Resolved ERR_CONNECTION_CLOSED errors for large CSV uploads
- **Backend Blocking**: Fixed single-threaded processing that blocked authentication during uploads
- **Progress Tracking**: Proper progress bar state management and cleanup

### 📚 Documentation
- Updated README.md with current feature set and architecture
- Added comprehensive changelog tracking
- Enhanced deployment documentation

## [2.0.0] - 2024-12-15

### 🚀 Added
- **Complete Authentication System**: JWT-based auth with Google OAuth integration
- **User Management**: Registration, login, user profiles with avatars
- **Role-Based Access**: Separate user and admin access levels
- **Usage Tracking**: Monthly search limits with plan-based restrictions
- **Admin Dashboard**: Comprehensive admin interface for system management

### 🔐 Security
- **JWT Token Security**: Secure token-based authentication with expiration
- **Google OAuth**: Third-party authentication integration
- **Input Validation**: Enhanced Pydantic schema validation
- **CORS Protection**: Proper CORS middleware configuration

### 🎨 Frontend
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **React Query**: Efficient data fetching and caching
- **Authentication UI**: Login/register forms with Google OAuth buttons
- **Protected Routes**: Automatic redirection for unauthenticated users

### 📊 Database
- **User Model**: Complete user management with profiles
- **Usage Tracking**: Search history and monthly usage limits
- **Database Migrations**: Alembic migrations for schema evolution

## [1.5.0] - 2024-11-20

### 🏪 Added
- **Enhanced Marketplace Management**: Advanced marketplace configuration
- **FX Rate System**: Real-time currency conversion with rate caching
- **CSV Upload Improvements**: Better error handling and validation
- **Admin Analytics**: System performance and usage metrics

### 💱 Currency Features
- **Multi-Currency Support**: Automatic price conversion to USD
- **Exchange Rate API**: Integration with external FX rate services
- **Currency Validation**: Proper currency code validation and handling

### 🔧 Backend Improvements
- **Service Layer**: Refactored business logic into dedicated services
- **Error Handling**: Comprehensive error responses and logging
- **Database Optimization**: Improved queries and indexing

## [1.0.0] - 2024-10-01

### 🎉 Initial Release
- **Domain Lookup**: Search domains across multiple marketplaces
- **CSV Import**: Bulk data import from marketplace exports
- **Price Comparison**: USD-normalized price comparison
- **Basic Admin Interface**: Simple administration tools

### 🛠️ Technical Foundation
- **FastAPI Backend**: High-performance API with automatic documentation
- **React Frontend**: Modern TypeScript-based user interface
- **PostgreSQL Database**: Robust data storage with SQLAlchemy ORM
- **Docker Deployment**: Complete containerization for easy deployment

### 📋 Core Features
- **Marketplace Database**: Comprehensive backlink marketplace data
- **Domain Management**: Efficient domain storage and retrieval
- **Offer Tracking**: Price tracking across multiple platforms
- **Basic Authentication**: Simple admin access control

## [0.1.0] - 2024-09-15

### 🌱 Project Initialization
- **Project Setup**: Initial repository structure
- **Basic Models**: Core database models for domains and offers
- **Development Environment**: Docker Compose development setup
- **Documentation**: Basic README and setup instructions

---

## 🔮 Future Roadmap

### Planned Features
- **API Rate Limiting**: Advanced rate limiting for API endpoints
- **Export Functionality**: CSV/Excel export of search results
- **Advanced Filtering**: Enhanced search filters and sorting
- **Email Notifications**: User notifications for system updates
- **Analytics Dashboard**: Advanced analytics and reporting
- **Bulk Operations**: Batch operations for admin users

### Technical Improvements
- **Caching Layer**: Redis caching for improved performance
- **Background Jobs**: Celery integration for long-running tasks
- **API Versioning**: Proper API versioning strategy
- **Testing Suite**: Comprehensive test coverage
- **CI/CD Pipeline**: Automated testing and deployment