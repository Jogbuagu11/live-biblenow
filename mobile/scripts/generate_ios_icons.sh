#!/bin/bash

# Generate all iOS app icon sizes from source image
# Usage: ./scripts/generate_ios_icons.sh

SOURCE_ICON="assets/images/app_icon.png"
ICON_DIR="ios/Runner/Assets.xcassets/AppIcon.appiconset"

# Check if source exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Source icon not found: $SOURCE_ICON"
    exit 1
fi

echo "📱 Generating iOS app icons from $SOURCE_ICON..."

# iPhone icons
sips -z 40 40 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-20x20@2x.png" > /dev/null 2>&1
sips -z 60 60 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-20x20@3x.png" > /dev/null 2>&1
sips -z 29 29 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-29x29@1x.png" > /dev/null 2>&1
sips -z 58 58 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-29x29@2x.png" > /dev/null 2>&1
sips -z 87 87 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-29x29@3x.png" > /dev/null 2>&1
sips -z 80 80 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-40x40@2x.png" > /dev/null 2>&1
sips -z 120 120 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-40x40@3x.png" > /dev/null 2>&1
sips -z 120 120 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-60x60@2x.png" > /dev/null 2>&1
sips -z 180 180 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-60x60@3x.png" > /dev/null 2>&1

# iPad icons
sips -z 20 20 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-20x20@1x.png" > /dev/null 2>&1
sips -z 40 40 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-20x20@2x.png" > /dev/null 2>&1
sips -z 29 29 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-29x29@1x.png" > /dev/null 2>&1
sips -z 58 58 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-29x29@2x.png" > /dev/null 2>&1
sips -z 40 40 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-40x40@1x.png" > /dev/null 2>&1
sips -z 80 80 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-40x40@2x.png" > /dev/null 2>&1
sips -z 76 76 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-76x76@1x.png" > /dev/null 2>&1
sips -z 152 152 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-76x76@2x.png" > /dev/null 2>&1
sips -z 167 167 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-83.5x83.5@2x.png" > /dev/null 2>&1

# App Store icon (1024x1024)
sips -z 1024 1024 "$SOURCE_ICON" --out "$ICON_DIR/Icon-App-1024x1024@1x.png" > /dev/null 2>&1

echo "✅ iOS app icons generated successfully!"
echo "📂 Icons saved to: $ICON_DIR"

