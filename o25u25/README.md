# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Running on Android device (Windows)

If you see **"Failed to resolve the Android SDK path"** or **"'adb' is not recognized"** when running `npx expo run:android --device`:

1. **Install Android Studio** (if you haven't): [developer.android.com/studio](https://developer.android.com/studio). During setup, install the **Android SDK**.
2. **Find your SDK path**  
   In Android Studio: **File → Settings → Appearance & Behavior → System Settings → Android SDK**. The path at the top is your SDK path (often `C:\Users\<You>\AppData\Local\Android\Sdk`).
3. **Set ANDROID_HOME for this terminal** (PowerShell):
   ```powershell
   $env:ANDROID_HOME = "C:\Users\Keval\AppData\Local\Android\Sdk"
   $env:Path += ";$env:ANDROID_HOME\platform-tools"
   ```
   Replace the path with your actual SDK path if it's different.
4. **Set it permanently (optional)**  
   Windows: **Settings → System → About → Advanced system settings → Environment Variables**. Add a new **User** variable: name `ANDROID_HOME`, value = your SDK path. Then add `%ANDROID_HOME%\platform-tools` to the **Path** variable.
5. Run again:
   ```bash
   npx expo run:android --device
   ```

## Map

The run map is temporarily removed (placeholder shown). It can be added back later (e.g. with react-native-maps-osmdroid or another map solution).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
