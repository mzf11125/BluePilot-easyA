# TWA Build Configuration

This directory contains configuration for building the Trusted Web Activity (TWA) Android app.

## Building the TWA

1. Install Bubblewrap CLI:
   ```bash
   npm install -g @anthropic/bubblewrap
   ```

2. Generate the TWA project:
   ```bash
   bubblewrap init --manifest="https://bluepilot.app/manifest.json"
   ```

3. Build the APK:
   ```bash
   bubblewrap build
   ```

4. Sign the APK:
   ```bash
   jarsigner -keystore my-key.keystore app-release-unsigned.apk my-key-alias
   zipalign -v 4 app-release-unsigned.apk app-release.apk
   ```

## Domain Verification

Ensure the `assetlinks.json` file is hosted at:
```
https://bluepilot.app/.well-known/assetlinks.json
```

Verify your domain:
```bash
bubblewrap check [--url=https://bluepilot.app]
```

## Uploading to Play Store

1. Create a developer account at https://play.google.com/console
2. Create a new app
3. Upload the signed APK
4. Complete the store listing
5. Submit for review

## Play Store Assets

- Icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: At least 2, 320px min dimension

## Configuration Files

- `twa-manifest.json` - TWA-specific manifest
- `assetlinks.json` - Digital Asset Links for domain verification
