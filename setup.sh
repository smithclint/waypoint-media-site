#!/bin/bash

# Real Estate Portfolio Setup Script
# This script helps set up the development environment

echo "🏠 Setting up Real Estate Portfolio Development Environment"
echo "=========================================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not found. Please install pip first."
    exit 1
fi

echo "✅ pip3 found"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install openai pillow requests python-dotenv

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔐 Creating .env file..."
    echo "# OpenAI API Key for photo classification" > .env
    echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env
    echo "⚠️  Please edit .env file and add your OpenAI API key"
else
    echo "✅ .env file already exists"
fi

# Create photos upload directory
if [ ! -d "photos_to_upload" ]; then
    echo "📁 Creating photos_to_upload directory..."
    mkdir -p photos_to_upload
    echo "📸 Add your photos to photos_to_upload/ directory"
else
    echo "✅ photos_to_upload directory already exists"
fi

# Create .gitignore if it doesn't exist or update it
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore file..."
    cat > .gitignore << EOF
# Environment variables
.env

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so

# macOS
.DS_Store

# Temporary files
*.tmp
*.temp

# Photo upload directory (optional - uncomment if you don't want to track)
# photos_to_upload/
EOF
else
    # Check if .env is in .gitignore
    if ! grep -q "\.env" .gitignore; then
        echo ".env" >> .gitignore
        echo "✅ Added .env to .gitignore"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your OpenAI API key"
echo "2. Add photos to photos_to_upload/ directory"
echo "3. Run 'make help' to see available commands"
echo "4. Run 'make serve' to start local development server"
echo ""
echo "📖 For detailed documentation, see README-real-estate.md"
