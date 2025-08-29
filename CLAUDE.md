# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint for code quality checks

### Database Management
- `pnpm prisma generate` - Generate Prisma client
- `pnpm prisma db push` - Push schema changes to database
- `pnpm prisma db reset` - Reset database (destructive)
- `pnpm prisma studio` - Open Prisma Studio for database inspection

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.1.7 with App Router
- **UI**: React 19.0.0, TailwindCSS 3.4.17, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM 6.4.0
- **Authentication**: Supabase Auth with custom encryption
- **AI/Agent**: OpenAI Agents SDK for inventory management
- **State Management**: TanStack Query 5.66.7 for server state
- **Forms**: react-hook-form with Zod validation

### Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (sign-in, sign-up, etc.)
│   ├── (dashboard)/         # Protected dashboard routes
│   └── api/                 # API routes organized by domain
├── components/              # React components
│   ├── ui/                  # shadcn/ui components library
│   ├── auth/                # Authentication components
│   ├── dashboard/           # Dashboard-specific components
│   └── settings/            # Settings page components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and configurations
│   ├── ai-agent.ts          # OpenAI agent configuration
│   ├── agent-tools.ts       # Database tools for AI agent
│   └── supabase/           # Supabase client and utilities
├── providers/               # Context providers
└── types/                   # TypeScript type definitions
```

## Full-Stack Implementation Flow

1. **Pages**: Define routes in `src/app/` with server/client components
2. **Authentication**: Protected routes use middleware for session checks
3. **Components**: UI components consume data through custom hooks
4. **Data Fetching**: Custom hooks use TanStack Query to call API routes
5. **API Routes**: Handle business logic and database operations via Prisma
6. **Database**: All database operations MUST use Prisma client exclusively

## Key Features

### Authentication System
- **Supabase Auth** with multiple flows: email/password, magic links, password reset
- **Client-side encryption** for sensitive data using crypto-js
- **Protected routes** via middleware (`src/middleware.ts`)
- **Row Level Security** enabled in database schema

### AI Agent Integration
- **Unified AI Agent** (`src/lib/ai-agent.ts`) using OpenAI Agents SDK
- **Inventory Management Tools** for products, customers, sales, and reporting
- **Conversation Memory** to maintain context across chat sessions
- **Dual Mode**: Handles both general conversation and inventory operations

### Database Schema
- **Multi-schema setup**: `auth` schema for Supabase, `public` for app data
- **Core entities**: products, customers, sales, inventory_movements
- **User-scoped data** with foreign key relationships to auth.users

## Development Guidelines

### Database Operations
- **ALWAYS use Prisma client** for all database operations - never raw SQL
- Use proper UUID types for all IDs - never pass product names as IDs
- Implement proper error handling and validation
- Use transactions for multi-step operations

### Component Architecture
- **shadcn/ui components**: Import from `@/components/ui/` directory
- **Lucide React icons**: Use for all iconography with accessibility attributes
- **TailwindCSS**: Use exclusively for styling with responsive modifiers
- **TypeScript**: Enforce proper typing throughout

### API Route Patterns
- Routes organized by domain in `/src/app/api/`
- Authentication middleware validates all protected endpoints
- Use Zod for request/response validation
- Return consistent error formats

### AI Agent Development
- Agent tools in `src/lib/agent-tools.ts` handle database operations
- Session-based conversation memory for context persistence
- Proper UUID handling - always search for products by name to get IDs
- User context extraction from message format: `[USER_ID: xxx]`

## Environment Setup

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=avatars

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# OpenAI (for AI agent functionality)
OPENAI_API_KEY=your-openai-api-key
```

## Important Implementation Notes

### Authentication Flow
- Multiple auth methods: email/password, magic links, password reset
- Custom password encryption on client-side before transmission
- Middleware handles route protection and redirects
- Email templates configured in Supabase dashboard

### AI Agent Usage
- Chat interface at `/dashboard/chat` provides access to unified agent
- Agent automatically determines when to use inventory tools vs general conversation
- Tools require user authentication and scope data to authenticated user
- Conversation memory maintains context across multiple messages

### Security Considerations
- Row Level Security policies in database
- Client-side password encryption before API calls
- Input validation on both client and server
- Proper error handling without exposing sensitive information

## Testing the Application

### Manual Testing Endpoints
- `GET /api/agent/test?action=products` - Test product retrieval
- `GET /api/agent/test?action=customers` - Test customer retrieval
- `GET /api/agent/test?action=sales` - Test sales data
- `GET /api/agent/test?action=low-stock` - Test inventory reports

### Development Workflow
1. Start development server: `pnpm dev`
2. Access app at `http://localhost:3000`
3. Use `/dashboard/chat` to test AI agent functionality
4. Use Prisma Studio for database inspection
5. Run linting before commits: `pnpm lint`