#!/bin/bash

# Script to generate app icons from 1.png
# This script uses sips (macOS) to resize the icon for iOS
# For Android, flutter_launcher_icons will handle it

echo "Generating app icons..."

SOURCE_ICON="../public/1.png"
IOS_ICON_DIR="ios/Runner/Assets.xcassets/AppIcon.appiconset"

if [ ! -f "$SOURCE_ICON" ]; then
    echo "Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Generate iOS icons using sips
echo "Generating iOS icons..."
sips -z 40 40 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-40x40@1x.png"
sips -z 80 80 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-40x40@2x.png"
sips -z 120 120 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-40x40@3x.png"
sips -z 60 60 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-60x60@2x.png"
sips -z 180 180 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-60x60@3x.png"
sips -z 58 58 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-29x29@2x.png"
sips -z 87 87 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-29x29@3x.png"
sips -z 29 29 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-29x29@1x.png"
sips -z 40 40 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-20x20@2x.png"
sips -z 60 60 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-20x20@3x.png"
sips -z 20 20 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-20x20@1x.png"
sips -z 76 76 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-76x76@1x.png"
sips -z 152 152 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-76x76@2x.png"
sips -z 167 167 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-83.5x83.5@2x.png"
sips -z 1024 1024 "$SOURCE_ICON" --out "$IOS_ICON_DIR/Icon-App-1024x1024@1x.png"

echo "iOS icons generated successfully!"
echo ""
echo "For Android icons, run:"
echo "  cd mobile"
echo "  flutter pub get"
echo "  flutter pub run flutter_launcher_icons"

