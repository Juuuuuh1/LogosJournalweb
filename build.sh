#!/bin/bash
set -e

echo "Building frontend..."
vite build

echo "Preparing server files..."
mkdir -p dist/server
cp -r server/* dist/server/
cp package.json dist/
cp -r node_modules dist/ 2>/dev/null || echo "Skipping node_modules copy"

echo "Creating production start script..."
cat > dist/start.js << 'EOF'
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

// Start the server using tsx to handle TypeScript
const serverPath = join(__dirname, 'server', 'index.ts');
const server = spawn('tsx', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

server.on('close', (code) => {
  process.exit(code);
});
EOF

echo "Build completed successfully!"