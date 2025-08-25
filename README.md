# Backlink Price Finder

A web application that helps users check which guest-post/backlink marketplaces list a domain and at what price.

## Features

### For Users
- **Domain Lookup**: Search our comprehensive database to find domains across marketplaces and their prices
- **Price Comparison**: See all prices normalized to USD for easy comparison
- **Usage-Based Access**: Free users get 3 searches per month, paid users get unlimited access
- **Google OAuth**: Quick sign-in with your Google account

### For Administrators
- **Marketplace Data Ingestion**: Upload CSV exports from various backlink marketplaces to populate the database
- **Data Management**: Manage domains, offers, and marketplace information
- **Analytics**: Track usage statistics and system performance

**Note**: CSV upload functionality is admin-only. Regular users search the existing database - they do not upload their own data.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python + SQLAlchemy
- **Database**: PostgreSQL
- **Authentication**: JWT tokens + Google OAuth
- **Usage Tracking**: Monthly search limits with plan-based access

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/norsumg/backlink-checker.git
   cd backlink-checker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb backlink_checker
   
   # Run migrations
   alembic upgrade head
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Start the Backend**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the backend is running, visit:
- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backlink-checker/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration, security
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   └── types/          # TypeScript types
│   └── package.json
└── docker-compose.yml      # Development environment
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
