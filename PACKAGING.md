# Packaging SmartCultivation

This project can now be packaged for:

- Windows via Electron
- Android via Capacitor

## Production API

Set the frontend to your hosted backend before packaging:

```env
REACT_APP_API_URL=https://smartcultivation-server.onrender.com
```

The repo already includes that value in `.env`. For a dedicated production file, copy:

```powershell
Copy-Item .env.production.example .env.production
```

## Windows build

1. Build the app bundle used for native packaging:

```powershell
npm run build:app
```

2. Package the Windows desktop app:

```powershell
npx electron-builder --win portable
```

The unpacked Windows app is created in:

- `release/win-unpacked`

3. Create the download zip expected by the home page:

```powershell
npm run desktop:zip
```

This creates:

- `public/downloads/smartcultivation-windows.zip`

## Android build

1. Build the packaged web assets:

```powershell
npm run build:app
```

2. Sync the web app into the Android project:

```powershell
npm run android:sync
```

If Windows reports `EPERM` during sync, close any Explorer windows, terminals, or Android Studio tabs that are open inside the `android/` folder and run the sync again.

3. Open the Android project:

```powershell
npm run android:open
```

4. In Android Studio:

- Wait for Gradle sync to finish
- Open `Build > Generate Signed Bundle / APK`
- Choose `APK`
- Build a debug or signed release APK

The APK is typically created under:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/apk/release/app-release.apk`

5. Copy the generated APK into the public downloads folder:

```powershell
New-Item -ItemType Directory -Force -Path public/downloads
Copy-Item android/app/build/outputs/apk/release/app-release.apk public/downloads/smartcultivation-android.apk
```

## Notes

- The packaged apps still depend on your Render backend being online.
- The current Windows packaging was verified up to `release/win-unpacked` in this workspace.
- Android packaging was scaffolded successfully, but final APK generation must be completed in Android Studio.
