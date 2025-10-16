#!/bin/bash

# Weekwise Quick Start Script
# This script helps you set up the Weekwise scheduler application quickly

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Generate random secret
generate_secret() {
    if command_exists openssl; then
        openssl rand -base64 32
    else
        # Fallback to generating random string without openssl
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
    fi
}

# Main script
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}║     Weekwise Quick Start Setup        ║${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
print_header "Checking Prerequisites"

if command_exists bun; then
    BUN_VERSION=$(bun --version)
    print_success "Bun installed (v$BUN_VERSION)"
    USE_BUN=true
elif command_exists node; then
    NODE_VERSION=$(node --version)
    print_warning "Bun not found, using Node.js ($NODE_VERSION)"
    print_info "Install Bun for better performance: https://bun.sh"
    USE_BUN=false
else
    print_error "Neither Bun nor Node.js found!"
    echo "Please install Bun (recommended): https://bun.sh"
    echo "Or install Node.js: https://nodejs.org"
    exit 1
fi

if command_exists docker; then
    print_success "Docker installed"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not found - will need PostgreSQL installed separately"
    DOCKER_AVAILABLE=false
fi

# Install dependencies
print_header "Installing Dependencies"

if [ "$USE_BUN" = true ]; then
    print_info "Running: bun install"
    bun install
else
    print_info "Running: npm install"
    npm install
fi

print_success "Dependencies installed"

# Setup environment files
print_header "Setting Up Environment Variables"

if [ ! -f "apps/server/.env" ]; then
    print_info "Creating apps/server/.env from template"
    
    cp apps/server/.env.example apps/server/.env
    
    # Generate a secure secret
    SECRET=$(generate_secret)
    
    # Update the .env file with generated secret
    if command_exists sed; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-secret-key-here-change-in-production/$SECRET/g" apps/server/.env
        else
            # Linux
            sed -i "s/your-secret-key-here-change-in-production/$SECRET/g" apps/server/.env
        fi
        print_success "Generated secure BETTER_AUTH_SECRET"
    else
        print_warning "Generated secret: $SECRET"
        print_warning "Please manually update BETTER_AUTH_SECRET in apps/server/.env"
    fi
    
    print_success "Created apps/server/.env"
else
    print_warning "apps/server/.env already exists, skipping"
fi

if [ ! -f "apps/web/.env" ]; then
    print_info "Creating apps/web/.env from template"
    cp apps/web/.env.example apps/web/.env
    print_success "Created apps/web/.env"
else
    print_warning "apps/web/.env already exists, skipping"
fi

# Setup PostgreSQL
print_header "Setting Up PostgreSQL Database"

if [ "$DOCKER_AVAILABLE" = true ]; then
    # Check if postgres container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "weekwise-postgres"; then
        print_warning "PostgreSQL container 'weekwise-postgres' already exists"
        
        # Check if it's running
        if docker ps --format '{{.Names}}' | grep -q "weekwise-postgres"; then
            print_success "PostgreSQL is already running"
        else
            print_info "Starting existing PostgreSQL container"
            docker start weekwise-postgres
            sleep 2
            print_success "PostgreSQL started"
        fi
    else
        print_info "Starting PostgreSQL in Docker"
        docker run -d \
            --name weekwise-postgres \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=scheduler \
            -p 5432:5432 \
            postgres:15
        
        sleep 3  # Wait for PostgreSQL to start
        print_success "PostgreSQL started in Docker"
    fi
else
    print_warning "Docker not available"
    print_info "Please ensure PostgreSQL is running on localhost:5432"
    print_info "Or update DATABASE_URL in apps/server/.env with your PostgreSQL connection string"
    
    read -p "Press Enter to continue..."
fi

# Initialize database
print_header "Initializing Database"

print_info "Generating Prisma client and pushing schema to database"

if [ "$USE_BUN" = true ]; then
    bun run db:push
else
    npm run db:push
fi

print_success "Database initialized"

# Done!
print_header "Setup Complete! 🎉"

echo ""
echo -e "${GREEN}All done! Your Weekwise application is ready.${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "  1. Start the development servers:"
echo ""
if [ "$USE_BUN" = true ]; then
    echo -e "     ${YELLOW}bun run dev${NC}"
else
    echo -e "     ${YELLOW}npm run dev${NC}"
fi
echo ""
echo "  2. Open your browser:"
echo ""
echo -e "     Frontend:  ${YELLOW}http://localhost:3001${NC}"
echo -e "     Backend:   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "  3. Create an account and start scheduling!"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo ""
if [ "$USE_BUN" = true ]; then
    echo "  • bun run dev:server    - Start backend only"
    echo "  • bun run dev:web       - Start frontend only"
    echo "  • bun run db:studio     - Open Prisma Studio (database GUI)"
else
    echo "  • npm run dev:server    - Start backend only"
    echo "  • npm run dev:web       - Start frontend only"
    echo "  • npm run db:studio     - Open Prisma Studio (database GUI)"
fi
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo ""
echo "  • README.md              - Setup and usage guide"
echo "  • docs/architecture.md   - Technical architecture"
echo ""
echo -e "${GREEN}Happy scheduling! 🗓️${NC}"
echo ""
