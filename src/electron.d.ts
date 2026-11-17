import { GallerySettings, MediaItem, ScannedFolderInfo, Album, FolderScanConfig } from './types/gallery';

export interface ElectronAPI {
  isElectron?: boolean;
  isMac?: boolean;
  scanMacDefault: (customTargets?: FolderScanConfig[]) => Promise<{ folders: ScannedFolderInfo[]; items: MediaItem[] }>;
  scanFolderPath: (folderPath: string) => Promise<{ folder: ScannedFolderInfo; items: MediaItem[] } | null>;
  selectFolders: () => Promise<string[] | null>;
  showInFinder: (filePath: string) => Promise<boolean>;
  openPath: (filePath: string) => Promise<boolean>;
  trashItem: (filePath: string) => Promise<boolean>;
  loadSettings: () => Promise<GallerySettings | null>;
  saveSettings: (settings: GallerySettings) => Promise<boolean>;
  loadLibrary: () => Promise<{ folders: ScannedFolderInfo[]; items: MediaItem[] } | null>;
  saveLibrary: (libraryData: { folders: ScannedFolderInfo[]; items: MediaItem[] }) => Promise<boolean>;
  loadFavorites: () => Promise<string[] | null>;
  saveFavorites: (favorites: string[]) => Promise<boolean>;
  loadAlbums: () => Promise<Album[] | null>;
  saveAlbums: (albums: Album[]) => Promise<boolean>;
  getServerPort: () => Promise<number>;
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

