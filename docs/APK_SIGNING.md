# Insight APK signing guide

Insight ships a debug APK built by GitHub Actions. The debug build is signed with a fixed keystore stored as a GitHub Actions secret, so every release installs as an update over the previous build. This document explains why and how.

## Why the keystore matters

Android treats an installed app as the same app only when **both** of these stay the same:

1. The Android package/application id:

   ```text
   com.msadrashakouri.insight
   ```

2. The signing certificate used to sign the APK.

If you build two APKs with the same package id but different signing certificates, Android refuses to install the newer APK over the existing one:

```text
App not installed
The package conflicts with an existing package by the same name
```

or:

```text
INSTALL_FAILED_UPDATE_INCOMPATIBLE
```

The workflow replaces the auto-generated debug key with a custom fixed keystore from GitHub Secrets, so every debug APK from the same secret installs as an update.

## One-time keystore generation

You need Java installed locally (for `keytool`).

Generate a keystore once:

```bash
keytool -genkeypair -v \
  -keystore insight-debug.jks \
  -storepass android \
  -alias insight \
  -keypass android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Insight, OU=Android, O=MSadraShakouri, L=Warsaw, ST=Mazovia, C=PL"
```

Suggested values:

```text
Keystore file: insight-debug.jks
Store password: android
Key alias: insight
Key password: android
```

Using `android` as the password is common for debug APKs. Do **not** use this debug keystore for a Play Store release build.

## Convert the keystore to base64

GitHub Secrets store text, not binary files. Convert the `.jks` to base64.

### Linux

```bash
base64 -w 0 insight-debug.jks > keystore.b64
```

### macOS

```bash
base64 -i insight-debug.jks | tr -d '\n' > keystore.b64
```

### Windows PowerShell

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("insight-debug.jks")) | Set-Content -NoNewline keystore.b64
```

Copy the full single-line value of `keystore.b64`.

## Add the GitHub secret

In the Insight repository on GitHub:

1. **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**.
3. Add:

```text
Name: ANDROID_KEYSTORE_BASE64
Value: contents of keystore.b64
```

If using the lyrics-app-style debug setup with fixed passwords, this is the only secret the workflow needs because the keystore password and key password are hardcoded to `android`.

## How the workflow uses the secret

`.github/workflows/build.yml` does the following after `npx cap sync android`:

```yaml
- name: Decode keystore
  run: |
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/keystore.jks

- name: Configure Gradle to use custom keystore
  run: |
    cat >> android/app/build.gradle << 'EOF'

    android {
        signingConfigs {
            debug {
                storeFile file('keystore.jks')
                storePassword 'android'
                keyAlias 'insight'
                keyPassword 'android'
            }
        }
        buildTypes {
            debug {
                signingConfig signingConfigs.debug
            }
        }
    }
    EOF
```

Then the standard Capacitor debug build produces `app-debug.apk`, which the workflow renames and attaches to the GitHub release.

## How to check the signing certificate fingerprint

```bash
keytool -list -v \
  -keystore insight-debug.jks \
  -alias insight \
  -storepass android
```

Look for:

```text
SHA256: AA:BB:CC:...
```

That SHA256 fingerprint identifies the signing certificate.

## Important backup advice

Keep these files somewhere private and backed up:

```text
insight-debug.jks
keystore.b64
```

If you lose the keystore, future APKs signed with a new keystore will **not** install as updates over APKs signed with the old one. Your options then are:

1. Uninstall the old app from the device, then install the new APK.
2. Change the Android package id (makes Android treat it as a different app).
3. Recover and reuse the original keystore.

## Debug APK vs release APK

### Debug APK

Best for personal installs, quick GitHub Actions artifacts, and testing on your own devices. Built with:

```bash
./gradlew assembleDebug
```

Output: `app-debug.apk`.

### Release APK

Best for public distribution, GitHub Releases, and long-term app identity. Built with:

```bash
./gradlew assembleRelease
```

Output: `app-release.apk`.

For release signing, do not hardcode passwords in the workflow. Use separate GitHub Secrets:

```text
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

## Recommendation for Insight

```text
Package id:        com.msadrashakouri.insight
Keystore file:     insight-debug.jks
Alias:             insight
Store password:    android
Key password:      android
GitHub secret:     ANDROID_KEYSTORE_BASE64
Build type:        debug
Output name:       insight-debug.apk
```

As long as you keep using the same `ANDROID_KEYSTORE_BASE64`, every new debug APK from GitHub Actions installs over the previous Insight APK on your device.
