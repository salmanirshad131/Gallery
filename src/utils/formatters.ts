import { MediaCategory, MediaItem, ViewSegment } from '../types/gallery';

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unit = units[Math.min(i, units.length - 1)];
  const val = (bytes / Math.pow(1024, i)).toFixed(valDecimals(i));
  return `${val} ${unit}`;
}

function valDecimals(idx: number): number {
  if (idx <= 1) return 0;
  return 1;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const total = Math.round(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatDateShort(timestamp: number): string {
  if (!timestamp) return 'Unknown date';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateFull(timestamp: number): string {
  if (!timestamp) return 'Unknown date';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateHeader(timestamp: number): string {
  if (!timestamp) return 'Undated';
  const d = new Date(timestamp);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }

  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  }

  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMonthYear(timestamp: number): string {
  if (!timestamp) return 'Undated';
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatYear(timestamp: number): string {
  if (!timestamp) return 'Undated';
  const d = new Date(timestamp);
  return String(d.getFullYear());
}

export interface DateGroup {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: number;
  items: MediaItem[];
  photoCount: number;
  videoCount: number;
}

const dayHeaderCache = new Map<string, string>();
const monthHeaderCache = new Map<string, string>();

/**
 * Pre-indexes invariant metadata on a MediaItem once at ingest/load time.
 * Avoids repeated Date parsing, formatting, and lowercase allocations during rendering.
 */
export function indexMediaItem(item: MediaItem): MediaItem {
  if (item._searchText && item.dayKey) return item;

  const ts = item.effectiveDate || Math.max(item.createdAt || 0, item.modifiedAt || 0) || Date.now();
  const d = new Date(ts);
  const yearStr = String(d.getFullYear());
  const monthStr = `${yearStr}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const dayStr = `${monthStr}-${String(d.getDate()).padStart(2, '0')}`;

  const searchText = `${item.filename} ${item.folderName || ''} ${item.format || ''} ${item.category || ''}`.toLowerCase();

  return {
    ...item,
    effectiveDate: ts,
    yearKey: yearStr,
    monthKey: monthStr,
    dayKey: dayStr,
    _searchText: searchText,
  };
}

function getCachedDateHeader(ts: number, dayKey: string): string {
  let header = dayHeaderCache.get(dayKey);
  if (!header) {
    header = formatDateHeader(ts);
    dayHeaderCache.set(dayKey, header);
  }
  return header;
}

function getCachedMonthHeader(ts: number, monthKey: string): string {
  let header = monthHeaderCache.get(monthKey);
  if (!header) {
    header = formatMonthYear(ts);
    monthHeaderCache.set(monthKey, header);
  }
  return header;
}

export function groupMediaByDate(items: MediaItem[], segment: ViewSegment): DateGroup[] {
  if (items.length === 0) return [];

  const groups = new Map<
    string,
    { title: string; timestamp: number; items: MediaItem[]; pCount: number; vCount: number }
  >();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const ts = item.effectiveDate || item.createdAt || item.modifiedAt || 0;

    let key: string;
    let title: string;

    if (segment === 'years') {
      key = item.yearKey || String(new Date(ts).getFullYear());
      title = key;
    } else if (segment === 'months') {
      key =
        item.monthKey ||
        `${new Date(ts).getFullYear()}-${String(new Date(ts).getMonth() + 1).padStart(2, '0')}`;
      title = getCachedMonthHeader(ts, key);
    } else {
      // 'days' & 'all'
      key =
        item.dayKey ||
        `${new Date(ts).getFullYear()}-${String(new Date(ts).getMonth() + 1).padStart(2, '0')}-${String(new Date(ts).getDate()).padStart(2, '0')}`;
      title = getCachedDateHeader(ts, key);
    }

    let g = groups.get(key);
    if (!g) {
      g = { title, timestamp: ts, items: [], pCount: 0, vCount: 0 };
      groups.set(key, g);
    }

    g.items.push(item);
    if (item.category === 'video' || item.category === 'screen_recording') {
      g.vCount++;
    } else {
      g.pCount++;
    }
  }

  const result: DateGroup[] = [];
  groups.forEach((val, key) => {
    const subParts: string[] = [];
    if (val.pCount > 0) subParts.push(`${val.pCount} ${val.pCount === 1 ? 'Photo' : 'Photos'}`);
    if (val.vCount > 0) subParts.push(`${val.vCount} ${val.vCount === 1 ? 'Video' : 'Videos'}`);

    result.push({
      id: key,
      title: val.title,
      subtitle: subParts.join(' • '),
      timestamp: val.timestamp,
      items: val.items,
      photoCount: val.pCount,
      videoCount: val.vCount,
    });
  });

  return result;
}

export function detectMediaCategory(
  filename: string,
  ext: string,
  filePath: string,
  aspectRatio?: number
): MediaCategory {
  const lowerExt = ext.toLowerCase();
  const lowerName = filename.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Video check
  const isVideo = ['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv'].includes(lowerExt);
  if (isVideo) {
    if (
      lowerName.includes('screen recording') ||
      lowerName.includes('screen_recording') ||
      lowerPath.includes('screen recording')
    ) {
      return 'screen_recording';
    }
    return 'video';
  }

  // GIF / animated
  if (lowerExt === '.gif') {
    return 'gif';
  }

  // Screenshot check (macOS default naming: "Screenshot 2026-...", "Screen Shot 2026-...", "vlcsnap-...", "PSX_...")
  if (
    lowerName.startsWith('screenshot') ||
    lowerName.startsWith('screen shot') ||
    lowerName.startsWith('screen_shot') ||
    lowerName.startsWith('vlcsnap') ||
    lowerPath.includes('/screenshots/') ||
    lowerPath.includes('/ss/')
  ) {
    return 'screenshot';
  }

  // Panorama
  if (aspectRatio && aspectRatio > 2.2) {
    return 'panorama';
  }

  return 'photo';
}
