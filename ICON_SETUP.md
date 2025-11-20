# Icon and Logo Setup

This document describes how the app icons and logos are configured.

## Mobile App Icons (iOS & Android)

### Source Image
- **File**: `public/1.png` (938x938 PNG)
- **Usage**: App icon for both iOS and Android mobile apps

### iOS Icons
- **Location**: `mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/`
- **Generated sizes**: All required iOS icon sizes (20x20 to 1024x1024)
- **Generation**: Icons were generated using the `generate_icons.sh` script which uses macOS `sips` command

### Android Icons
- **Location**: `mobile/android/app/src/main/res/mipmap-*/`
- **Generated sizes**: All required Android launcher icon sizes
- **Generation**: Icons are generated using `flutter_launcher_icons` package

### To Regenerate Icons

**iOS:**
```bash
cd mobile
bash generate_icons.sh
```

**Android:**
```bash
cd mobile
flutter pub get
flutter pub run flutter_launcher_icons
```

**Both:**
```bash
cd mobile
bash generate_icons.sh
flutter pub get
flutter pub run flutter_launcher_icons
```

## Web App Favicon and Logo

### Source Image
- **File**: `public/2.png` (938x938 PNG)
- **Usage**: Favicon and logo for the web application

### Favicon Configuration
- **Location**: Referenced in `index.html`
- **Files**:
  - `/2.png` - Main favicon
  - `/favicon.png` - Alternative favicon reference
  - `/logo.png` - Logo file for use in the app

### Logo in Web App
- **Location**: Displayed on the home page (`src/pages/Index.tsx`)
- **Usage**: Logo appears in the hero section above the main heading

### HTML References
The following favicon links are configured in `index.html`:
```html
<link rel="icon" type="image/png" href="/2.png" />
<link rel="apple-touch-icon" href="/2.png" />
<link rel="shortcut icon" href="/2.png" />
```

## File Structure

```
TMWY/
├── public/
│   ├── 1.png          # Mobile app icon source (938x938)
│   ├── 2.png          # Web favicon/logo source (938x938)
│   ├── favicon.png    # Copy of 2.png
│   └── logo.png       # Copy of 2.png
├── mobile/
│   ├── assets/images/
│   │   └── app_icon.png  # Copy of 1.png for flutter_launcher_icons
│   ├── ios/Runner/Assets.xcassets/AppIcon.appiconset/
│   │   └── [All iOS icon sizes]
│   └── android/app/src/main/res/mipmap-*/
│       └── [All Android icon sizes]
└── src/pages/Index.tsx  # Web app logo usage
```

## Notes

- The source images (1.png and 2.png) are 938x938 pixels, which is ideal for generating all required sizes
- iOS requires specific sizes for different devices and contexts
- Android uses adaptive icons with foreground and background layers
- The web favicon should ideally be 32x32 or 16x16, but modern browsers handle larger PNGs well
- For production, consider creating optimized favicon.ico files in multiple sizes

