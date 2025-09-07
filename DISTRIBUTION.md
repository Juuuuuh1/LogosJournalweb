# Distribution Guide for Logos-Journal

## Overview
Logos-Journal is a standalone philosophical journaling app that can be distributed in multiple ways. The app is completely self-contained and only requires users to provide their own OpenAI API key.

## Distribution Options

### 1. Download Source Code
Users can download the ZIP file from Replit and run locally:
```bash
npm install
npm run dev
```

### 2. Desktop App (Electron)
Package as a cross-platform desktop application:

**Setup:**
```bash
npm install electron electron-builder --save-dev
```

**Add to package.json:**
```json
{
  "main": "electron.js",
  "homepage": "./",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5000 && electron .\"",
    "build-electron": "npm run build && electron-builder",
    "dist": "npm run build && electron-builder --publish=never"
  },
  "build": {
    "appId": "com.logosjournal.app",
    "productName": "Logos Journal",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "electron.js",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

**Create electron.js:**
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);
```

### 3. Progressive Web App (PWA)
Add PWA capabilities for mobile/offline use:

**Add to index.html:**
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#14b8a6">
```

**Create manifest.json:**
```json
{
  "name": "Logos Journal",
  "short_name": "LogosJournal",
  "description": "Philosophical journaling with AI-generated questions",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#14b8a6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 4. Full-Stack Deployment
Deploy the complete application with both frontend and backend:
```bash
npm run build
npm start
```
This app requires a Node.js server for the Express backend and database connectivity.

## Key Features for Distribution
- ✅ PostgreSQL database support with Neon Database (or in-memory fallback)
- ✅ User-provided API keys (no shared credentials)
- ✅ Optimized architecture with direct OpenAI integration from frontend
- ✅ Modern web technologies (React, TypeScript, Express)
- ✅ Responsive design works on all devices
- ✅ Demo mode for presentations and video creation
- ✅ Cleaned codebase with minimal dependencies

## Recommended Distribution Methods
1. **GitHub Releases** - Host ZIP files and provide installation instructions
2. **Electron** - Cross-platform desktop app (Windows, Mac, Linux)
3. **Cloud Platforms** - Deploy to Replit, Railway, Render, or similar Node.js hosts
4. **Self-Hosted** - Run on personal servers with PostgreSQL database
5. **App Stores** - Use Electron to distribute through Microsoft Store, Mac App Store

## User Requirements
- Node.js (for local development/hosting)
- PostgreSQL database (or uses in-memory fallback)
- OpenAI API key (user provides their own)
- Modern web browser

## Environment Variables
Required for production deployment:
- `DATABASE_URL` - PostgreSQL connection string (required for migrations and CI, optional for in-memory fallback)
- `NODE_ENV` - Set to "production" for production builds
