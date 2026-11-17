export type MediaCategory =
  | 'photo'
  | 'video'
  | 'screenshot'
  | 'screen_recording'
  | 'panorama'
  | 'gif';

export type SidebarSection =
  | 'all'
  | 'favorites'
  | 'recents'
  | 'photos'
  | 'videos'
  | 'screenshots'
  | 'screen_recordings'
  | 'panoramas'
  | 'gifs'
  | 'trash'
  | `folder:${string}`
  | `album:${string}`;

export type ViewSegment = 'days' | 'months' | 'years' | 'all';

export type AspectRatioMode = 'square' | 'original';

export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'name-asc'
  | 'name-desc'
  | 'size-desc'
  | 'size-asc';

export type ThemeMode = 'light' | 'oled' | 'sand' | 'mocha' | 'system';

export interface MediaItem {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number; // bytes
  fileUrl: string;
  thumbnailUrl: string;
  category: MediaCategory;
  format: string; // "JPEG", "PNG", "MOV", etc.
  mimeType: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  duration?: number; // seconds for videos
  createdAt: number; // timestamp ms
  modifiedAt: number; // timestamp ms
  favorite: boolean;
  folderPath: string;
  folderName: string;
  albumIds?: string[];
  isDeleted?: boolean;
  camera?: string;

  // High-Performance Invariant Indices (for 50,000+ photo scale)
  effectiveDate?: number; // max(createdAt, modifiedAt)
  dayKey?: string;        // 'YYYY-MM-DD'
  monthKey?: string;      // 'YYYY-MM'
  yearKey?: string;       // 'YYYY'
  _searchText?: string;   // Pre-lowercased composite search string
}

export interface Album {
  id: string;
  name: string;
  createdAt: number;
  itemIds: string[];
  coverItemId?: string;
}

export interface ScannedFolderInfo {
  id: string;
  name: string;
  path: string;
  itemCount: number;
  lastScanned: number;
  isStandard?: boolean; // Pictures, Desktop, Downloads, Movies
  enabled?: boolean;
}

export interface FolderScanConfig {
  path: string;
  name: string;
  enabled: boolean;
  isStandard?: boolean;
}

export interface GallerySettings {
  gridSize: number; // 130, 180, 240, 320, 420
  aspectRatioMode: AspectRatioMode;
  theme: ThemeMode;
  sortBy: SortOption;
  autoScanOnStartup: boolean;
  favoritesOnly: boolean;
  foldersConfig: FolderScanConfig[];
  showMemories: boolean;
  showLiveBadges: boolean;
}

export const ZOOM_STEPS = [130, 180, 240, 320, 420];

export const DEFAULT_GALLERY_SETTINGS: GallerySettings = {
  gridSize: 240,
  aspectRatioMode: 'square',
  theme: 'light',
  sortBy: 'date-desc',
  autoScanOnStartup: true,
  favoritesOnly: false,
  foldersConfig: [],
  showMemories: true,
  showLiveBadges: true,
};
