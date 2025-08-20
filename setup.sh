#!/bin/bash

echo "🚀 Setting up Backlink Price Finder..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is required but not installed."
    echo "Please install PostgreSQL and ensure it's running."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create virtual environment for backend
echo "📦 Setting up Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create database
echo "🗄️ Creating database..."
createdb backlink_checker 2>/dev/null || echo "Database already exists"

# Run database migrations
echo "🔄 Running database migrations..."
cd backend
source venv/bin/activate
alembic upgrade head
cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "2. Start the frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker Compose: docker-compose up"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API Docs: http://localhost:8000/docs"
