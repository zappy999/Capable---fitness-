# capable ios/android

This project was created with Shipper.

## Tech Stack

- **Framework:** Expo (React Native)
- **Router:** expo-router
- **Styling:** NativeWind (Tailwind CSS)
- **Language:** TypeScript
- **Package Manager:** npm

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [Git](https://git-scm.com/)
- One of the following for running the app:
  - [Expo Go](https://expo.dev/client) on your phone (quickest)
  - Android Studio emulator
  - iOS Simulator (macOS only)
  - A modern browser (for web target)

## Getting Started

### 1. Clone and switch to your working branch

```bash
git clone https://github.com/zappy999/Capable---fitness-.git
cd Capable---fitness-
git fetch origin
git checkout main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

Pick the target you want:

```bash
npm start          # Expo dev server (shows a QR code for Expo Go)
npm run web        # open in your browser
npm run android    # open in an Android emulator
npm run ios        # open in iOS Simulator (macOS only)
```

The application will start and display the local URL / QR code in your terminal.

### 4. Stop the dev server

Press `Ctrl+C` in the terminal (twice if it doesn't stop on the first try).

## Pulling the Latest Changes

```bash
git checkout main
git pull origin main
npm install        # re-run if dependencies changed
npm start
```

### Troubleshooting pulls

If `git pull` fails with *"untracked working tree files would be overwritten by merge"* (commonly `.gitignore` or `package-lock.json`), those files exist locally but aren't tracked. Either delete them:

```bash
# macOS / Linux
rm .gitignore package-lock.json

# Windows PowerShell
del .gitignore, package-lock.json
```

...or back them up first (`mv file file.bak`) if you've made local changes you want to keep. Then re-run `git pull origin main`.

## Available Scripts

- `npm start` - Start the Expo dev server
- `npm run web` - Run the app in a web browser
- `npm run android` - Run the app on an Android emulator / device
- `npm run ios` - Run the app on iOS Simulator (macOS only)

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [expo-router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with Shipper (https://shipper.now)
