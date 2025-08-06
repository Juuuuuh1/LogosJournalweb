import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('Starting Logos Journal v1.0 in production mode...');

// Check if we're in a built environment
const isBuilt = existsSync('./dist/public/index.html');

if (isBuilt) {
  // Production mode with built files
  console.log('Using built assets');
  const server = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('close', (code) => {
    process.exit(code);
  });
} else {
  // Development mode
  console.log('Running in development mode');
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('close', (code) => {
    process.exit(code);
  });
}