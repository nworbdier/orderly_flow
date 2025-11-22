#!/bin/bash

echo "🚀 Initializing Better Auth with Drizzle + PostgreSQL..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "   Please create .env.local and add your DATABASE_URL"
    echo "   Example: DATABASE_URL=postgresql://user:password@host:port/database"
    exit 1
else
    echo "✅ .env.local found"
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env.local; then
    echo "❌ DATABASE_URL not found in .env.local"
    echo "   Please add your PostgreSQL connection string"
    exit 1
fi

# Generate Better Auth schema
echo "📝 Generating Better Auth schema..."
bunx @better-auth/cli@latest generate

# Apply migrations with Drizzle
echo "🗄️  Applying database migrations with Drizzle..."
bunx drizzle-kit push

echo ""
echo "✨ Better Auth setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Run 'bun dev' to start the development server"
echo "   2. Visit http://localhost:3000/sign-up to create an account"
echo "   3. Check BETTER_AUTH_SETUP.md for more information"
echo ""

