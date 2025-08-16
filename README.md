# Logos Journal

An AI-powered philosophical journaling platform that transforms daily reflection into a personalized, multi-modal experience. Generate thoughtful questions, synthesize personal insights, and create visual representations of your philosophical journey.

![Logos Journal](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

### 🤔 AI-Powered Question Generation
- Dynamic philosophical questions adapted to your responses
- Context-aware follow-up questions for deeper reflection
- Covers themes of meaning, values, growth, and human experience

### 📝 Intelligent Journal Synthesis
- Transforms multiple-choice and written responses into coherent narratives
- Maintains philosophical depth while incorporating personal insights
- Generates 200-400 word thoughtful journal entries
- 42 curated philosophical quotes from Ancient to Contemporary thinkers
- User-controlled quote changes with session deduplication

### 🎨 Multi-Modal Content Creation
- **Artwork Generation**: Realistic visual representations using DALL-E 3
- **Sketch Generation**: Hand-drawn style philosophical illustrations
- Multiple artistic styles with clean, professional output

### 🔍 Smart Image Search Integration
- Intelligent keyword extraction from journal content
- Direct access to non-copyrighted image sites (Unsplash, Pixabay, Pexels, etc.)
- Filters out common words to focus on meaningful search terms

### 📤 Comprehensive Sharing System
- Copy journal entries to clipboard
- Share on Twitter with optimized formatting
- Email sharing with professional presentation
- Download generated artwork and sketches
- Instagram sharing with relevant hashtags

### 🔒 Security & Privacy
- Client-side API key storage
- No data persistence of personal content
- Secure environment variable management
- Input validation and sanitization
- Automated secret scanning with TruffleHog OSS
- Static code analysis with Semgrep for security vulnerabilities

## Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key
- PostgreSQL database (optional, falls back to in-memory storage)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/logos-journal.git
cd logos-journal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```bash
# Database (optional)
DATABASE_URL=your_postgresql_connection_string

# Development settings
NODE_ENV=development
```

4. **Start the application**
```bash
npm run dev
```

5. **Access the application**
Open your browser to `http://localhost:5000`

### Getting Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new secret key
5. Enter the key when prompted in the application

## Usage Guide

### Starting a Reflection Session

1. **Enter your OpenAI API key** when prompted
2. **Begin reflection** - the app generates your first philosophical question
3. **Choose responses** from multiple-choice options or write custom answers
4. **Continue through 5 questions** that adapt based on your previous responses
5. **Add final thoughts** (optional) for additional personal insights
6. **Generate your journal** - AI synthesizes your responses into a coherent entry

### Creating Visual Content

After confirming your journal entry:

- **Generate Artwork**: Creates realistic visual representations of your experiences
- **Generate Sketch**: Produces hand-drawn style philosophical illustrations  
- **Search Images**: Opens curated non-copyrighted image sites with smart keyword extraction

### Sharing Your Reflection

- **Copy to clipboard** for pasting elsewhere
- **Share on social media** with optimized formatting
- **Email** with professional presentation
- **Download images** for personal use

## Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with shadcn/ui components
- **React Query** for server state management

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Zod** for runtime validation
- **OpenAI integration** for AI services

### AI Integration
- **GPT-4o** for question generation and journal synthesis
- **DALL-E 3** for artwork and sketch creation
- **Smart prompt engineering** for consistent, high-quality outputs

## Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Express backend
│   ├── services/          # External service integrations
│   ├── routes.ts          # API endpoint definitions
│   └── storage.ts         # Database abstraction layer
├── shared/                # Shared TypeScript schemas
└── docs/                  # Documentation
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript checking
```

### Environment Configuration

The application automatically detects the environment and configures itself accordingly:

- **Development**: Hot reload, detailed error messages, in-memory storage fallback
- **Production**: Optimized builds, error handling, database persistence

## API Integration

### Direct OpenAI Integration
- All question generation and journal synthesis happens directly from frontend to OpenAI API
- Eliminates server-side processing for better performance and security
- Users provide their own OpenAI API keys for complete control

### Server Endpoints
- `POST /api/validate-key` - Validate OpenAI API key format
- `POST /api/generate-image` - Generate artwork using DALL-E 3
- `POST /api/find-image` - Search for relevant images with smart keyword extraction

## Deployment

### Replit Deployment (Recommended)
1. The project is pre-configured for Replit
2. Set environment variables in Replit Secrets
3. Use the "Deploy" button for production deployment

### Manual Deployment
1. Build the project: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`
4. Configure reverse proxy (nginx recommended)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **OpenAI** for GPT-4o and DALL-E 3 models
- **Radix UI** for accessible component primitives
- **shadcn/ui** for beautiful, customizable components
- **Vercel** for inspiration in modern web development practices

## Support

For questions, issues, or contributions:

- Open an issue on GitHub
- Check the [Technical Documentation](TECHNICAL_DOCUMENTATION.md) for detailed architecture information
- Review the [Deployment Guide](DEPLOYMENT.md) for hosting instructions

---

**Logos Journal** - Transform your daily reflection into a journey of philosophical discovery.