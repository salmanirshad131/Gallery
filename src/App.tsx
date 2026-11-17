import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FolderSync,
  FolderPlus,
  Trash2,
  HardDrive,
  Images,
  Monitor,
  ArrowDownCircle,
  Clapperboard,
  Folder,
  Palette,
  User,
  ShieldCheck,
  Zap,
  Heart,
  Clock,
  Camera,
  Video,
  Maximize2,
  Sparkles,
  Plus,
  Film,
  RotateCcw,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
  Info,
  Sliders,
  Check,
  CheckSquare,
  ChevronLeft,
} from 'lucide-react';
import { ModernAppleVideoPlayer } from './components/ModernAppleVideoPlayer';
import {
  Album,
  FolderScanConfig,
  GallerySettings,
  MediaItem,
  ScannedFolderInfo,
  ThemeMode,
} from './types/gallery';
import { formatDateFull, formatFileSize, indexMediaItem } from './utils/formatters';

const SETTINGS_KEY = 'apple_gallery_settings_v1';
const FAVORITES_KEY = 'apple_gallery_favorites_v1';
const ALBUMS_KEY = 'apple_gallery_albums_v1';
const LIBRARY_KEY = 'apple_gallery_library_v1';

// Rich Curated Photos covering all media types & default Mac folders
const CURATED_SAMPLE_PHOTOS: MediaItem[] = [
  { id: '1', filename: 'Emerald Valley', filePath: '', fileSize: 4200000, fileUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85', category: 'photo', format: 'HEIF', mimeType: 'image/jpeg', createdAt: Date.now() - 2 * 86400000, modifiedAt: Date.now() - 2 * 86400000, favorite: true, folderPath: '/Pictures', folderName: 'Pictures', camera: 'iPhone 16 Pro • 24mm f/1.78', width: 4032, height: 3024 },
  { id: '2', filename: 'Warm Atrium', filePath: '', fileSize: 6800000, fileUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85', category: 'photo', format: 'HEIF', mimeType: 'image/jpeg', createdAt: Date.now() - 4 * 86400000, modifiedAt: Date.now() - 4 * 86400000, favorite: true, folderPath: '/Pictures', folderName: 'Pictures', camera: 'Leica Q3 • 28mm f/2.0', width: 6000, height: 4000 },
  { id: '3', filename: 'Tidal Horizon Coast', filePath: '', fileSize: 3900000, fileUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85', category: 'panorama', format: 'JPEG', mimeType: 'image/jpeg', createdAt: Date.now() - 6 * 86400000, modifiedAt: Date.now() - 6 * 86400000, favorite: false, folderPath: '/Pictures', folderName: 'Pictures', camera: 'iPhone 16 Pro • Panorama Mode', width: 8000, height: 3200 },
  { id: '4', filename: 'Misty Alpine Ridge', filePath: '', fileSize: 7400000, fileUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85', category: 'photo', format: 'RAW', mimeType: 'image/jpeg', createdAt: Date.now() - 8 * 86400000, modifiedAt: Date.now() - 8 * 86400000, favorite: true, folderPath: '/Pictures', folderName: 'Pictures', camera: 'Sony A7C II • 35mm f/1.8', width: 7008, height: 4672 },
  { id: '5', filename: 'Clean UI Mockup', filePath: '', fileSize: 2100000, fileUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1400&q=85', category: 'screenshot', format: 'PNG', mimeType: 'image/png', createdAt: Date.now() - 10 * 86400000, modifiedAt: Date.now() - 10 * 86400000, favorite: false, folderPath: '/Desktop', folderName: 'Desktop', camera: 'macOS Screen Capture', width: 2880, height: 1800 },
  { id: '6', filename: 'Architecture Reel 4K', filePath: '', fileSize: 18200000, fileUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85', category: 'video', format: 'MOV', mimeType: 'video/quicktime', createdAt: Date.now() - 12 * 86400000, modifiedAt: Date.now() - 12 * 86400000, favorite: true, folderPath: '/Movies', folderName: 'Movies', camera: 'Sony FX3 • ProRes 422', width: 3840, height: 2160 },
  { id: '7', filename: 'Screen Recording Session', filePath: '', fileSize: 12400000, fileUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=85', category: 'screen_recording', format: 'MOV', mimeType: 'video/quicktime', createdAt: Date.now() - 14 * 86400000, modifiedAt: Date.now() - 14 * 86400000, favorite: false, folderPath: '/Movies', folderName: 'Movies', camera: 'QuickTime Player Screen Record', width: 2560, height: 1600 },
  { id: '8', filename: 'Motion Wave Loop', filePath: '', fileSize: 5200000, fileUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1400&q=85', category: 'gif', format: 'GIF', mimeType: 'image/gif', createdAt: Date.now() - 16 * 86400000, modifiedAt: Date.now() - 16 * 86400000, favorite: false, folderPath: '/Downloads', folderName: 'Downloads', camera: 'Animated GIF Asset', width: 1200, height: 1200 },
  { id: '9', filename: 'Pine Forest Mist', filePath: '', fileSize: 4800000, fileUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85', category: 'photo', format: 'HEIF', mimeType: 'image/jpeg', createdAt: Date.now() - 18 * 86400000, modifiedAt: Date.now() - 18 * 86400000, favorite: false, folderPath: '/Pictures', folderName: 'Pictures', camera: 'iPhone 16 Pro • 13mm f/2.2', width: 4032, height: 3024 },
  { id: '10', filename: 'Soft Desert Dunes', filePath: '', fileSize: 7100000, fileUrl: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1400&q=85', category: 'photo', format: 'RAW', mimeType: 'image/jpeg', createdAt: Date.now() - 21 * 86400000, modifiedAt: Date.now() - 21 * 86400000, favorite: false, folderPath: '/Pictures', folderName: 'Pictures', camera: 'Sony A7C II • 50mm f/1.4', width: 7008, height: 4672 },
  { id: '11', filename: 'Glacial Reflections', filePath: '', fileSize: 4400000, fileUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85', category: 'photo', format: 'HEIF', mimeType: 'image/jpeg', createdAt: Date.now() - 25 * 86400000, modifiedAt: Date.now() - 25 * 86400000, favorite: false, folderPath: '/Pictures', folderName: 'Pictures', camera: 'iPhone 16 Pro • 24mm f/1.78', width: 4032, height: 3024 },
  { id: '12', filename: 'Morning Cloud Canopy', filePath: '', fileSize: 4100000, fileUrl: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1400&q=85', thumbnailUrl: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1400&q=85', category: 'photo', format: 'HEIF', mimeType: 'image/jpeg', createdAt: Date.now() - 28 * 86400000, modifiedAt: Date.now() - 28 * 86400000, favorite: false, folderPath: '/Pictures', folderName: 'Pictures', camera: 'iPhone 16 Pro • 77mm f/2.8', width: 4032, height: 3024 },
];

// Memoized Photo Card with High-Precision Gestures (Short Tap, Double Tap, Long Press Hold)
interface PhotoCardProps {
  photo: MediaItem;
  isSelected: boolean;
  isFav: boolean;
  filterStyle: string;
  onSingleTap: (photo: MediaItem) => void;
  onDoubleTap: (photo: MediaItem) => void;
  onLongPress: (photo: MediaItem) => void;
  onToggleFav: (id: string, e: React.MouseEvent) => void;
}

const PhotoCard = React.memo(function PhotoCard({
  photo,
  isSelected,
  isFav,
  filterStyle,
  onSingleTap,
  onDoubleTap,
  onLongPress,
  onToggleFav,
}: PhotoCardProps) {
  const pointerDownRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    didLongPressRef.current = false;

    // ~450ms press triggers Selection Mode on this photo
    longPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      onLongPress(photo);
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const dx = Math.abs(e.clientX - pointerDownRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownRef.current.y);
    // User is scrolling the 10k photo feed -> cancel long press
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (didLongPressRef.current) {
      pointerDownRef.current = null;
      return;
    }

    if (!pointerDownRef.current) return;
    const dx = Math.abs(e.clientX - pointerDownRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownRef.current.y);
    pointerDownRef.current = null;

    if (dx > 8 || dy > 8) return; // Drag/scroll gesture

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap detected -> Open Info Inspector
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      onDoubleTap(photo);
    } else {
      // Single tap candidate -> Debounce 220ms
      lastTapRef.current = now;
      singleTapTimerRef.current = setTimeout(() => {
        onSingleTap(photo);
        singleTapTimerRef.current = null;
      }, 220);
    }
  };

  const handlePointerCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerDownRef.current = null;
  };

  return (
    <article
      className={`photo-card ${isSelected ? 'selected' : ''}`}
      data-id={photo.id}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ userSelect: 'none' }}
    >
      <img
        src={photo.thumbnailUrl || photo.fileUrl}
        alt={photo.filename || ''}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{ filter: filterStyle, pointerEvents: 'none' }}
      />
      <div className="card-badges">
        {photo.category === 'video' || photo.category === 'screen_recording' ? (
          <span className="glass-chip">VIDEO</span>
        ) : photo.category === 'screenshot' ? (
          <span className="glass-chip">SCREENSHOT</span>
        ) : photo.category === 'panorama' ? (
          <span className="glass-chip">PANO</span>
        ) : photo.category === 'gif' ? (
          <span className="glass-chip">GIF</span>
        ) : (
          <span className="glass-chip live-chip">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            LIVE
          </span>
        )}
        <button
          type="button"
          className={`fav-btn ${isFav ? 'is-fav' : ''}`}
          data-fav-id={photo.id}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(photo.id, e);
          }}
          title="Favorite"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.7-7.7 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
      </div>
      <div className="select-check">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </article>
  );
});

export default function App() {
  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);

  // Core State
  const [items, setItems] = useState<MediaItem[]>(CURATED_SAMPLE_PHOTOS);
  const [folders, setFolders] = useState<ScannedFolderInfo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(['1', '2', '4', '6']));
  const [settings, setSettings] = useState<GallerySettings>({
    gridSize: 240,
    aspectRatioMode: 'square',
    theme: 'light',
    sortBy: 'date-desc',
    autoScanOnStartup: true,
    favoritesOnly: false,
    foldersConfig: [],
    showMemories: true,
    showLiveBadges: true,
  });

  // Navigation & View State
  const [filter, setFilter] = useState<string>('all');
  const [density, setDensity] = useState<'years' | 'months' | 'days' | 'all'>('all');
  const [gridCols, setGridCols] = useState<number>(4);
  const [search, setSearch] = useState<string>('');
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'theme' | 'folders' | 'developer'>('theme');

  // Interactive Toast with Undo Support
  const [toastData, setToastData] = useState<{ message: string; undoAction?: () => void } | null>(null);
  const [undoDeletedItems, setUndoDeletedItems] = useState<MediaItem[] | null>(null);

  // Accidental Deletion Prevention Confirmation Modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    mode: 'trash' | 'permanent';
    items: MediaItem[];
  } | null>(null);

  // Lightbox & Edit Studio State
  const [lightboxPhoto, setLightboxPhoto] = useState<MediaItem | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingZoom, setIsDraggingZoom] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const filmstripRef = useRef<HTMLDivElement | null>(null);

  const [isLivePlaying, setIsLivePlaying] = useState<boolean>(false);
  const [drawerMode, setDrawerMode] = useState<'info' | 'edit' | null>(null);
  const [edits, setEdits] = useState<Record<string, { brightness: number; contrast: number; saturate: number; warmth: number }>>({});

  // Scanning State
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Virtual Grid Metrics (Handles 10,000+ Photos at locked 60/120fps)
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
  const galleryScrollRef = useRef<HTMLDivElement | null>(null);

  // DOM Refs for Gliders
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const navGliderRef = useRef<HTMLDivElement | null>(null);
  const densityBarRef = useRef<HTMLDivElement | null>(null);
  const densityGliderRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string, onUndo?: () => void) => {
    setToastData({ message: msg, undoAction: onUndo });
    setTimeout(() => {
      setToastData((current) => (current?.message === msg ? null : current));
    }, onUndo ? 4500 : 2500);
  }, []);

  // Sync Theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    const isDark = settings.theme === 'oled' || settings.theme === 'mocha';
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings.theme]);

  // Sync Live Photo Badges
  useEffect(() => {
    document.body.classList.toggle('hide-live-badges', !settings.showLiveBadges);
  }, [settings.showLiveBadges]);

  // Sync Select Mode
  useEffect(() => {
    document.body.classList.toggle('select-mode', selectMode);
  }, [selectMode]);

  // Position Gliders (Pixel-Accurate Spring Transitions)
  const positionGliders = useCallback(() => {
    if (navScrollRef.current && navGliderRef.current) {
      const activeNav = navScrollRef.current.querySelector('.nav-item.active') as HTMLElement | null;
      if (activeNav) {
        const cRect = navScrollRef.current.getBoundingClientRect();
        const aRect = activeNav.getBoundingClientRect();
        const top = aRect.top - cRect.top + navScrollRef.current.scrollTop;
        navGliderRef.current.style.height = `${aRect.height}px`;
        navGliderRef.current.style.transform = `translateY(${top}px)`;
        navGliderRef.current.style.opacity = '1';
      } else {
        navGliderRef.current.style.opacity = '0';
      }
    }

    if (densityBarRef.current && densityGliderRef.current) {
      const activeSeg = densityBarRef.current.querySelector('.seg-btn.active') as HTMLElement | null;
      if (activeSeg) {
        densityGliderRef.current.style.width = `${activeSeg.offsetWidth}px`;
        densityGliderRef.current.style.transform = `translateX(${activeSeg.offsetLeft - 4}px)`;
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(positionGliders, 50);
    return () => clearTimeout(timer);
  }, [filter, density, isSidebarOpen, positionGliders]);

  useEffect(() => {
    window.addEventListener('resize', positionGliders);
    return () => window.removeEventListener('resize', positionGliders);
  }, [positionGliders]);

  // Measure Scroll Container for 10k+ Photos Virtual Grid
  useEffect(() => {
    const el = galleryScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Passive Scroll Listener for Virtual Windowing
  useEffect(() => {
    const el = galleryScrollRef.current;
    if (!el) return;
    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        if (el) setScrollTop(el.scrollTop);
        rafId = null;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Load Saved Library on Launch
  useEffect(() => {
    const initApp = async () => {
      if (isElectron && window.electronAPI) {
        try {
          const lib = await window.electronAPI.loadLibrary();
          if (lib && Array.isArray(lib.items) && lib.items.length > 0) {
            setItems(lib.items.map(indexMediaItem));
            setFolders(lib.folders || []);
          }
          const favs = await window.electronAPI.loadFavorites();
          if (Array.isArray(favs) && favs.length > 0) setFavoriteIds(new Set(favs));
          const albs = await window.electronAPI.loadAlbums();
          if (Array.isArray(albs)) setAlbums(albs);
          const savedSet = await window.electronAPI.loadSettings();
          if (savedSet) setSettings((s) => ({ ...s, ...savedSet }));
        } catch (err) {
          console.error('Failed to load electron state:', err);
        }
      } else {
        try {
          const rawLib = localStorage.getItem(LIBRARY_KEY);
          if (rawLib) {
            const parsed = JSON.parse(rawLib);
            if (Array.isArray(parsed.items) && parsed.items.length > 0) {
              setItems(parsed.items.map(indexMediaItem));
              setFolders(parsed.folders || []);
            }
          }
          const rawFavs = localStorage.getItem(FAVORITES_KEY);
          if (rawFavs) setFavoriteIds(new Set(JSON.parse(rawFavs)));
          const rawSet = localStorage.getItem(SETTINGS_KEY);
          if (rawSet) setSettings((s) => ({ ...s, ...JSON.parse(rawSet) }));
        } catch {}
      }

      if (isElectron && window.electronAPI) {
        void handleScanMac();
      }
    };
    void initApp();
  }, [isElectron]);

  // Scan Mac Library
  const handleScanMac = useCallback(async (customConfigs?: FolderScanConfig[]) => {
    setIsScanning(true);
    try {
      if (isElectron && window.electronAPI) {
        const result = await window.electronAPI.scanMacDefault(customConfigs);
        if (result && Array.isArray(result.items) && result.items.length > 0) {
          const updatedItems = result.items.map((it) => {
            const indexed = indexMediaItem(it);
            indexed.favorite = favoriteIds.has(it.id);
            return indexed;
          });
          setItems(updatedItems);
          setFolders(result.folders);
          void window.electronAPI.saveLibrary({ folders: result.folders, items: updatedItems });
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  }, [isElectron, favoriteIds]);

  // Toggle Folder Scanning
  const handleToggleFolder = useCallback((folderPath: string) => {
    setSettings((prev) => {
      const base = prev.foldersConfig && prev.foldersConfig.length > 0
        ? prev.foldersConfig
        : folders.map((f) => ({ name: f.name, path: f.path, enabled: true, isStandard: f.isStandard }));
      const updated = base.map((c) => (c.path === folderPath ? { ...c, enabled: !c.enabled } : c));
      void handleScanMac(updated);
      return { ...prev, foldersConfig: updated };
    });
  }, [folders, handleScanMac]);

  // Add Custom Folder
  const handleAddCustomFolder = useCallback(async () => {
    if (!isElectron || !window.electronAPI) {
      const path = window.prompt('Enter folder path to add (e.g. /Users/salman/Projects/Photos):');
      if (!path) return;
      const customFolder: ScannedFolderInfo = {
        id: `folder-${Date.now()}`,
        name: path.split('/').filter(Boolean).pop() || 'Custom Folder',
        path,
        itemCount: 0,
        lastScanned: Date.now(),
        isStandard: false,
        enabled: true,
      };
      setFolders((prev) => [...prev, customFolder]);
      showToast('Custom folder added');
      return;
    }
    const selected = await window.electronAPI.selectFolders();
    if (selected && selected.length > 0) {
      for (const fPath of selected) {
        const res = await window.electronAPI.scanFolderPath(fPath);
        if (res && res.folder) {
          setFolders((prev) => [...prev.filter((f) => f.path !== fPath), res.folder]);
          setItems((prev) => {
            const seen = new Set(prev.map((p) => p.filePath));
            return [...prev, ...res.items.filter((it) => !seen.has(it.filePath))];
          });
        }
      }
      showToast('Custom folder added');
    }
  }, [isElectron, showToast]);

  // Create Album
  const handleCreateAlbum = useCallback(() => {
    const name = window.prompt('Enter new album name:');
    if (!name || !name.trim()) return;
    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      name: name.trim(),
      itemIds: [],
      createdAt: Date.now(),
    };
    setAlbums((prev) => {
      const next = [...prev, newAlbum];
      if (isElectron && window.electronAPI) {
        void window.electronAPI.saveAlbums(next);
      } else {
        localStorage.setItem(ALBUMS_KEY, JSON.stringify(next));
      }
      return next;
    });
    setFilter(`album:${newAlbum.id}`);
    showToast(`Created album "${name.trim()}"`);
  }, [isElectron, showToast]);

  // Toggle Favorite
  const handleToggleFav = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      const isFav = !next.has(id);
      if (isFav) next.add(id);
      else next.delete(id);

      setItems((list) => list.map((p) => (p.id === id ? { ...p, favorite: isFav } : p)));

      const favArray = Array.from(next);
      if (isElectron && window.electronAPI) {
        void window.electronAPI.saveFavorites(favArray);
      } else {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favArray));
      }
      return next;
    });
  }, [isElectron]);

  // Accidental Deletion Prevention Handlers
  const requestTrash = useCallback((itemsToTrash: MediaItem[]) => {
    if (itemsToTrash.length === 0) return;
    setDeleteConfirmTarget({ mode: 'trash', items: itemsToTrash });
  }, []);

  const requestPermanentDelete = useCallback((itemsToDelete: MediaItem[]) => {
    if (itemsToDelete.length === 0) return;
    setDeleteConfirmTarget({ mode: 'permanent', items: itemsToDelete });
  }, []);

  const confirmMoveToTrash = useCallback((itemsToTrash: MediaItem[]) => {
    const idsToTrash = new Set(itemsToTrash.map((p) => p.id));
    setItems((prev) => {
      const updated = prev.map((p) => (idsToTrash.has(p.id) ? { ...p, isDeleted: true } : p));
      if (isElectron && window.electronAPI) {
        void window.electronAPI.saveLibrary({ folders, items: updated });
      } else {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify({ folders, items: updated }));
      }
      return updated;
    });

    setUndoDeletedItems(itemsToTrash);
    setDeleteConfirmTarget(null);

    const count = itemsToTrash.length;
    showToast(
      `Moved ${count === 1 ? 'photo' : `${count} photos`} to Trash`,
      () => {
        // Undo Action Callback
        setItems((prev) => {
          const restored = prev.map((p) => (idsToTrash.has(p.id) ? { ...p, isDeleted: false } : p));
          if (isElectron && window.electronAPI) {
            void window.electronAPI.saveLibrary({ folders, items: restored });
          } else {
            localStorage.setItem(LIBRARY_KEY, JSON.stringify({ folders, items: restored }));
          }
          return restored;
        });
        showToast('Restored to library');
      }
    );

    if (lightboxPhoto && idsToTrash.has(lightboxPhoto.id)) {
      setLightboxPhoto(null);
    }
    if (selectMode) {
      setSelectedIds(new Set());
      setSelectMode(false);
    }
  }, [folders, isElectron, lightboxPhoto, selectMode, showToast]);

  const confirmPermanentDelete = useCallback(async (itemsToDelete: MediaItem[]) => {
    const idsToDelete = new Set(itemsToDelete.map((p) => p.id));

    if (isElectron && window.electronAPI) {
      for (const p of itemsToDelete) {
        if (p.filePath) await window.electronAPI.trashItem(p.filePath);
      }
    }

    setItems((prev) => {
      const updated = prev.filter((p) => !idsToDelete.has(p.id));
      if (isElectron && window.electronAPI) {
        void window.electronAPI.saveLibrary({ folders, items: updated });
      } else {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify({ folders, items: updated }));
      }
      return updated;
    });

    setDeleteConfirmTarget(null);
    if (lightboxPhoto && idsToDelete.has(lightboxPhoto.id)) {
      setLightboxPhoto(null);
    }
    if (selectMode) {
      setSelectedIds(new Set());
      setSelectMode(false);
    }
    showToast(`Permanently deleted ${itemsToDelete.length} items`);
  }, [folders, isElectron, lightboxPhoto, selectMode, showToast]);

  const handleRestorePhoto = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, isDeleted: false } : p));
      if (isElectron && window.electronAPI) {
        void window.electronAPI.saveLibrary({ folders, items: updated });
      } else {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify({ folders, items: updated }));
      }
      return updated;
    });
    showToast('Restored to Library');
  }, [isElectron, folders, showToast]);

  const handleEmptyTrash = useCallback(() => {
    const trashed = items.filter((p) => p.isDeleted);
    if (trashed.length === 0) return;
    requestPermanentDelete(trashed);
  }, [items, requestPermanentDelete]);

  const handleRestoreAllTrash = useCallback(() => {
    setItems((prev) => {
      const updated = prev.map((p) => ({ ...p, isDeleted: false }));
      if (isElectron && window.electronAPI) {
        void window.electronAPI.saveLibrary({ folders, items: updated });
      } else {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify({ folders, items: updated }));
      }
      return updated;
    });
    showToast('All items restored to Library');
  }, [isElectron, folders, showToast]);

  // Section Counts (Computed in a single lightning O(N) pass)
  const counts = useMemo(() => {
    let all = 0;
    let fav = 0;
    let recents = 0;
    let photos = 0;
    let videos = 0;
    let screenshots = 0;
    let screenRecordings = 0;
    let panoramas = 0;
    let gifs = 0;
    let pictures = 0;
    let desktop = 0;
    let downloads = 0;
    let movies = 0;
    let trash = 0;

    const thirtyDaysAgo = Date.now() - 30 * 86400000;

    for (const p of items) {
      if (p.isDeleted) {
        trash++;
        continue;
      }
      all++;
      if (p.favorite || favoriteIds.has(p.id)) fav++;
      if ((p.createdAt || p.modifiedAt) >= thirtyDaysAgo) recents++;
      if (p.category === 'photo') photos++;
      if (p.category === 'video' || p.category === 'screen_recording') videos++;
      if (p.category === 'screenshot') screenshots++;
      if (p.category === 'screen_recording') screenRecordings++;
      if (p.category === 'panorama' || (p.width && p.height && p.width / p.height > 2)) panoramas++;
      if (p.category === 'gif' || p.format === 'GIF') gifs++;

      const folderLower = (p.folderName || '').toLowerCase();
      const pathLower = (p.folderPath || '').toLowerCase();
      if (folderLower.includes('picture') || pathLower.includes('picture')) pictures++;
      if (folderLower.includes('desktop') || pathLower.includes('desktop')) desktop++;
      if (folderLower.includes('download') || pathLower.includes('download')) downloads++;
      if (folderLower.includes('movie') || pathLower.includes('movie')) movies++;
    }

    return {
      all,
      fav,
      recents,
      photos,
      videos,
      screenshots,
      screenRecordings,
      panoramas,
      gifs,
      pictures,
      desktop,
      downloads,
      movies,
      trash,
    };
  }, [items, favoriteIds]);

  // Filtered Photos List (Ultra-fast invariant filtering)
  const filteredPhotos = useMemo(() => {
    return items.filter((p) => {
      if (filter === 'trash') {
        return Boolean(p.isDeleted);
      }
      if (p.isDeleted) return false;

      if (filter === 'favorites' && (!p.favorite && !favoriteIds.has(p.id))) return false;
      if (filter === 'recents') {
        const thirtyDaysAgo = Date.now() - 30 * 86400000;
        if ((p.createdAt || p.modifiedAt) < thirtyDaysAgo) return false;
      }
      if (filter === 'photos' && p.category !== 'photo') return false;
      if (filter === 'videos' && p.category !== 'video' && p.category !== 'screen_recording') return false;
      if (filter === 'screenshots' && p.category !== 'screenshot') return false;
      if (filter === 'screen_recordings' && p.category !== 'screen_recording') return false;
      if (filter === 'panoramas' && p.category !== 'panorama' && !(p.width && p.height && p.width / p.height > 2)) return false;
      if (filter === 'gifs' && p.category !== 'gif' && p.format !== 'GIF') return false;

      if (filter === 'folder:Pictures') {
        const f = (p.folderName || '').toLowerCase();
        const path = (p.folderPath || '').toLowerCase();
        if (!f.includes('picture') && !path.includes('picture')) return false;
      } else if (filter === 'folder:Desktop') {
        const f = (p.folderName || '').toLowerCase();
        const path = (p.folderPath || '').toLowerCase();
        if (!f.includes('desktop') && !path.includes('desktop')) return false;
      } else if (filter === 'folder:Downloads') {
        const f = (p.folderName || '').toLowerCase();
        const path = (p.folderPath || '').toLowerCase();
        if (!f.includes('download') && !path.includes('download')) return false;
      } else if (filter === 'folder:Movies') {
        const f = (p.folderName || '').toLowerCase();
        const path = (p.folderPath || '').toLowerCase();
        if (!f.includes('movie') && !path.includes('movie')) return false;
      } else if (filter.startsWith('folder:')) {
        const target = filter.slice(7);
        const f = folders.find((item) => item.id === target || item.path === target);
        if (f && !p.folderPath.startsWith(f.path)) return false;
      }

      if (filter.startsWith('album:')) {
        const albumId = filter.slice(6);
        if (!p.albumIds || !p.albumIds.includes(albumId)) return false;
      }

      if (search) {
        const s = search.toLowerCase();
        const titleMatch = (p.filename || '').toLowerCase().includes(s);
        const folderMatch = (p.folderName || '').toLowerCase().includes(s);
        const formatMatch = (p.format || '').toLowerCase().includes(s);
        if (!titleMatch && !folderMatch && !formatMatch) return false;
      }
      return true;
    });
  }, [items, filter, favoriteIds, search, folders]);

  // View Title & Subtitle
  const { viewTitle, viewSubtitle } = useMemo(() => {
    if (filter === 'all') return { viewTitle: 'All Photos', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Photos & Videos` };
    if (filter === 'favorites') return { viewTitle: 'Favorites', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Starred memories` };
    if (filter === 'recents') return { viewTitle: 'Recents', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Photos added recently` };
    if (filter === 'photos') return { viewTitle: 'Photos', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Still photographs` };
    if (filter === 'videos') return { viewTitle: 'Videos', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Video clips` };
    if (filter === 'screenshots') return { viewTitle: 'Screenshots', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Screen captures` };
    if (filter === 'screen_recordings') return { viewTitle: 'Screen Recordings', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Screen recordings` };
    if (filter === 'panoramas') return { viewTitle: 'Panoramas', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Panoramic captures` };
    if (filter === 'gifs') return { viewTitle: 'Animations & GIFs', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Animated images` };
    if (filter === 'trash') return { viewTitle: 'Trash', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Deleted items` };
    if (filter === 'folder:Pictures') return { viewTitle: 'Pictures', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Photos in Pictures` };
    if (filter === 'folder:Desktop') return { viewTitle: 'Desktop', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Photos on Desktop` };
    if (filter === 'folder:Downloads') return { viewTitle: 'Downloads', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Photos in Downloads` };
    if (filter === 'folder:Movies') return { viewTitle: 'Movies', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Videos in Movies` };
    if (filter.startsWith('folder:')) {
      const f = folders.find((it) => it.id === filter.slice(7) || it.path === filter.slice(7));
      return { viewTitle: f?.name || 'Folder', viewSubtitle: f?.path || 'Mac Folder' };
    }
    if (filter.startsWith('album:')) {
      const a = albums.find((it) => it.id === filter.slice(6));
      return { viewTitle: a?.name || 'Album', viewSubtitle: `${filteredPhotos.length.toLocaleString()} Items` };
    }
    return { viewTitle: 'Library', viewSubtitle: 'Collection' };
  }, [filter, filteredPhotos.length, folders, albums]);

  // Total Storage
  const totalSizeBytes = useMemo(() => {
    return items.reduce((sum, p) => sum + (p.fileSize || 0), 0);
  }, [items]);

  // Filter Style for Edits
  const getFilterStyle = useCallback((id: string) => {
    const e = edits[id];
    if (!e) return '';
    return `brightness(${e.brightness}%) contrast(${e.contrast}%) saturate(${e.saturate}%) sepia(${e.warmth}%)`;
  }, [edits]);

  // Gesture Actions
  const handlePhotoSingleTap = useCallback((photo: MediaItem) => {
    if (selectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(photo.id)) next.delete(photo.id);
        else next.add(photo.id);
        if (next.size === 0) setSelectMode(false);
        return next;
      });
    } else {
      setLightboxPhoto(photo);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      setIsLivePlaying(false);
    }
  }, [selectMode]);

  const handlePhotoDoubleTap = useCallback((photo: MediaItem) => {
    setLightboxPhoto(photo);
    setDrawerMode('info');
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handlePhotoLongPress = useCallback((photo: MediaItem) => {
    setSelectMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(photo.id);
      return next;
    });
    showToast('Selection mode active');
  }, [showToast]);

  const handleBatchFavorite = () => {
    selectedIds.forEach((id) => handleToggleFav(id));
    showToast(`Added ${selectedIds.size} to Favorites`);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleSharePhoto = useCallback(async (photo: MediaItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.filename,
          text: `Photo from Gallery: ${photo.filename}`,
          url: photo.fileUrl,
        });
        showToast('Shared successfully');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    const target = photo.filePath || photo.fileUrl;
    try {
      await navigator.clipboard.writeText(target);
      showToast('Copied photo path to clipboard');
    } catch {
      showToast('Could not copy to clipboard');
    }
  }, [showToast]);

  const handleBatchShare = useCallback(async () => {
    const selectedPhotos = items.filter((p) => selectedIds.has(p.id));
    if (selectedPhotos.length === 0) return;
    const paths = selectedPhotos.map((p) => p.filePath || p.fileUrl).join('\n');
    try {
      await navigator.clipboard.writeText(paths);
      showToast(`Copied ${selectedPhotos.length} photo paths to clipboard`);
    } catch {
      showToast('Could not copy to clipboard');
    }
  }, [items, selectedIds, showToast]);

  // Lightbox Step
  const stepLightbox = useCallback((dir: number) => {
    if (!lightboxPhoto) return;
    const idx = filteredPhotos.findIndex((p) => p.id === lightboxPhoto.id);
    if (idx === -1 || !filteredPhotos.length) return;
    const next = filteredPhotos[(idx + dir + filteredPhotos.length) % filteredPhotos.length];
    setLightboxPhoto(next);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsLivePlaying(false);
  }, [filteredPhotos, lightboxPhoto]);

  // Interactive Lightbox Zoom & Pan
  const isVideoCurrent = useMemo(() => {
    if (!lightboxPhoto) return false;
    const ext = (lightboxPhoto.filename || '').toLowerCase();
    return (
      lightboxPhoto.category === 'video' ||
      lightboxPhoto.category === 'screen_recording' ||
      ['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv'].some((x) => ext.endsWith(x))
    );
  }, [lightboxPhoto]);

  const handleStageWheel = useCallback((e: React.WheelEvent) => {
    if (isVideoCurrent) return;
    e.preventDefault();

    // Fast & sensitive zoom (Requirement 9)
    const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.015 : 0.007));

    setZoomScale((prevScale) => {
      const nextScale = Math.min(8, Math.max(1, prevScale * factor));
      if (nextScale <= 1.01) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }

      // Focal point zoom towards cursor (Requirement 2: zoom picture corners, not just center)
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const mx = e.clientX - (rect.left + rect.width / 2);
        const my = e.clientY - (rect.top + rect.height / 2);
        setPanOffset((prevPan) => ({
          x: mx - (mx - prevPan.x) * (nextScale / prevScale),
          y: my - (my - prevPan.y) * (nextScale / prevScale),
        }));
      }
      return nextScale;
    });
  }, [isVideoCurrent]);

  const handleStageDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isVideoCurrent) return;
    if (zoomScale > 1) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      const targetScale = 2.8;
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const mx = e.clientX - (rect.left + rect.width / 2);
        const my = e.clientY - (rect.top + rect.height / 2);
        setZoomScale(targetScale);
        setPanOffset({
          x: -mx * (targetScale - 1),
          y: -my * (targetScale - 1),
        });
      } else {
        setZoomScale(targetScale);
      }
    }
  }, [isVideoCurrent, zoomScale]);

  const handleStagePointerDown = useCallback((e: React.PointerEvent) => {
    if (isVideoCurrent || zoomScale <= 1) return;
    setIsDraggingZoom(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  }, [isVideoCurrent, zoomScale, panOffset]);

  const handleStagePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingZoom || zoomScale <= 1) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }, [isDraggingZoom, zoomScale]);

  const handleStagePointerUp = useCallback(() => {
    setIsDraggingZoom(false);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setDeleteConfirmTarget(null);
        if (lightboxPhoto) {
          if (drawerMode) setDrawerMode(null);
          else setLightboxPhoto(null);
        }
      }
      if (e.key === '/' && document.activeElement !== document.getElementById('searchInput')) {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
      if (lightboxPhoto) {
        if (e.key === 'ArrowLeft') stepLightbox(-1);
        if (e.key === 'ArrowRight') stepLightbox(1);
        if (e.key.toLowerCase() === 'f') handleToggleFav(lightboxPhoto.id);
        if (e.key.toLowerCase() === 'i') setDrawerMode((prev) => (prev === 'info' ? null : 'info'));
        if (e.key.toLowerCase() === 'e') setDrawerMode((prev) => (prev === 'edit' ? null : 'edit'));
        if (e.key.toLowerCase() === 'z') {
          setZoomScale((z) => (z > 1 ? 1 : 2.5));
          setPanOffset({ x: 0, y: 0 });
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
          if (filter === 'trash') {
            requestPermanentDelete([lightboxPhoto]);
          } else {
            requestTrash([lightboxPhoto]);
          }
        }
      } else if (selectMode && selectedIds.size > 0) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const selected = items.filter((p) => selectedIds.has(p.id));
          if (filter === 'trash') {
            requestPermanentDelete(selected);
          } else {
            requestTrash(selected);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, drawerMode, stepLightbox, handleToggleFav, filter, selectMode, selectedIds, items, requestPermanentDelete, requestTrash]);

  // Full Scrollable Filmstrip & Active Photo Auto-Centering (Requirement 10)
  useEffect(() => {
    if (!lightboxPhoto || !filmstripRef.current) return;
    const activeThumb = filmstripRef.current.querySelector<HTMLElement>(`.film-thumb[data-id="${lightboxPhoto.id}"]`);
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [lightboxPhoto]);

  const handleFilmstripWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY !== 0 && filmstripRef.current) {
      filmstripRef.current.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
    }
  }, []);

  // Select All state & toggle (Requirement 1)
  const isAllSelected = filteredPhotos.length > 0 && selectedIds.size === filteredPhotos.length;

  const handleToggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
      setSelectMode(false);
    } else {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
      setSelectMode(true);
    }
  }, [filteredPhotos, isAllSelected]);

  // Dynamic Selected Folder / Section Label for Top-Left Header (Requirement 8)
  const currentViewLabel = useMemo(() => {
    if (filter.startsWith('folder:')) {
      const rawId = filter.replace('folder:', '');
      if (rawId === 'Pictures') return 'Pictures';
      if (rawId === 'Desktop') return 'Desktop';
      if (rawId === 'Downloads') return 'Downloads';
      if (rawId === 'Movies') return 'Movies';
      const found = folders.find((f) => f.id === rawId);
      return found ? found.name : rawId;
    }
    if (filter.startsWith('album:')) {
      const albId = filter.replace('album:', '');
      const found = albums.find((a) => a.id === albId);
      return found ? found.name : 'Album';
    }
    switch (filter) {
      case 'favorites': return 'Favorites';
      case 'recent': return 'Recent';
      case 'videos': return 'Videos';
      case 'screenshots': return 'Screenshots';
      case 'panoramas': return 'Panoramas';
      case 'memories': return 'Memories';
      case 'trash': return 'Trash';
      default: return 'Photos';
    }
  }, [filter, folders, albums]);

  // Virtual Window Calculation for 10k+ Photos Scale (Minimal 2px Gap Matching User Photos)
  const activeCols = density === 'years' ? 6 : density === 'months' ? 5 : density === 'days' ? 3 : gridCols;
  const activeGap = 2; // Minimal 2px gap matching user photos
  const aspectRatio = 1;

  const contentWidth = Math.max(300, containerSize.width - 4);
  const colWidth = (contentWidth - (activeCols - 1) * activeGap) / activeCols;
  const colHeight = colWidth / aspectRatio;
  const rowHeight = colHeight + activeGap;

  const totalItems = filteredPhotos.length;
  const totalRows = Math.ceil(totalItems / activeCols);
  const totalGridHeight = totalRows * rowHeight;

  const showMemories = settings.showMemories && (filter === 'all' || filter === 'memories') && !search;
  const headerOffset = showMemories ? 310 : 70;

  const gridScrollTop = Math.max(0, scrollTop - headerOffset);
  const startRow = Math.max(0, Math.floor(gridScrollTop / rowHeight) - 2);
  const endRow = Math.min(totalRows, Math.ceil((gridScrollTop + containerSize.height) / rowHeight) + 3);

  const startIndex = startRow * activeCols;
  const endIndex = Math.min(totalItems, endRow * activeCols);

  const topSpacerHeight = startRow * rowHeight;

  const visiblePhotos = useMemo(() => {
    if (totalItems <= 80) return filteredPhotos;
    return filteredPhotos.slice(startIndex, endIndex);
  }, [filteredPhotos, startIndex, endIndex, totalItems]);

  return (
    <>
      {/* Floating Toast Pill with Optional Undo Action */}
      <div className={`toast ${toastData ? 'show' : ''}`} id="toast">
        <div className="toast-inner">
          <span>{toastData?.message || 'Action completed'}</span>
          {toastData?.undoAction && (
            <button
              type="button"
              className="toast-undo-btn"
              onClick={toastData.undoAction}
            >
              Undo
            </button>
          )}
        </div>
      </div>

      {/* Main Full-Bleed macOS Native Window */}
      <div className="app-window" id="appWindow">

        {/* Left Frosted Sidebar Matching User Reference Image 100% */}
        <aside
          className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}
          id="sidebar"
          style={{ paddingTop: isElectron ? '38px' : '22px' }}
        >
          <div className="brand-header">
            <div className="brand-icon">
              {filter.startsWith('folder:') ? (
                <Folder className="w-4 h-4 text-blue-500" />
              ) : filter.startsWith('album:') ? (
                <Folder className="w-4 h-4 text-amber-500" />
              ) : filter === 'favorites' ? (
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              ) : filter === 'trash' ? (
                <Trash2 className="w-4 h-4 text-rose-500" />
              ) : filter === 'videos' ? (
                <Video className="w-4 h-4 text-purple-500" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
            <span className="brand-title truncate" title={currentViewLabel}>
              {currentViewLabel}
            </span>
          </div>

          <div className="nav-scroll" id="navScroll" ref={navScrollRef} onScroll={positionGliders}>
            <div className="nav-glider" id="navGlider" ref={navGliderRef}></div>

            {/* 1. LIBRARY */}
            <div className="nav-group">
              <div className="nav-group-header">
                <span className="nav-group-label">Library</span>
              </div>
              <div className="nav-list">
                <button
                  type="button"
                  className={`nav-item ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  <span className="nav-item-left">
                    <Images className="w-4 h-4 text-blue-500" />
                    <span>All Photos</span>
                  </span>
                  <span className="nav-badge">{counts.all.toLocaleString()}</span>
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'favorites' ? 'active' : ''}`}
                  onClick={() => setFilter('favorites')}
                >
                  <span className="nav-item-left">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>Favorites</span>
                  </span>
                  {counts.fav > 0 && <span className="nav-badge">{counts.fav.toLocaleString()}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'recents' ? 'active' : ''}`}
                  onClick={() => setFilter('recents')}
                >
                  <span className="nav-item-left">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Recents</span>
                  </span>
                  {counts.recents > 0 && <span className="nav-badge">{counts.recents.toLocaleString()}</span>}
                </button>
              </div>
            </div>

            {/* 2. MEDIA TYPES */}
            <div className="nav-group">
              <div className="nav-group-header">
                <span className="nav-group-label">Media Types</span>
              </div>
              <div className="nav-list">
                <button
                  type="button"
                  className={`nav-item ${filter === 'photos' ? 'active' : ''}`}
                  onClick={() => setFilter('photos')}
                >
                  <span className="nav-item-left">
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span>Photos</span>
                  </span>
                  <span className="nav-badge">{counts.photos.toLocaleString()}</span>
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'videos' ? 'active' : ''}`}
                  onClick={() => setFilter('videos')}
                >
                  <span className="nav-item-left">
                    <Video className="w-4 h-4 text-purple-500" />
                    <span>Videos</span>
                  </span>
                  {counts.videos > 0 && <span className="nav-badge">{counts.videos.toLocaleString()}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'screenshots' ? 'active' : ''}`}
                  onClick={() => setFilter('screenshots')}
                >
                  <span className="nav-item-left">
                    <Monitor className="w-4 h-4 text-cyan-500" />
                    <span>Screenshots</span>
                  </span>
                  {counts.screenshots > 0 && <span className="nav-badge">{counts.screenshots.toLocaleString()}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'screen_recordings' ? 'active' : ''}`}
                  onClick={() => setFilter('screen_recordings')}
                >
                  <span className="nav-item-left">
                    <Clapperboard className="w-4 h-4 text-emerald-500" />
                    <span>Screen Recordings</span>
                  </span>
                  {counts.screenRecordings > 0 && <span className="nav-badge">{counts.screenRecordings.toLocaleString()}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'panoramas' ? 'active' : ''}`}
                  onClick={() => setFilter('panoramas')}
                >
                  <span className="nav-item-left">
                    <Maximize2 className="w-4 h-4 text-blue-500" />
                    <span>Panoramas</span>
                  </span>
                  {counts.panoramas > 0 && <span className="nav-badge">{counts.panoramas.toLocaleString()}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'gifs' ? 'active' : ''}`}
                  onClick={() => setFilter('gifs')}
                >
                  <span className="nav-item-left">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <span>Animations & GIFs</span>
                  </span>
                  {counts.gifs > 0 && <span className="nav-badge">{counts.gifs.toLocaleString()}</span>}
                </button>
              </div>
            </div>

            {/* 3. MAC FOLDERS */}
            <div className="nav-group">
              <div className="nav-group-header">
                <span className="nav-group-label">Mac Folders</span>
                <button
                  type="button"
                  className="nav-group-add-btn"
                  onClick={handleAddCustomFolder}
                  title="Add Folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="nav-list">
                <button
                  type="button"
                  className={`nav-item ${filter === 'folder:Pictures' ? 'active' : ''}`}
                  onClick={() => setFilter('folder:Pictures')}
                >
                  <span className="nav-item-left">
                    <Folder className="w-4 h-4 text-blue-500" />
                    <span>Pictures</span>
                  </span>
                  {counts.pictures > 0 && <span className="nav-badge">{counts.pictures.toLocaleString()}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'folder:Desktop' ? 'active' : ''}`}
                  onClick={() => setFilter('folder:Desktop')}
                >
                  <span className="nav-item-left">
                    <Monitor className="w-4 h-4 text-blue-500" />
                    <span>Desktop</span>
                  </span>
                  {counts.desktop > 0 && <span className="nav-badge">{counts.desktop.toLocaleString()}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'folder:Downloads' ? 'active' : ''}`}
                  onClick={() => setFilter('folder:Downloads')}
                >
                  <span className="nav-item-left">
                    <ArrowDownCircle className="w-4 h-4 text-blue-500" />
                    <span>Downloads</span>
                  </span>
                  {counts.downloads > 0 && <span className="nav-badge">{counts.downloads.toLocaleString()}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-item ${filter === 'folder:Movies' ? 'active' : ''}`}
                  onClick={() => setFilter('folder:Movies')}
                >
                  <span className="nav-item-left">
                    <Film className="w-4 h-4 text-blue-500" />
                    <span>Movies</span>
                  </span>
                  {counts.movies > 0 && <span className="nav-badge">{counts.movies.toLocaleString()}</span>}
                </button>

                {/* Additional Scanned Folders */}
                {folders.filter((f) => !f.isStandard).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`nav-item ${filter === `folder:${f.id}` ? 'active' : ''}`}
                    onClick={() => setFilter(`folder:${f.id}`)}
                  >
                    <span className="nav-item-left truncate">
                      <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <span className="nav-badge">{f.itemCount.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. MY ALBUMS */}
            <div className="nav-group">
              <div className="nav-group-header">
                <span className="nav-group-label">My Albums</span>
                <button
                  type="button"
                  className="nav-group-add-btn"
                  onClick={handleCreateAlbum}
                  title="Create Album"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="nav-list">
                {albums.length === 0 ? (
                  <div className="text-[12px] italic text-[var(--text-tertiary)] px-3 py-1">
                    No albums yet
                  </div>
                ) : (
                  albums.map((alb) => (
                    <button
                      key={alb.id}
                      type="button"
                      className={`nav-item ${filter === `album:${alb.id}` ? 'active' : ''}`}
                      onClick={() => setFilter(`album:${alb.id}`)}
                    >
                      <span className="nav-item-left truncate">
                        <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate">{alb.name}</span>
                      </span>
                      <span className="nav-badge">{(alb.itemIds || []).length}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 5. UTILITIES */}
            <div className="nav-group">
              <div className="nav-group-header">
                <span className="nav-group-label">Utilities</span>
              </div>
              <div className="nav-list">
                <button
                  type="button"
                  className={`nav-item ${filter === 'trash' ? 'active' : ''}`}
                  onClick={() => setFilter('trash')}
                >
                  <span className="nav-item-left">
                    <Trash2 className="w-4 h-4 text-neutral-400" />
                    <span>Trash</span>
                  </span>
                  {counts.trash > 0 && <span className="nav-badge">{counts.trash.toLocaleString()}</span>}
                </button>
              </div>
            </div>
          </div>

          {/* 6. SIDEBAR FOOTER (Storage metadata matching image) */}
          <div className="sidebar-footer">
            <div className="sidebar-footer-icon">
              <HardDrive />
            </div>
            <div className="sidebar-footer-meta">
              <span className="sidebar-footer-title">
                {items.filter((p) => !p.isDeleted).length.toLocaleString()} Photos & Videos
              </span>
              <span className="sidebar-footer-sub">
                {formatFileSize(totalSizeBytes)} on Mac
              </span>
            </div>
          </div>
        </aside>

        {/* Right Main Workspace */}
        <main className="main-stage">
          <header className="toolbar drag-region">
            <div className="toolbar-left no-drag">
              <button
                type="button"
                className="pill-btn icon-only"
                id="toggleSidebar"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title="Toggle Sidebar"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>

              {/* Grid Density Segmented Pill */}
              <div className="segmented-pill" id="densityBar" ref={densityBarRef}>
                <div className="seg-glider" id="densityGlider" ref={densityGliderRef}></div>
                <button
                  type="button"
                  className={`seg-btn ${density === 'years' ? 'active' : ''}`}
                  onClick={() => setDensity('years')}
                  data-density="years"
                >
                  Years
                </button>
                <button
                  type="button"
                  className={`seg-btn ${density === 'months' ? 'active' : ''}`}
                  onClick={() => setDensity('months')}
                  data-density="months"
                >
                  Months
                </button>
                <button
                  type="button"
                  className={`seg-btn ${density === 'days' ? 'active' : ''}`}
                  onClick={() => setDensity('days')}
                  data-density="days"
                >
                  Days
                </button>
                <button
                  type="button"
                  className={`seg-btn ${density === 'all' ? 'active' : ''}`}
                  onClick={() => setDensity('all')}
                  data-density="all"
                >
                  All Photos
                </button>
              </div>
            </div>

            <div className="toolbar-right no-drag">
              <div className="zoom-pill" title="Grid Scale">
                <button
                  type="button"
                  className="zoom-step-btn"
                  onClick={() => {
                    setGridCols((c) => Math.min(6, c + 1));
                    setDensity('all');
                  }}
                  title="Smaller Photos (−)"
                >
                  −
                </button>
                <input
                  type="range"
                  id="zoomSlider"
                  min="2"
                  max="6"
                  value={gridCols}
                  onChange={(e) => {
                    setGridCols(Number(e.target.value));
                    setDensity('all');
                  }}
                />
                <button
                  type="button"
                  className="zoom-step-btn"
                  onClick={() => {
                    setGridCols((c) => Math.max(2, c - 1));
                    setDensity('all');
                  }}
                  title="Larger Photos (+)"
                >
                  +
                </button>
              </div>

              <div className="search-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  id="searchInput"
                  placeholder="Search photos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Select Mode Toggle */}
              <button
                type="button"
                className={`pill-btn ${selectMode ? 'active-toggle' : ''}`}
                onClick={() => {
                  if (selectMode) {
                    setSelectedIds(new Set());
                    setSelectMode(false);
                  } else {
                    setSelectMode(true);
                    if (filteredPhotos.length > 0) {
                      setSelectedIds(new Set([filteredPhotos[0].id]));
                    }
                  }
                }}
                title={selectMode ? 'Exit Selection Mode' : 'Select Photos'}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{selectMode ? 'Done' : 'Select'}</span>
              </button>

              {/* Settings Trigger Button */}
              <button
                type="button"
                className={`pill-btn ${isSettingsOpen ? 'active-toggle' : ''}`}
                id="settingsBtn"
                onClick={() => setIsSettingsOpen(true)}
                title="Appearance & Settings"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.42 1.15H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
            </div>
          </header>

          {/* Scrollable Gallery Canvas */}
          <div className="gallery-scroll" id="galleryScroll" ref={galleryScrollRef}>
            <div className="view-header">
              <div>
                <h1 className="view-title" id="viewTitle">{viewTitle}</h1>
                <p className="view-subtitle" id="viewSubtitle">{viewSubtitle}</p>
              </div>
            </div>

            {/* Trash Action Banner (Shown when viewing Trash) */}
            {filter === 'trash' && (
              <div className="trash-banner">
                <div>
                  <div className="trash-banner-title">{filteredPhotos.length} Items in Trash</div>
                  <div className="trash-banner-sub">Items in Trash can be put back or deleted permanently.</div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="pill-btn !h-7 !px-3 text-[12px]" onClick={handleRestoreAllTrash}>
                    Restore All
                  </button>
                  <button type="button" className="pill-btn !h-7 !px-3 text-[12px] text-rose-500 hover:bg-rose-500/10" onClick={handleEmptyTrash}>
                    Empty Trash
                  </button>
                </div>
              </div>
            )}

            {/* Memories Showcase (Matching Reference HTML) */}
            {showMemories && (
              <section className="memories-section" id="memoriesSection">
                <div className="memories-row">
                  <article
                    className="memory-card"
                    data-memory-filter="nature"
                    style={{ animationDelay: '0.04s' }}
                    onClick={() => setFilter('photos')}
                  >
                    <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=85" alt="Alpine Mist" />
                    <div className="memory-scrim">
                      <span className="memory-tag">Memory • 4 Photos</span>
                      <div className="memory-title">Alpine Dawn</div>
                      <div className="memory-sub">High altitude reflections</div>
                    </div>
                  </article>
                  <article
                    className="memory-card"
                    data-memory-filter="architecture"
                    style={{ animationDelay: '0.10s' }}
                    onClick={() => setFilter('photos')}
                  >
                    <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=85" alt="Clean Lines" />
                    <div className="memory-scrim">
                      <span className="memory-tag">Memory • 4 Photos</span>
                      <div className="memory-title">Quiet Geometry</div>
                      <div className="memory-sub">Warm light & clean forms</div>
                    </div>
                  </article>
                  <article
                    className="memory-card"
                    data-memory-filter="minimal"
                    style={{ animationDelay: '0.16s' }}
                    onClick={() => setFilter('photos')}
                  >
                    <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85" alt="Coastal Calm" />
                    <div className="memory-scrim">
                      <span className="memory-tag">Memory • 4 Photos</span>
                      <div className="memory-title">Coastal Horizons</div>
                      <div className="memory-sub">Minimalist textures</div>
                    </div>
                  </article>
                </div>
              </section>
            )}

            {/* Virtualized Photo Grid (Handles 10k+ Photos Silky Smooth) */}
            <div style={{ height: `${totalGridHeight}px`, position: 'relative' }}>
              <div style={{ transform: `translateY(${topSpacerHeight}px)`, willChange: 'transform' }}>
                <section
                  className={`photo-grid ${density !== 'all' ? `mode-${density}` : ''}`}
                  id="photoGrid"
                  style={{ '--grid-cols': activeCols, gap: `${activeGap}px` } as React.CSSProperties}
                >
                  {visiblePhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      isSelected={selectedIds.has(photo.id)}
                      isFav={Boolean(photo.favorite || favoriteIds.has(photo.id))}
                      filterStyle={getFilterStyle(photo.id)}
                      onSingleTap={handlePhotoSingleTap}
                      onDoubleTap={handlePhotoDoubleTap}
                      onLongPress={handlePhotoLongPress}
                      onToggleFav={handleToggleFav}
                    />
                  ))}
                </section>
              </div>
            </div>
          </div>

          {/* Floating Batch Action Dock (Appears when items are selected) */}
          <div className={`action-dock ${selectMode && selectedIds.size > 0 ? 'visible' : ''}`} id="actionDock">
            <button
              type="button"
              className={`pill-btn ${isAllSelected ? 'active-toggle' : ''}`}
              id="batchSelectAllBtn"
              onClick={handleToggleSelectAll}
              title={isAllSelected ? 'Deselect All Photos' : 'Select All Photos'}
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span id="selectedLabel" style={{ fontSize: '13px', fontWeight: 700 }}>
              {selectedIds.size} Selected
            </span>
            {filter === 'trash' ? (
              <>
                <button
                  type="button"
                  className="pill-btn"
                  onClick={() => {
                    const toRestore = items.filter((p) => selectedIds.has(p.id));
                    toRestore.forEach((p) => handleRestorePhoto(p.id));
                    setSelectedIds(new Set());
                    setSelectMode(false);
                  }}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="pill-btn text-rose-500 hover:bg-rose-500/10"
                  onClick={() => {
                    const toDelete = items.filter((p) => selectedIds.has(p.id));
                    requestPermanentDelete(toDelete);
                  }}
                >
                  Delete Permanently
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="pill-btn"
                  id="batchFavBtn"
                  onClick={handleBatchFavorite}
                >
                  Favorite
                </button>
                <button
                  type="button"
                  className="pill-btn"
                  onClick={handleBatchShare}
                  title="Share Selected"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
                <button
                  type="button"
                  className="pill-btn text-rose-500 hover:bg-rose-500/10"
                  onClick={() => {
                    const toTrash = items.filter((p) => selectedIds.has(p.id));
                    requestTrash(toTrash);
                  }}
                >
                  Delete
                </button>
              </>
            )}
            <button
              type="button"
              className="pill-btn primary"
              id="batchDoneBtn"
              onClick={() => {
                setSelectedIds(new Set());
                setSelectMode(false);
              }}
            >
              Done
            </button>
          </div>
        </main>
      </div>

      {/* Spacious macOS Preferences / Settings Modal Window */}
      {isSettingsOpen && (
        <div
          className="settings-modal-overlay open"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="settings-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <div className="settings-modal-title">
                <Palette className="w-4 h-4 text-blue-500" />
                <span>Gallery Preferences</span>
              </div>
              <button
                type="button"
                className="pill-btn icon-only"
                onClick={() => setIsSettingsOpen(false)}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="settings-modal-body">
              {/* Category Segmented Pill with Uniform Shape and Size */}
              <div className="settings-tabs-spacious">
                <button
                  type="button"
                  className={`settings-tab-spacious-btn ${settingsTab === 'theme' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('theme')}
                >
                  <Palette />
                  <span>Theme & View</span>
                </button>
                <button
                  type="button"
                  className={`settings-tab-spacious-btn ${settingsTab === 'folders' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('folders')}
                >
                  <Folder />
                  <span>Folders & Storage</span>
                </button>
                <button
                  type="button"
                  className={`settings-tab-spacious-btn ${settingsTab === 'developer' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('developer')}
                >
                  <User />
                  <span>Developer & About</span>
                </button>
              </div>

              {/* 1. Theme & Appearance Tab */}
              {settingsTab === 'theme' && (
                <div>
                  <div className="popover-section-title">Color Themes</div>
                  <div className="theme-grid">
                    <button
                      type="button"
                      className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => {
                        setSettings((s) => ({ ...s, theme: 'light' }));
                        showToast('Theme: Light');
                      }}
                    >
                      <span className="theme-orb" style={{ background: 'linear-gradient(135deg, #ffffff, #dfe5ee)' }}></span>
                      <span className="theme-meta">
                        <span className="theme-name">Light</span>
                        <span className="theme-desc">Crisp Studio</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`theme-option ${settings.theme === 'oled' ? 'active' : ''}`}
                      onClick={() => {
                        setSettings((s) => ({ ...s, theme: 'oled' }));
                        showToast('Theme: Extreme Dark');
                      }}
                    >
                      <span className="theme-orb" style={{ background: 'linear-gradient(135deg, #1c1d21, #000000)' }}></span>
                      <span className="theme-meta">
                        <span className="theme-name">Extreme Dark</span>
                        <span className="theme-desc">Pure OLED</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`theme-option ${settings.theme === 'sand' ? 'active' : ''}`}
                      onClick={() => {
                        setSettings((s) => ({ ...s, theme: 'sand' }));
                        showToast('Theme: Light Brown');
                      }}
                    >
                      <span className="theme-orb" style={{ background: 'linear-gradient(135deg, #f6ede3, #d8c3ad)' }}></span>
                      <span className="theme-meta">
                        <span className="theme-name">Light Brown</span>
                        <span className="theme-desc">Warm Sand</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`theme-option ${settings.theme === 'mocha' ? 'active' : ''}`}
                      onClick={() => {
                        setSettings((s) => ({ ...s, theme: 'mocha' }));
                        showToast('Theme: Mocha');
                      }}
                    >
                      <span className="theme-orb" style={{ background: 'linear-gradient(135deg, #423328, #1c1510)' }}></span>
                      <span className="theme-meta">
                        <span className="theme-name">Mocha</span>
                        <span className="theme-desc">Deep Espresso</span>
                      </span>
                    </button>
                  </div>

                  <div className="popover-section-title mt-6">Display Elements</div>
                  <div className="setting-toggles">
                    <div className="toggle-row">
                      <span>Show Memories Showcase Banner</span>
                      <button
                        type="button"
                        className={`apple-switch ${settings.showMemories ? 'on' : ''}`}
                        onClick={() => setSettings((s) => ({ ...s, showMemories: !s.showMemories }))}
                        aria-label="Toggle Memories"
                      >
                        <div className="apple-switch-knob"></div>
                      </button>
                    </div>
                    <div className="toggle-row">
                      <span>Show Live Photo Badges</span>
                      <button
                        type="button"
                        className={`apple-switch ${settings.showLiveBadges ? 'on' : ''}`}
                        onClick={() => setSettings((s) => ({ ...s, showLiveBadges: !s.showLiveBadges }))}
                        aria-label="Toggle Live Badges"
                      >
                        <div className="apple-switch-knob"></div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Folders & Storage Tab (Spacious & Clean) */}
              {settingsTab === 'folders' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="popover-section-title !mb-1">Mac Folders & Storage</div>
                      <div className="text-[12px] text-[var(--text-secondary)]">
                        Control which folders on your Mac are included in the gallery
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleScanMac()}
                        disabled={isScanning}
                        className="pill-btn !h-8 !px-3 text-[12px] gap-1.5"
                      >
                        <FolderSync className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                        <span>{isScanning ? 'Scanning...' : 'Rescan All'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomFolder}
                        className="pill-btn primary !h-8 !px-3 text-[12px] gap-1.5"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Add Folder</span>
                      </button>
                    </div>
                  </div>

                  {/* Standard System Folders with Spacious Uniform Rows */}
                  {[
                    { name: 'Pictures', path: '/Pictures', icon: Images, count: counts.pictures },
                    { name: 'Desktop', path: '/Desktop', icon: Monitor, count: counts.desktop },
                    { name: 'Downloads', path: '/Downloads', icon: ArrowDownCircle, count: counts.downloads },
                    { name: 'Movies', path: '/Movies', icon: Film, count: counts.movies },
                  ].map((sf) => {
                    const Icon = sf.icon;
                    const isEnabled = !(settings.foldersConfig || []).some((c) => c.path === sf.path && !c.enabled);
                    return (
                      <div key={sf.path} className="spacious-folder-row">
                        <div className="spacious-folder-left">
                          <div className="spacious-folder-icon">
                            <Icon />
                          </div>
                          <div className="spacious-folder-meta">
                            <span className="spacious-folder-name">{sf.name}</span>
                            <span className="spacious-folder-path">{sf.path} • {sf.count.toLocaleString()} items</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFolder(sf.path)}
                          className={`apple-switch ${isEnabled ? 'on' : ''}`}
                        >
                          <div className="apple-switch-knob"></div>
                        </button>
                      </div>
                    );
                  })}

                  {/* Custom Added Folders */}
                  {folders.filter((f) => !f.isStandard).map((cf) => (
                    <div key={cf.path} className="spacious-folder-row">
                      <div className="spacious-folder-left">
                        <div className="spacious-folder-icon">
                          <Folder />
                        </div>
                        <div className="spacious-folder-meta">
                          <span className="spacious-folder-name">{cf.name}</span>
                          <span className="spacious-folder-path">{cf.path} • {cf.itemCount.toLocaleString()} items</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFolders((prev) => prev.filter((f) => f.path !== cf.path));
                            setItems((prev) => prev.filter((p) => !p.folderPath.startsWith(cf.path)));
                            showToast('Folder removed');
                          }}
                          className="pill-btn !h-7 !px-2.5 text-[11.5px] text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Developer & About Tab (Featuring Salman Irshad) */}
              {settingsTab === 'developer' && (
                <div>
                  <div className="developer-profile-card">
                    <div className="developer-avatar">
                      SI
                    </div>
                    <div>
                      <div className="text-[17px] font-bold text-[var(--text-primary)]">Salman Irshad</div>
                      <div className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                        Creator & Lead Architect
                      </div>
                      <div className="text-[11.5px] font-semibold text-[var(--accent)] mt-1 tracking-wide">
                        Gallery for macOS • Version 1.0.0 (Apple Silicon Native)
                      </div>
                    </div>
                  </div>

                  <div className="developer-story-card">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--accent)] mb-2">
                      <Zap className="w-4 h-4" />
                      <span>Why I Created Gallery</span>
                    </div>
                    <p className="text-[13px] text-[var(--text-primary)] leading-relaxed mb-2.5">
                      “I created Gallery because I wanted a pure, blisteringly fast, and distraction-free photo experience for macOS. Most gallery apps today are bogged down by cloud lock-in, subscriptions, or sluggish web wrappers.
                    </p>
                    <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
                      Gallery is crafted to give you 100% control and ownership of your photos, running entirely offline with fluid Apple springs and bespoke themes.”
                    </p>
                    <div className="text-[12px] text-[var(--text-tertiary)] italic font-medium mt-3">
                      — Salman Irshad
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-pill)] text-[12px] font-medium text-[var(--text-secondary)]">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>100% Private & Offline</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-pill)] text-[12px] font-medium text-[var(--text-secondary)]">
                      <Zap className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Engineered for 10k+ Photos</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accidental Deletion Confirmation Modal */}
      {deleteConfirmTarget && (
        <div
          className="confirm-modal-overlay open"
          onClick={() => setDeleteConfirmTarget(null)}
        >
          <div
            className="confirm-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-icon">
              <Trash2 />
            </div>
            <div className="confirm-modal-title">
              {deleteConfirmTarget.mode === 'permanent'
                ? `Permanently Delete ${deleteConfirmTarget.items.length === 1 ? 'this item' : `${deleteConfirmTarget.items.length} items`}?`
                : `Move ${deleteConfirmTarget.items.length === 1 ? 'this photo' : `${deleteConfirmTarget.items.length} photos`} to Trash?`}
            </div>
            <div className="confirm-modal-desc">
              {deleteConfirmTarget.mode === 'permanent'
                ? 'This action cannot be undone. The file will be permanently deleted from your disk.'
                : 'Items moved to Trash can be restored anytime from the Trash section in the sidebar.'}
            </div>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-modal-btn cancel"
                onClick={() => setDeleteConfirmTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-modal-btn danger"
                onClick={() => {
                  if (deleteConfirmTarget.mode === 'permanent') {
                    void confirmPermanentDelete(deleteConfirmTarget.items);
                  } else {
                    confirmMoveToTrash(deleteConfirmTarget.items);
                  }
                }}
              >
                {deleteConfirmTarget.mode === 'permanent' ? 'Delete Permanently' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared-Element Full-Space FLIP Lightbox */}
      <div className={`lightbox ${lightboxPhoto ? 'open' : ''}`} id="lightbox">
        <div className="lb-topbar">
          <button
            type="button"
            className="pill-btn"
            id="lbClose"
            onClick={() => {
              setLightboxPhoto(null);
              setZoomScale(1);
              setPanOffset({ x: 0, y: 0 });
            }}
          >
            <ChevronLeft size={16} className="shrink-0" />
            <span>Library</span>
          </button>

          <div className="lb-pill-group">
            {!isVideoCurrent && (
              <>
                <button
                  type="button"
                  className={`pill-btn ${isLivePlaying ? 'primary' : ''}`}
                  id="lbLiveBtn"
                  onClick={() => {
                    setIsLivePlaying(false);
                    setTimeout(() => setIsLivePlaying(true), 20);
                    setTimeout(() => setIsLivePlaying(false), 2400);
                  }}
                >
                  LIVE
                </button>
                <button
                  type="button"
                  className={`pill-btn ${zoomScale > 1 ? 'active-toggle' : ''}`}
                  id="lbZoomBtn"
                  onClick={() => {
                    if (zoomScale > 1) {
                      setZoomScale(1);
                      setPanOffset({ x: 0, y: 0 });
                    } else {
                      setZoomScale(2.5);
                    }
                  }}
                >
                  <ZoomIn size={14} className="shrink-0" />
                  <span>{zoomScale > 1 ? `${Math.round(zoomScale * 100)}%` : 'Zoom'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              className={`pill-btn ${lightboxPhoto && (lightboxPhoto.favorite || favoriteIds.has(lightboxPhoto.id)) ? 'text-rose-500' : ''}`}
              id="lbFavBtn"
              onClick={() => lightboxPhoto && handleToggleFav(lightboxPhoto.id)}
            >
              <Heart size={14} className={lightboxPhoto && (lightboxPhoto.favorite || favoriteIds.has(lightboxPhoto.id)) ? 'fill-rose-500 text-rose-500 shrink-0' : 'shrink-0'} />
              <span>{lightboxPhoto && (lightboxPhoto.favorite || favoriteIds.has(lightboxPhoto.id)) ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button
              type="button"
              className="pill-btn"
              onClick={() => lightboxPhoto && handleSharePhoto(lightboxPhoto)}
              title="Share Photo"
            >
              <Share2 size={14} className="shrink-0" />
              <span>Share</span>
            </button>

            {lightboxPhoto?.isDeleted || filter === 'trash' ? (
              <>
                <button
                  type="button"
                  className="pill-btn text-emerald-500 hover:bg-emerald-500/10"
                  onClick={() => {
                    if (lightboxPhoto) {
                      handleRestorePhoto(lightboxPhoto.id);
                      setLightboxPhoto(null);
                    }
                  }}
                >
                  Put Back
                </button>
                <button
                  type="button"
                  className="pill-btn text-rose-500 hover:bg-rose-500/10"
                  onClick={() => {
                    if (lightboxPhoto) requestPermanentDelete([lightboxPhoto]);
                  }}
                >
                  <Trash2 size={14} className="shrink-0" />
                  <span>Delete Permanently</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pill-btn text-rose-500 hover:bg-rose-500/10"
                onClick={() => {
                  if (lightboxPhoto) requestTrash([lightboxPhoto]);
                }}
              >
                <Trash2 size={14} className="shrink-0" />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              className={`pill-btn ${drawerMode === 'info' ? 'active-toggle' : ''}`}
              id="lbInfoBtn"
              onClick={() => setDrawerMode((prev) => (prev === 'info' ? null : 'info'))}
            >
              <Info size={14} className="shrink-0" />
              <span>Info</span>
            </button>
            <button
              type="button"
              className={`pill-btn primary ${drawerMode === 'edit' ? 'filter brightness-110' : ''}`}
              id="lbEditBtn"
              onClick={() => setDrawerMode((prev) => (prev === 'edit' ? null : 'edit'))}
            >
              <Sliders size={14} className="shrink-0" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        <div className="lb-body">
          <div
            ref={stageRef}
            className="lb-stage"
            onWheel={handleStageWheel}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
          >
            <button
              type="button"
              className="lb-nav-arrow lb-prev"
              id="lbPrev"
              onClick={() => stepLightbox(-1)}
              title="Previous (Left Arrow)"
            >
              <ChevronLeft size={20} className="shrink-0" />
            </button>

            <div
              className={`lb-image-wrap ${zoomScale > 1 ? 'zoomed' : ''} ${isLivePlaying ? 'live-playing' : ''}`}
              id="lbImageWrap"
              onDoubleClick={handleStageDoubleClick}
            >
              {lightboxPhoto && (
                isVideoCurrent ? (
                  <ModernAppleVideoPlayer
                    key={lightboxPhoto.id}
                    src={lightboxPhoto.fileUrl}
                    filterStyle={getFilterStyle(lightboxPhoto.id)}
                  />
                ) : (
                  <img
                    id="lbImage"
                    src={lightboxPhoto.fileUrl || lightboxPhoto.thumbnailUrl}
                    alt={lightboxPhoto.filename || ''}
                    draggable={false}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                      cursor: zoomScale > 1 ? (isDraggingZoom ? 'grabbing' : 'grab') : 'zoom-in',
                      transition: isDraggingZoom ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      filter: getFilterStyle(lightboxPhoto.id),
                    }}
                  />
                )
              )}
            </div>

            <button
              type="button"
              className="lb-nav-arrow lb-next"
              id="lbNext"
              onClick={() => stepLightbox(1)}
              title="Next (Right Arrow)"
            >
              <ChevronLeft size={20} className="shrink-0 rotate-180" />
            </button>
          </div>

          {/* Inspector & Edit Drawer */}
          <aside className={`lb-drawer ${drawerMode ? 'open' : ''}`} id="lbDrawer">
            {drawerMode === 'info' && lightboxPhoto && (
              <div>
                <div className="drawer-title">
                  <span>Photo Info</span>
                  <button
                    type="button"
                    className="pill-btn !h-7 !px-3 text-[12px]"
                    onClick={() => setDrawerMode(null)}
                  >
                    Done
                  </button>
                </div>
                <div className="exif-card">
                  <div className="exif-row"><span>Title</span><strong>{lightboxPhoto.filename}</strong></div>
                  <div className="exif-row"><span>Captured</span><strong>{formatDateFull(lightboxPhoto.createdAt || lightboxPhoto.modifiedAt)}</strong></div>
                  <div className="exif-row"><span>Collection</span><strong style={{ textTransform: 'capitalize' }}>{lightboxPhoto.folderName}</strong></div>
                </div>
                <div className="exif-card">
                  <div className="exif-row"><span>Device</span><strong>{lightboxPhoto.camera ? lightboxPhoto.camera.split('•')[0] : 'iPhone 16 Pro'}</strong></div>
                  <div className="exif-row"><span>Optics</span><strong>{lightboxPhoto.camera ? lightboxPhoto.camera.split('•')[1] : '24mm f/1.78'}</strong></div>
                  <div className="exif-row"><span>Dimensions</span><strong>{lightboxPhoto.width && lightboxPhoto.height ? `${lightboxPhoto.width} × ${lightboxPhoto.height}` : '4032 × 3024'}</strong></div>
                  <div className="exif-row"><span>Format</span><strong>{lightboxPhoto.format || 'HEIF'} • Display P3</strong></div>
                </div>

                {isElectron && lightboxPhoto.filePath && (
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => window.electronAPI?.showInFinder(lightboxPhoto.filePath)}
                      className="pill-btn w-full justify-center !h-8 text-[12px]"
                    >
                      Show in Finder
                    </button>
                    <button
                      type="button"
                      onClick={() => window.electronAPI?.openPath(lightboxPhoto.filePath)}
                      className="pill-btn w-full justify-center !h-8 text-[12px]"
                    >
                      Open with Preview
                    </button>
                  </div>
                )}
              </div>
            )}

            {drawerMode === 'edit' && lightboxPhoto && (
              <div>
                {(() => {
                  const e = edits[lightboxPhoto.id] || { brightness: 100, contrast: 100, saturate: 100, warmth: 0 };
                  return (
                    <div>
                      <div className="drawer-title">
                        <span>Edit Studio</span>
                        <button
                          type="button"
                          className="pill-btn !h-7 !px-3 text-[12px]"
                          onClick={() => {
                            setEdits((prev) => {
                              const next = { ...prev };
                              delete next[lightboxPhoto.id];
                              return next;
                            });
                            showToast('Original look restored');
                          }}
                        >
                          Reset
                        </button>
                      </div>

                      <div className="preset-pills">
                        <button
                          type="button"
                          className="pill-btn !h-7 !px-3 text-[11.5px]"
                          onClick={() => setEdits((prev) => ({ ...prev, [lightboxPhoto.id]: { brightness: 106, contrast: 114, saturate: 132, warmth: 6 } }))}
                        >
                          Vivid
                        </button>
                        <button
                          type="button"
                          className="pill-btn !h-7 !px-3 text-[11.5px]"
                          onClick={() => setEdits((prev) => ({ ...prev, [lightboxPhoto.id]: { brightness: 104, contrast: 106, saturate: 115, warmth: 28 } }))}
                        >
                          Golden
                        </button>
                        <button
                          type="button"
                          className="pill-btn !h-7 !px-3 text-[11.5px]"
                          onClick={() => setEdits((prev) => ({ ...prev, [lightboxPhoto.id]: { brightness: 105, contrast: 124, saturate: 0, warmth: 0 } }))}
                        >
                          Noir
                        </button>
                      </div>

                      <div className="slider-group">
                        <div className="edit-slider-item">
                          <div className="edit-slider-header"><span>Brilliance</span><span>{e.brightness}%</span></div>
                          <input
                            type="range"
                            min="60"
                            max="150"
                            value={e.brightness}
                            onChange={(ev) => setEdits((prev) => ({ ...prev, [lightboxPhoto.id]: { ...e, brightness: Number(ev.target.value) } }))}
                          />
                        </div>
                        <div className="edit-slider-item">
                          <div className="edit-slider-header"><span>Contrast</span><span>{e.contrast}%</span></div>
                          <input
                            type="range"
                            min="60"
                            max="150"
                            value={e.contrast}
                            onChange={(ev) => setEdits((prev) => ({ ...prev, [lightboxPhoto.id]: { ...e, contrast: Number(ev.target.value) } }))}
                          />
                        </div>
                        <div className="edit-slider-item">
                          <div className="edit-slider-header"><span>Vibrance</span><span>{e.saturate}%</span></div>
                          <input
                            type="range"
                            min="0"
                            max="180"
                            value={e.saturate}
                            onChange={(ev) => setEdits((prev) => ({ ...prev, [lightboxPhoto.id]: { ...e, saturate: Number(ev.target.value) } }))}
                          />
                        </div>
                        <div className="edit-slider-item">
                          <div className="edit-slider-header"><span>Warmth</span><span>{e.warmth}%</span></div>
                          <input
                            type="range"
                            min="0"
                            max="55"
                            value={e.warmth}
                            onChange={(ev) => setEdits((prev) => ({ ...prev, [lightboxPhoto.id]: { ...e, warmth: Number(ev.target.value) } }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </aside>
        </div>

        <div
          className="lb-filmstrip"
          id="lbFilmstrip"
          ref={filmstripRef}
          onWheel={handleFilmstripWheel}
        >
          {filteredPhotos.map((p) => (
            <div
              key={p.id}
              data-id={p.id}
              className={`film-thumb ${p.id === lightboxPhoto?.id ? 'active' : ''}`}
              onClick={() => {
                setLightboxPhoto(p);
                setZoomScale(1);
                setPanOffset({ x: 0, y: 0 });
                setIsLivePlaying(false);
              }}
              title={p.filename}
            >
              <img src={p.thumbnailUrl || p.fileUrl} alt={p.filename || ''} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
