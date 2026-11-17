# Photos — Native Apple macOS Gallery App

An ultra-refined, 100% Apple macOS Gallery and Photo Browser built with Electron, React 19, TypeScript, Tailwind CSS, and Motion.

Inspired directly by Apple Photos on macOS Tahoe and Apple Human Interface Guidelines (HIG).

---

## ✨ Features

- **100% Apple macOS Visual Grammar**:
  - Translucent liquid frosted glass sidebar (`backdrop-blur-2xl`) with native macOS vibrancy
  - Apple traffic lights window controls with `hiddenInset` titlebar
  - Apple Photos segmented control: `Days` | `Months` | `Years` | `All Photos` with animated sliding pill indicator
  - Fluid thumbnail zoom slider with tactile Apple glass lens styling
  - Uniform square vs natural aspect ratio grid toggle
  - Apple SF Pro / system font stack and Cupertino design tokens
  - Dark Mode, Light Mode, and Auto System appearance

- **Smart Mac Media Scanner**:
  - Automatically scans and indexes:
    - `~/Pictures`
    - `~/Desktop` (where Mac screenshots often land)
    - `~/Downloads`
    - `~/Movies`
    - Any custom folder or external drive
  - Fast thumbnail generation via built-in macOS `sips` (for photos/HEIC) and `qlmanage` (for videos) with persistent caching
  - Categorized Views:
    - **All**: All media
    - **Photos**: Still photography
    - **Videos**: Motion clips with duration badges
    - **Screenshots**: Automatic macOS screenshot detection
    - **Screen Recordings**: macOS screen recording detection
    - **Panoramas**: Wide aspect-ratio photos
    - **Animations & GIFs**: Animated media
    - **Favorites**: Heart-favorited media
    - **Recents**: Media added / captured in the last 7 days
    - **Mac Folders**: Quick access by folder

- **Apple Quick Look & Lightbox**:
  - Full-screen high-resolution viewer with ambient backdrop blur
  - Deep zoom in/out, pan, and 90° rotation
  - Custom Apple Video Player with floating glass controls, scrubber, time display, loop, and mute
  - Bottom filmstrip scrubber for rapid browsing across adjacent media
  - Full keyboard shortcuts (`←` / `→` navigate, `Space` play/pause, `Esc` close, `F` favorite, `I` inspector)

- **macOS "Get Info" Inspector (`⌘I`)**:
  - Shows file name, format, creation & modification date
  - Resolution, megapixels, and file size
  - Camera / device and category tags
  - Direct "Show in Finder" and "Open with Preview" buttons

- **Batch Organization & Albums**:
  - Multi-select items across dates
  - Batch favorite, delete to macOS Trash, or organize into custom Albums

---

## 🚀 Running the App

### 1. Install dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```

### 3. Launch Native macOS Electron App
```bash
npm run electron:start
```

### 4. Build macOS Apple Silicon DMG
```bash
npm run dist:dmg
```
