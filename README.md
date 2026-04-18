# karretje 🛒

Budget app — slim uitgeven, meer overhouden.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Build

```bash
npm run build
```

## iOS (Capacitor)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/haptics
npx cap init karretje nl.karretje.app
npx cap add ios
npm run build
npx cap sync
npx cap open ios
```

## Firebase sync

Add your Firebase config to `src/App.jsx` to enable live sync between devices.

Config is already prepared — just uncomment the Firebase imports and add your credentials.

## Tech stack

- React + Vite
- Recharts
- Firebase (optional sync)
- Capacitor (iOS)
