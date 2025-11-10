#!/bin/bash

echo "🎬 Video Streaming Platform - Quick Start"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL 12+ and create a database."
else
    echo "✓ PostgreSQL is installed"
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend && npm install

echo ""
echo "📦 Installing Frontend Dependencies..."
cd ../frontend && npm install

echo ""
echo "✅ Installation Complete!"
echo ""
echo "Next steps:"
echo "1. Create a PostgreSQL database named 'videostreaming'"
echo "2. Copy backend/.env.example to backend/.env and configure"
echo "3. Copy frontend/.env.example to frontend/.env and configure"
echo "4. Run 'npm run migrate' in the backend folder"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd frontend && npm start"
echo ""
echo "📖 See README.md for detailed instructions"
