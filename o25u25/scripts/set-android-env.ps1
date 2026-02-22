# Set ANDROID_HOME for the current PowerShell session so expo run:android can find the SDK and adb.
# Edit the path below if your Android SDK is elsewhere (check Android Studio: File -> Settings -> Android SDK).

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $sdkPath)) {
  Write-Host "Android SDK not found at: $sdkPath" -ForegroundColor Yellow
  Write-Host "Install Android Studio or set the path in this script to your SDK location." -ForegroundColor Yellow
  exit 1
}

$env:ANDROID_HOME = $sdkPath
$env:Path = "$sdkPath\platform-tools;$env:Path"
Write-Host "ANDROID_HOME set to: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host "You can now run: npx expo run:android --device" -ForegroundColor Green
