# Overview

This is a philosophical journaling application that uses AI to guide users through daily reflection. The app generates thoughtful philosophical questions, collects user responses, and synthesizes them into a personalized journal entry using OpenAI's API. It features a clean, contemplative interface built with React and shadcn/ui components, with a Node.js/Express backend.

## Recent Changes (August 2025)
- Fixed deployment issues for production mode
- Improved error handling to prevent server crashes in production
- Enhanced NODE_ENV detection for proper development/production mode switching
- Added comprehensive sharing functionality for journal entries (copy, Twitter, email, Instagram)
- Implemented download and share features for generated artwork and sketches
- Added Instagram sharing with optimized captions and hashtags for both text and images

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom contemplative color palette
- **State Management**: React Query (@tanstack/react-query) for server state and local React state for UI
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints for OpenAI integration and journal management
- **Request Validation**: Zod schemas for type-safe API validation
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Hot reload with tsx and Vite integration

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL via @neondatabase/serverless
- **Schema Management**: Drizzle Kit for migrations and schema management
- **In-Memory Fallback**: MemStorage class for development/testing without database
- **Session Storage**: connect-pg-simple for PostgreSQL-backed sessions

## Authentication & Security
- **API Security**: OpenAI API key validation and secure storage in localStorage
- **Input Validation**: Comprehensive Zod schemas for all API endpoints
- **CORS**: Configured for development environment
- **Environment Variables**: Secure configuration management for database and API credentials

## External Dependencies
- **OpenAI Integration**: GPT-4o model for generating philosophical questions and synthesizing journal entries
- **Database Provider**: Neon Database for serverless PostgreSQL hosting
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **Date Handling**: date-fns for date manipulation and formatting
- **Development Tools**: Replit-specific plugins for enhanced development experience