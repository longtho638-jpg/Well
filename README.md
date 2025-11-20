
# WellNexus MVP (Seed Stage)

A Hybrid Community Commerce platform for Vietnam, featuring AI coaching and automated tax compliance.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development
```bash
npm run dev
```
Access the app at `http://localhost:5173`.

## 📦 Single File Deployment
For a zero-config, portable version, check `src/SingleFileApp.tsx`. 
You can copy this single file into any React project with `lucide-react` and `recharts` installed to run the entire app logic without the folder structure.

## 🛠 Deployment (Firebase)

This project is configured for Firebase Hosting.

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- A Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)

### Steps
1. **Login to Firebase:**
   ```bash
   firebase login
   ```

2. **Initialize Project:**
   ```bash
   firebase init hosting
   ```
   - Select "Use an existing project".
   - **Public directory:** `dist` (Important for Vite).
   - **Configure as a single-page app:** `Yes`.

3. **Build & Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

## 📂 Project Structure
- `src/components/Dashboard`: Specialized UI cards (Hero, Stats, Charts).
- `src/utils/format.ts`: Vietnam Tax Logic & Currency Formatters.
- `src/data/mockData.ts`: Simulation data for Seed Stage.
- `src/services/geminiService.ts`: AI Integration.

## 🎨 Design System
- **Primary:** Deep Teal (`#00575A`)
- **Accent:** Marigold (`#FFBF00`)
- **Font:** Inter
