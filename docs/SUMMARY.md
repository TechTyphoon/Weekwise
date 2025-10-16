# Documentation Summary

## Overview

This directory contains comprehensive documentation for the **Weekwise** scheduler application. This is a full-stack TypeScript application for managing recurring weekly schedules with exception handling and authentication.

## Important Note

⚠️ **This is NOT a blockchain, whale tracker, or AI application.** 

The ticket description may have referenced Firebase functions, blockchain APIs, price feeds, and AI keys - these are **not** part of this codebase. Weekwise is a scheduler application built with:
- **Backend**: Hono + tRPC + Prisma + PostgreSQL
- **Frontend**: React 18 + TanStack Router/Query + Tailwind CSS
- **Auth**: Better Auth (email/password)
- **Deployment**: Vercel (frontend) + Render (backend)

## Documentation Files

### 📚 Main Documentation

#### [README.md](../README.md)
**Purpose**: Primary entry point for users and developers  
**Contents**:
- Project overview and live demo
- Quick start guide (Docker & manual setup)
- Environment variables reference
- Available scripts
- Deployment instructions (Vercel, Render, Docker)
- Comprehensive troubleshooting section
- Project structure overview

**Use this when**: Setting up the project for the first time, deploying, or troubleshooting common issues.

---

#### [architecture.md](./architecture.md)
**Purpose**: Technical deep-dive into system design  
**Contents**:
- System architecture diagram
- Technology stack details
- Database schema with ERD
- Complete API layer documentation
- Authentication system design
- Business logic implementation (2-slot rule, exceptions, validations)
- Frontend architecture (components, routing, state management)
- Data flow diagrams
- Security considerations
- Performance optimizations

**Use this when**: Understanding how the system works internally, making architectural decisions, or debugging complex issues.

---

#### [api.md](./api.md)
**Purpose**: Complete API reference for all tRPC procedures  
**Contents**:
- Authentication endpoints (Better Auth)
- All tRPC procedures with:
  - Input/output schemas
  - Validation rules
  - Example requests and responses
  - Error handling
  - Usage examples (React & vanilla TypeScript)
- Rate limiting recommendations
- API versioning strategy

**Use this when**: Integrating with the API, building new features, or troubleshooting API calls.

---

#### [development.md](./development.md)
**Purpose**: Developer guide for contributing to the project  
**Contents**:
- Code style conventions
- File organization patterns
- React and TypeScript best practices
- Project structure breakdown
- Development workflow
- Git workflow and commit conventions
- Common tasks (adding procedures, models, components)
- Debugging techniques
- Performance optimization tips

**Use this when**: Contributing code, reviewing pull requests, or establishing coding standards.

---

#### [operations.md](./operations.md)
**Purpose**: Operational guide for maintaining the application  
**Contents**:
- Development workflow
- Database operations (migrations, backups, queries)
- Deployment operations (Vercel, Render, Docker)
- Monitoring and logging
- Backup and disaster recovery procedures
- Common issues and solutions
- Maintenance tasks (updates, security)
- Performance tuning

**Use this when**: Deploying to production, performing maintenance, or responding to incidents.

---

### 🚀 Quick Start

#### [quickstart.sh](./quickstart.sh)
**Purpose**: Automated setup script  
**Contents**:
- Dependency checking (Bun/Node, Docker)
- Automated installation
- Environment file creation with secure secret generation
- PostgreSQL setup (Docker)
- Database initialization
- Helpful output with next steps

**Use this when**: Setting up the project for the first time.

**Usage**:
```bash
chmod +x docs/quickstart.sh
./docs/quickstart.sh
```

---

## Documentation Map

### By User Type

#### New Developers
1. Start with [README.md](../README.md) - Quick Start section
2. Run [quickstart.sh](./quickstart.sh) to set up automatically
3. Read [development.md](./development.md) - Code Style & Conventions
4. Review [architecture.md](./architecture.md) - System Overview

#### Experienced Developers
1. [development.md](./development.md) - Project structure and workflows
2. [architecture.md](./architecture.md) - Technical details
3. [api.md](./api.md) - API reference

