# Backlink Price Finder 🔍

A comprehensive web application that helps users discover which guest-post/backlink marketplaces list their domains and at what prices. Built for scalability and performance with modern technologies.

## 🌟 Features

### 👥 For Users
- **🔍 Advanced Domain Lookup**: Search across multiple marketplaces simultaneously
- **💱 Multi-Currency Support**: Automatic price conversion with real-time exchange rates
- **📊 Price Comparison**: Side-by-side marketplace pricing with USD normalization
- **💳 Flexible Billing**: Free plan (3 searches/month) + Unlimited plan ($4.99/month)
- **🏪 Subscription Management**: Stripe-powered billing with customer portal
- **🔐 Secure Authentication**: Google OAuth + traditional email/password login
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile

### 🛠️ For Administrators
- **📤 Bulk CSV Upload**: Large file support (up to 50MB) with real-time progress tracking
- **⚡ Batch Processing**: Efficient handling of 10k+ row uploads with progress indicators
- **🔍 Database-Wide Search**: Search across entire database (170k+ records) with real-time results
- **📊 Server-Side Sorting**: Efficient database-level sorting for all admin tables
- **✏️ Inline Editing**: Edit marketplace, offer, and user data directly in tables
- **🏪 Marketplace Management**: Add/edit marketplace configurations with search and sort
- **💹 FX Rate Management**: Real-time currency conversion setup with advanced filtering
- **👥 Complete User Management**: Comprehensive user administration system
  - View, search, and sort all users with detailed information
  - Edit user plans (Free ↔ Unlimited), account status, and search quotas
  - User analytics: registration dates, last login, usage patterns
  - Bulk user operations and account management
- **📊 Advanced Analytics**: User activity, search patterns, and system metrics
- **🧹 Data Quality Tools**: Identify and clean up invalid entries (e.g., zero-price offers)

### 🔧 Technical Features
- **🐳 Production-Ready Docker Setup**: Full containerization with nginx, SSL
- **⚡ High Performance**: Multi-worker backend, optimized database queries
- **🔍 True Database Search**: Server-side search/sort handles millions of records efficiently
- **🔒 Enterprise Security**: JWT tokens, input validation, rate limiting
- **📈 Scalable Architecture**: Microservices-ready with clear separation of concerns

**Note**: CSV upload functionality is admin-only. Regular users search the existing database.

## 💳 Billing Plans

### Free Plan
- **3 domain searches per month**
- Access to complete marketplace database
- Basic support

### Unlimited Plan - $4.99/month
- **Unlimited domain searches**
- Access to complete marketplace database  
- Priority support
- Advanced filtering options
- **Live Stripe billing** with secure payment processing and easy cancellation

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript** for type-safe development
- **Tailwind CSS** for responsive design
- **React Query** for data fetching and caching
- **React Dropzone** for file uploads with progress tracking
- **Lucide React** for consistent iconography

### Backend  
- **FastAPI** for high-performance API development
- **SQLAlchemy 2.0** with async support
- **Alembic** for database migrations
- **Pandas** for CSV processing
- **JWT** for secure authentication
- **Google OAuth** integration
- **Stripe** for payment processing and subscription management

### Database & Infrastructure
- **PostgreSQL 15** for production data storage
- **Docker Compose** for development and production
- **Nginx** with SSL termination and extended timeouts
- **uvicorn** with multi-worker support for concurrency

### DevOps & Production
- **Docker** containerization
- **Let's Encrypt** SSL certificates
- **Digital Ocean Droplets** (production deployment)
- **Git-based deployments**

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose** (recommended)
- **Node.js 18+** and **Python 3.11+** (for local development)
- **PostgreSQL 15+** (if not using Docker)

### 🐳 Docker Development (Recommended)

```bash
# Clone and start everything
git clone https://github.com/norsumg/backlink-checker.git
cd backlink-checker

# Copy environment template
cp docker-compose.template.yml docker-compose.yml

# Create .env file with your configuration
# (Required for Google OAuth, Stripe, and other services)
cp .env.example .env
# Edit .env with your actual API keys and secrets
# IMPORTANT: Both GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID must be set

# Start all services
docker-compose up -d --build

# Run database migrations
docker exec -it backlink-checker-backend-1 alembic upgrade head

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 💻 Local Development Setup

<details>
<summary>Click to expand local setup instructions</summary>

1. **Clone the repository**
   ```bash
   git clone https://github.com/norsumg/backlink-checker.git
   cd backlink-checker
   ```

2. **Environment Configuration**
   ```bash
   # Create .env file with your configuration
   cp .env.example .env
   
   # Edit .env with your actual values:
   # - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (from Google Cloud Console)
   # - STRIPE_* keys (from Stripe Dashboard)
   # - Strong SECRET_KEY and ADMIN_PASSWORD
   # - Database password (POSTGRES_PASSWORD)
   ```
   
   **Required .env variables:**
   ```bash
   # Google OAuth (both required for backend and frontend)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Database
   POSTGRES_PASSWORD=your-strong-database-password
   
   # Security
   SECRET_KEY=your-super-secret-jwt-key
   ADMIN_PASSWORD=your-admin-password
   
   # Stripe Billing (Production Keys)
   STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   STRIPE_PRICE_ID=price_your_live_price_id
   ```

3. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb backlink_checker
   
   # Run migrations
   alembic upgrade head
   ```

5. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Start the Backend**
   ```bash
   cd backend
   uvicorn app.main:app --reload --workers 2
   ```

</details>

## 📚 Documentation

### API Documentation
- **Interactive API Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### Additional Guides
- **[🚀 Production Deployment](./DEPLOYMENT.md)** - Complete deployment guide
- **[🔐 Authentication Setup](./AUTHENTICATION_SETUP.md)** - OAuth configuration
- **[📊 CSV Upload Guide](./CSV_UPLOAD_GUIDE.md)** - Bulk data import process

### Key Endpoints
POST /api/v1/lookup/ # Domain search
POST /api/v1/ingest/csv # CSV upload (admin)
GET /api/v1/marketplaces # List marketplaces
POST /api/v1/auth/login # User authentication
GET /api/v1/admin/stats # System analytics
GET /api/v1/admin/users # User management (admin)

## 📁 Project Structure
backlink-checker/
├── 🐳 docker-compose.yml # Production deployment
├── 📋 docker-compose.template.yml # Template (safe to commit)
├── 📚 Documentation/
│ ├── README.md # This file
│ ├── DEPLOYMENT.md # Production deployment
│ ├── AUTHENTICATION_SETUP.md # OAuth setup
│ ├── CSV_UPLOAD_GUIDE.md # Data import guide
│ └── CHANGELOG.md # Version history
├── 🔧 backend/ # FastAPI backend
│ ├── app/
│ │ ├── api/v1/ # API endpoints
│ │ │ └── endpoints/ # Route handlers
│ │ ├── core/ # Config, database, security
│ │ ├── models/ # SQLAlchemy models
│ │ ├── schemas/ # Pydantic request/response
│ │ ├── services/ # Business logic
│ │ └── middleware/ # Custom middleware
│ ├── alembic/ # Database migrations
│ ├── requirements.txt # Python dependencies
│ └── Dockerfile # Backend container
├── 🎨 frontend/ # React frontend
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # Page components
│ │ ├── contexts/ # React contexts
│ │ ├── services/ # API integration
│ │ └── types/ # TypeScript definitions
│ ├── nginx.conf # Production nginx config
│ ├── package.json # Node dependencies
│ └── Dockerfile # Frontend container
└── 📊 sample_data/ # Example CSV files

## 🎯 Recent Major Updates

### Production Stripe Integration (2025-09-15)
- 💳 **Live Payment Processing** - Successfully migrated from test to production Stripe
- 🚀 **Production Billing** - $4.99/month unlimited plan now processing real payments
- 🔒 **Secure Transactions** - Live webhook handling and customer portal integration
- 🧹 **Clean Migration** - Seamless transition with proper test data cleanup

### Visual & User Management (2025-09)
- 🎨 **Custom Branding** with new logo and favicon for professional appearance
- 🏠 **Homepage Database Stats** showcasing 170k+ records to non-logged-in users
- 👥 **Complete User Management** system for administrators with full CRUD operations
- 🧹 **Simplified UI** removing redundant login prompts for cleaner experience
- 📊 **Enhanced Number Formatting** with thousands separators across all statistics

### Performance & Scalability (2025-01)
- ⚡ **Multi-worker backend** for concurrent request handling
- 📊 **Progress indicators** for large CSV uploads (up to 50MB)
- 🔄 **Batch processing** for efficient handling of 10k+ row files
- ⏱️ **Extended timeouts** for large file operations (up to 15 minutes)

### User Experience (2024-12)
- 🎨 **Responsive design** improvements across all devices
- 🔍 **Enhanced search interface** with better filtering
- 📈 **Real-time progress tracking** for admin operations
- 🌍 **Multi-currency support** with automatic conversion

### Security & Authentication (2024-11)
- 🔐 **Full authentication system** with JWT tokens
- 🌐 **Google OAuth integration** for seamless sign-in
- 👨‍💼 **Role-based access control** (users vs admins)
- 🛡️ **Rate limiting** and input validation

### Infrastructure (2024-10)
- 🐳 **Production Docker setup** with SSL termination
- 🔒 **Let's Encrypt** automatic SSL certificates
- 📊 **Database optimization** with proper indexing
- 🚀 **CI/CD deployment** process

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/norsumg/backlink-checker/issues)
- **Documentation**: Check the documentation files in the root directory
- **Deployment Help**: See [DEPLOYMENT.md](./DEPLOYMENT.md)