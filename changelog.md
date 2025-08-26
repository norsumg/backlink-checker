# Changelog

All notable changes to the Backlink Price Finder project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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