#### DevOps / SRE
1. [README.md](../README.md) - Deployment section
2. [operations.md](./operations.md) - Complete operational guide
3. [architecture.md](./architecture.md) - Infrastructure details

#### API Consumers
1. [api.md](./api.md) - Complete API reference
2. [architecture.md](./architecture.md) - Authentication system

### By Task

#### Setting Up Locally
1. [README.md](../README.md) - Quick Start
2. [quickstart.sh](./quickstart.sh) - Automated setup
3. [README.md](../README.md) - Troubleshooting

#### Adding a Feature
1. [development.md](./development.md) - Code conventions
2. [architecture.md](./architecture.md) - Understand existing patterns
3. [api.md](./api.md) - API structure (if backend change)

#### Deploying to Production
1. [README.md](../README.md) - Deployment section
2. [operations.md](./operations.md) - Deployment operations
3. [operations.md](./operations.md) - Monitoring checklist

#### Debugging Issues
1. [README.md](../README.md) - Troubleshooting section
2. [operations.md](./operations.md) - Common issues
3. [development.md](./development.md) - Debugging techniques

#### Database Changes
1. [architecture.md](./architecture.md) - Current schema
2. [development.md](./development.md) - Adding database models
3. [operations.md](./operations.md) - Database operations

## Key Concepts

### Recurring Schedules
- Users create schedules that repeat weekly on specific days
- Maximum 2 slots per day per user
- Times stored in "HH:MM" format (24-hour)
- Soft-deleted (marked `isActive = false`)

### Exceptions
- Edit specific dates without changing recurring pattern
- Stored separately in `ScheduleException` table
- Can modify times or delete slot for specific date
- Automatically applied when generating week views

### Authentication
- Email/password via Better Auth
- Session-based with HTTP-only cookies
- All schedules are user-scoped
- Protected tRPC procedures enforce authorization

### Data Flow
1. Frontend mutation triggers optimistic update (instant UI feedback)
2. tRPC procedure validates input and authorization
3. Database operation performed via Prisma
4. Success/error returned to client
5. TanStack Query invalidates cache and refetches

## Quick Reference

### Start Development
```bash
bun run dev              # All services
bun run dev:server       # Backend only
bun run dev:web          # Frontend only
```

### Database
```bash
bun run db:push          # Push schema (dev)
bun run db:migrate       # Create migration (prod)
bun run db:studio        # Open GUI
```

### Type Checking
```bash
bun run check-types      # All projects
```

### Build
```bash
bun run build            # All projects
```

## Environment Variables

### Backend Required
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGIN` - Frontend URL(s)
- `BETTER_AUTH_SECRET` - Auth secret key
- `BETTER_AUTH_URL` - Backend URL

### Frontend Optional
- `VITE_API_URL` - Backend URL (defaults to localhost:3000)

## Project Statistics

- **Lines of Code**: ~2000+ (excluding dependencies)
- **Database Tables**: 6 (User, Session, Account, Verification, Schedule, ScheduleException)
- **tRPC Procedures**: 6 (1 public, 5 protected)
- **React Routes**: 3 (/, /login, /scheduler)
- **Tech Stack**: 15+ major libraries/frameworks

## Maintenance

This documentation should be updated when:
- [ ] New features are added
- [ ] API changes are made
- [ ] Deployment process changes
- [ ] Database schema changes
- [ ] Dependencies are updated significantly
- [ ] Common issues are discovered

## Contributing to Docs

When updating documentation:
1. Keep examples up-to-date
2. Test all code snippets
3. Update diagrams if architecture changes
4. Maintain consistent formatting
5. Add table of contents for long documents
6. Cross-reference related sections

## Support

For questions about the documentation:
1. Check if the answer is in another doc file
2. Review the [architecture.md](./architecture.md) for technical details
3. Check the code directly (it's well-commented)
4. Open a GitHub issue with your question

---

**Last Updated**: October 2024  
**Version**: 1.0.0  
**Maintained By**: Development Team
