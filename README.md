# AHabit

A minimal, AMOLED-black habit tracker built with Expo/React Native.

## Features
- **Four ways to track a habit**: Yes/No, a numeric goal (e.g. glasses of water), a timer goal, or a checklist of sub-steps
- **Done / Skip** per day (skip = excused, doesn't break your streak)
- **Archive**: manually archive any habit, or bulk-archive everything completed today from the Today tab. Restore or permanently delete from the Archive screen
- Calendar heatmap per habit — tap a day to mark Done, long-press to mark Skipped
- Stats & leaderboard
- **Timer tab**: a normal countdown timer and a Pomodoro timer (25/5/15 min focus-break cycles) in one place
- Local reminder notifications
- **Home-screen widget** — shows today's habits with Done/Skip buttons, no need to open the app
- English + Arabic, with automatic RTL layout switching
- AMOLED black dark mode + light mode, customizable accent color (orange by default)
- Local backup export/import (JSON file via system share sheet / file picker)

---

## Get the APK — step by step

### 1. Upload the project to GitHub correctly
The workflow file must sit at the root of the repo, not inside a subfolder.

Unzip `ahabit.zip` — you'll get a folder called `ahabit/` containing `App.js`, `package.json`, `.github/`, etc. directly inside it.

**Command line (recommended):**
```bash
cd ahabit
git init
git add .
git commit -m "AHabit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

**GitHub website:** create a repo (no README), click "uploading an existing file", then select **everything inside** the unzipped `ahabit` folder (not the folder itself) and drag it in.

### 2. Check Actions are enabled
**Settings → Actions → General → Actions permissions** → "Allow all actions and reusable workflows".

### 3. Watch the build
**Actions** tab → "Build Android APK" runs automatically on push to `main`/`master`, or trigger it manually with "Run workflow".

### 4. Download the APK
When the run finishes (green check), open it → **Artifacts** → download `ahabit-apk`.

### 5. Install
Unzip → `app-release.apk` → transfer to your phone → tap to install (allow "install unknown apps" if prompted).

---

## Adding the home-screen widget
Long-press your home screen → **Widgets** → find **AHabit** → drag "AHabit — Today" onto your home screen.

## Local development
```
npm install
npx expo start
```

Made by Ali Halim.
