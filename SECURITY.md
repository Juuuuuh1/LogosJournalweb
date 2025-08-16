# Security Policy

## API Key Protection

Logos Journal implements comprehensive security measures to protect user API keys:

### Client-Side Security
- API keys are stored only in browser localStorage (never in cookies or session storage)
- Keys are never logged or exposed in client-side debugging
- Keys are transmitted only over HTTPS to the backend

### Server-Side Security
- API keys are never logged in server logs or console output
- Request logging filters out sensitive authentication data
- Journal generation and question generation bypass server entirely (direct OpenAI API calls)
- Image generation still uses server for DALL-E 3 integration
- No persistent storage of API keys on the server
- Sanitized request bodies prevent accidental key exposure

### Network Security
- All API key transmissions use HTTPS encryption
- Keys are sent only in request bodies, never in URLs or headers where they could be cached
- No API keys in error messages or stack traces

### Best Practices
1. Users should never share their OpenAI API keys
2. Keys are validated server-side before use
3. Invalid or expired keys trigger secure error responses
4. The application prompts for new keys if authentication fails

## Data Privacy

- Journal entries are processed server-side but not permanently stored with identifiable information
- Personal reflections are sent to OpenAI only for journal synthesis
- No tracking or analytics on user content
- Session data is ephemeral and cleared on page refresh

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly by contacting the development team.