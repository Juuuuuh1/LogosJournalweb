# Overview

Logos Journal v1.0 - A philosophical journaling application that uses AI to guide users through daily reflection. The app generates thoughtful philosophical questions, collects user responses, and synthesizes them into a personalized journal entry using OpenAI's API. It features a clean, contemplative interface built with React and shadcn/ui components, with a Node.js/Express backend.

## Version 1.0 Release (August 2025)
**Core Features Completed:**
- AI-powered philosophical question generation and journal synthesis
- Hand-drawn sketch generation (manga/anime and American comic styles)
- Comprehensive sharing system (copy, Twitter, email, Instagram) for both text and images
- Secure API key management with browser-only storage
- Download functionality for journal entries and generated artwork
- Revision system for both journal entries and visual content
- Production-ready deployment with proper error handling
- External image search integration with non-copyrighted image sites
- Complete demo mode for video creation and demonstrations

**Technical Achievements:**
- Fixed deployment issues for production mode
- Improved error handling to prevent server crashes in production
- Enhanced NODE_ENV detection for proper development/production mode switching
- Implemented multi-modal AI integration (GPT-4o and DALL-E 3)
- Added Instagram sharing with optimized captions and hashtags for both text and images
- Replaced integrated image search with popup menu directing to external non-copyrighted sites
- Enhanced AI image generation prompts: artwork avoids text, sketches prefer visual storytelling with minimal but highly readable text when essential
- Implemented smart keyword extraction that prioritizes nouns over verbs/adjectives/time words for image search
- Added TruffleHog OSS GitHub Actions for automated secret scanning and security monitoring
- Enhanced Next button validation to prevent question skipping during AI generation delays
- Integrated Semgrep static code analysis for comprehensive security vulnerability detection
- **Code Cleanup (January 2025)**: Removed 30+ unused UI components and 25+ unused dependencies, reducing bundle size significantly
- **Demo Mode Implementation**: Added comprehensive demo mode with pre-filled responses and disabled inputs for perfect video demonstrations
- **Security Enhancements (August 2025)**: Comprehensive API key protection with secure logging, filtered server responses, and session quote consistency fixes
- **Architecture Optimization (August 2025)**: Moved all OpenAI operations to frontend, cleaned up unused server routes, removed obsolete build files, fixed progress indicator display

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
- **API Design**: Lightweight endpoints for validation and auxiliary services
- **Request Validation**: Zod schemas for type-safe API validation
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Hot reload with tsx and Vite integration
- **OpenAI Integration**: Direct frontend-to-OpenAI API calls for journal generation and revision

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