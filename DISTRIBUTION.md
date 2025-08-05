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

### 4. Static Build for Web Hosting
Build static files for hosting anywhere:
```bash
npm run build
```
Then upload the `dist` folder to any web host.

## Key Features for Distribution
- ✅ No server dependencies (uses in-memory storage)
- ✅ User-provided API keys (no shared credentials)
- ✅ Fully client-side after initial load
- ✅ Modern web technologies (React, TypeScript)
- ✅ Responsive design works on all devices

## Recommended Distribution Methods
1. **GitHub Releases** - Host ZIP files and provide installation instructions
2. **Electron** - Cross-platform desktop app (Windows, Mac, Linux)
3. **Web Host** - Deploy static build to Netlify, Vercel, or similar
4. **App Stores** - Use Electron to distribute through Microsoft Store, Mac App Store

## User Requirements
- Node.js (for local development)
- OpenAI API key (user provides their own)
- Modern web browser