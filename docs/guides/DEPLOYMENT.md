# WellNexus Deployment & Testing Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Development](#development)
4. [Testing](#testing)
5. [Building](#building)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)
8. [Phase 2 Features](#phase-2-features)

---

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd Well

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app running.

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Emulators (for local development)
VITE_USE_FIREBASE_EMULATORS=false

# Google Gemini AI API Key (optional - for AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting API Keys

#### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings > General
4. Scroll to "Your apps" section
5. Add a web app if you haven't
6. Copy the configuration values

#### Google Gemini AI
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy the API key
5. Add to `.env` as `VITE_GEMINI_API_KEY`

**Important:** Never commit `.env` file to version control!

---

## Development

### Running Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` with hot module replacement (HMR).

---

## Testing

### Test Suite

The project uses **Vitest** with React Testing Library for comprehensive testing.

#### Running Tests

```bash
# Watch mode (default) - runs tests on file changes
npm test

# Run tests once
npm run test:run

# Interactive UI mode
npm run test:ui

# Generate coverage report
npm run test:coverage
```

**Current Coverage:** 13 tests passing ✅

---

## Building

### Production Build

```bash
npm run build
```

This outputs to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Deployment

### Vercel Deployment (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel Dashboard
3. Push to main branch - auto-deploys

#### Vercel Configuration

The `vercel.json` ensures SPA routing works correctly with rewrites to `/index.html`.

### Firebase Hosting

```bash
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## Troubleshooting

### Menu Navigation Issues

**Fixed in latest version:** All navigation paths now correctly include `/dashboard` prefix.

If issues persist:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Verify latest deployment

### Environment Variables Not Loading

- Variables must start with `VITE_`
- Restart dev server after changing `.env`
- Set variables in deployment platform dashboard for production

---

## Phase 2 Features

All Phase 2 Growth features are **fully implemented** ✅

### 1. The Copilot (AI Sales Assistant)

**Route:** `/dashboard/copilot`

Features:
- Real-time objection handling
- AI-powered response suggestions
- Sales script generation
- Coaching feedback

### 2. Leader Dashboard

**Route:** `/dashboard/team`

Features:
- Team member overview
- Performance metrics & charts
- Search and filter
- Export functionality

### 3. Referral System

**Route:** `/dashboard/referral`

Features:
- Unique referral link
- Multi-channel sharing
- Tracking and analytics
- Bonus calculation

---

## Production Checklist

- [ ] All API keys in environment variables
- [ ] Production build tested
- [ ] All tests passing
- [ ] SPA routing configured
- [ ] Cross-browser tested

---

**Last Updated:** 2025-11-21
