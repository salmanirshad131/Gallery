const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const express = require('express');

let mainWindow = null;
let serverInstance = null;
let serverPort = 0;

// Storage paths
const userDataPath = app.getPath('userData');
const THUMBNAILS_DIR = path.join(userDataPath, 'thumbnails');
const SETTINGS_FILE = path.join(userDataPath, 'gallery_settings.json');
const LIBRARY_FILE = path.join(userDataPath, 'gallery_library.json');
const FAVORITES_FILE = path.join(userDataPath, 'gallery_favorites.json');
const ALBUMS_FILE = path.join(userDataPath, 'gallery_albums.json');

try {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
} catch (err) {
  console.error('Failed to create thumbnail dir:', err);
}

async function safeReadJsonAsync(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      const data = await fs.promises.readFile(file, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Failed to read ${file}:`, err);
  }
  return fallback;
}

function safeReadJson(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Failed to read ${file}:`, err);
  }
  return fallback;
}

async function safeWriteJsonAtomic(file, data) {
  const tmpFile = `${file}.tmp.${Date.now()}`;
  try {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    // Strip ephemeral URLs if present to reduce file size from 45MB to ~5MB
    const sanitized = {
      ...data,
      items: Array.isArray(data.items)
        ? data.items.map(({ fileUrl, thumbnailUrl, ...rest }) => rest)
        : data.items,
    };
    await fs.promises.writeFile(tmpFile, JSON.stringify(sanitized), 'utf8');
    await fs.promises.rename(tmpFile, file);
    return true;
  } catch (err) {
    console.error(`Failed atomic write to ${file}:`, err);
    try { await fs.promises.unlink(tmpFile); } catch {}
    return false;
  }
}

function safeWriteJson(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data), 'utf8');
    return true;
  } catch (err) {
    console.error(`Failed to write ${file}:`, err);
    return false;
  }
}

// ----------------- Supported Media Formats -----------------
const PHOTO_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
  '.avif', '.gif', '.bmp', '.tiff', '.tif', '.svg',
]);

const VIDEO_EXTS = new Set([
  '.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv',
]);

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
};

// ----------------- Bounded Concurrency Native Thumbnail Worker Pool -----------------
const MAX_CONCURRENT_THUMBNAILS = Math.max(2, Math.min(os.cpus().length - 1, 4));
let activeThumbnailJobs = 0;
const thumbnailQueue = [];
const inFlightThumbnails = new Map();
const knownCachedThumbnails = new Set();

function processThumbnailQueue() {
  if (activeThumbnailJobs >= MAX_CONCURRENT_THUMBNAILS || thumbnailQueue.length === 0) {
    return;
  }
  const job = thumbnailQueue.shift();
  if (job.signal && job.signal.aborted) {
    job.resolve(false);
    setImmediate(processThumbnailQueue);
    return;
  }

  activeThumbnailJobs++;
  runThumbnailTask(job.filePath, job.cachePath, job.size, job.signal)
    .then((result) => {
      job.resolve(result);
    })
    .catch(() => {
      job.resolve(false);
    })
    .finally(() => {
      activeThumbnailJobs--;
      setImmediate(processThumbnailQueue);
    });
}

function generateThumbnailThrottled(filePath, cachePath, size = 400, signal = null) {
  if (knownCachedThumbnails.has(cachePath)) {
    return Promise.resolve(true);
  }

  // In-flight deduplication: Coalesce identical thumbnail requests into one promise
  if (inFlightThumbnails.has(cachePath)) {
    return inFlightThumbnails.get(cachePath);
  }

  const promise = new Promise((resolve) => {
    thumbnailQueue.push({ filePath, cachePath, size, signal, resolve });
    processThumbnailQueue();
  }).finally(() => {
    inFlightThumbnails.delete(cachePath);
  });

  inFlightThumbnails.set(cachePath, promise);
  return promise;
}

function runThumbnailTask(filePath, cachePath, size = 400, signal = null) {
  return new Promise((resolve) => {
    if (signal && signal.aborted) return resolve(false);

    const ext = path.extname(filePath).toLowerCase();

    // 1. For video files: use macOS qlmanage to render a QuickLook frame
    if (VIDEO_EXTS.has(ext)) {
      const tempOutDir = os.tmpdir();
      const child = execFile(
        '/usr/bin/qlmanage',
        ['-t', '-s', String(size), '-o', tempOutDir, filePath],
        (err) => {
          if (!err) {
            const generatedName = `${path.basename(filePath)}.png`;
            const generatedPath = path.join(tempOutDir, generatedName);
            if (fs.existsSync(generatedPath)) {
              // Convert to target cachePath JPEG using sips
              const sipsChild = execFile(
                '/usr/bin/sips',
                ['-s', 'format', 'jpeg', generatedPath, '--out', cachePath],
                () => {
                  try { fs.unlinkSync(generatedPath); } catch {}
                  const ok = fs.existsSync(cachePath);
                  if (ok) knownCachedThumbnails.add(cachePath);
                  resolve(ok);
                }
              );
              if (signal) {
                signal.addEventListener('abort', () => {
                  try { sipsChild.kill('SIGTERM'); } catch {}
                }, { once: true });
              }
              return;
            }
          }
          resolve(false);
        }
      );
      if (signal) {
        signal.addEventListener('abort', () => {
          try { child.kill('SIGTERM'); } catch {}
        }, { once: true });
      }
      return;
    }

    // 2. For image files (including HEIC, TIFF, PNG, JPEG): use macOS sips
    if (PHOTO_EXTS.has(ext)) {
      const child = execFile(
        '/usr/bin/sips',
        ['-s', 'format', 'jpeg', '-Z', String(size), filePath, '--out', cachePath],
        (err) => {
          if (!err && fs.existsSync(cachePath)) {
            knownCachedThumbnails.add(cachePath);
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );
      if (signal) {
        signal.addEventListener('abort', () => {
          try { child.kill('SIGTERM'); } catch {}
        }, { once: true });
      }
      return;
    }

    resolve(false);
  });
}

function getCacheKey(filePath, mtimeMs, size = 400) {
  const hash = crypto.createHash('md5').update(`${filePath}:${mtimeMs}:${size}`).digest('hex');
  return path.join(THUMBNAILS_DIR, `${hash}.jpg`);
}

// ----------------- Embedded Express Server -----------------
function startEmbeddedServer() {
  return new Promise((resolve, reject) => {
    const appExpress = express();
    appExpress.use(express.json({ limit: '20mb' }));

    // CORS & Range headers
    appExpress.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });

    // High-performance thumbnail endpoint with bounded concurrency & abort cancellation
    appExpress.get('/api/thumbnail', async (req, res) => {
      const rawPath = req.query.path;
      const size = Math.min(800, Math.max(100, Number(req.query.size) || 400));
      if (!rawPath || typeof rawPath !== 'string') {
        return res.status(400).send('Missing path parameter');
      }

      const filePath = path.resolve(rawPath);
      let stat;
      try {
        stat = await fs.promises.stat(filePath);
      } catch {
        return res.status(404).send('File not found');
      }

      const ext = path.extname(filePath).toLowerCase();
      // Fast path for small standard web images
      if (['.svg', '.gif'].includes(ext)) {
        res.setHeader('Content-Type', MIME_MAP[ext] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return fs.createReadStream(filePath).pipe(res);
      }

      const cachePath = getCacheKey(filePath, stat.mtimeMs, size);
      if (knownCachedThumbnails.has(cachePath) || fs.existsSync(cachePath)) {
        knownCachedThumbnails.add(cachePath);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return fs.createReadStream(cachePath).pipe(res);
      }

      // Abort controller cancels orphaned thumbnail tasks when user scrolls away
      const abortController = new AbortController();
      req.on('close', () => {
        abortController.abort();
      });

      // Bounded concurrency thumbnail generation
      const success = await generateThumbnailThrottled(filePath, cachePath, size, abortController.signal);
      if (success && fs.existsSync(cachePath)) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return fs.createReadStream(cachePath).pipe(res);
      }

      // Fallback: pipe original media if it's an image
      if (PHOTO_EXTS.has(ext)) {
        res.setHeader('Content-Type', MIME_MAP[ext] || 'image/jpeg');
        return fs.createReadStream(filePath).pipe(res);
      }

      return res.status(404).send('Could not generate thumbnail');
    });

    // Zero-delay streaming with Range support for high-res photos and 4K videos
    appExpress.get('/api/media', (req, res) => {
      const rawPath = req.query.path;
      if (!rawPath || typeof rawPath !== 'string') {
        return res.status(400).send('Missing path parameter');
      }

      const filePath = path.resolve(rawPath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
      }

      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch {
        return res.status(500).send('Cannot read file stats');
      }

      const fileSize = stat.size;
      const ext = path.extname(filePath).toLowerCase();

      // If HEIC / HEIF, convert to high-res JPEG cache for browser compatibility
      if (ext === '.heic' || ext === '.heif' || ext === '.tiff' || ext === '.tif') {
        const fullCachePath = getCacheKey(filePath, stat.mtimeMs, 2560);
        if (fs.existsSync(fullCachePath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=604800');
          return fs.createReadStream(fullCachePath).pipe(res);
        }
        execFile('/usr/bin/sips', ['-s', 'format', 'jpeg', filePath, '--out', fullCachePath], (err) => {
          if (!err && fs.existsSync(fullCachePath)) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=604800');
            return fs.createReadStream(fullCachePath).pipe(res);
          }
          res.status(500).send('Cannot display HEIC format');
        });
        return;
      }

      const contentType = MIME_MAP[ext] || 'application/octet-stream';
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        if (start >= fileSize) {
          res.status(416).send('Requested range not satisfiable');
          return;
        }
        const chunksize = end - start + 1;
        const stream = fs.createReadStream(filePath, { start, end, highWaterMark: 512 * 1024 });
        req.on('close', () => { stream.destroy(); });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunksize,
          'Content-Type': contentType,
        });
        stream.pipe(res);
      } else {
        const stream = fs.createReadStream(filePath, { highWaterMark: 512 * 1024 });
        req.on('close', () => { stream.destroy(); });
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
        });
        stream.pipe(res);
      }
    });

    // Static assets from Vite production build
    const distDir = path.resolve(__dirname, '../dist');
    appExpress.use(express.static(distDir));
    appExpress.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });

    const server = http.createServer(appExpress);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      serverPort = typeof address === 'object' && address ? address.port : 38421;
      console.log(`Apple Photos internal server listening on http://127.0.0.1:${serverPort}`);
      serverInstance = server;
      resolve(serverPort);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

// ----------------- High Performance macOS Media Scanner -----------------
const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.cache', 'Library', '.Trash',
  'Applications', 'System', 'tmp', '.npm', '.pnpm-store',
]);

function detectCategory(filename, ext, filePath) {
  const lowerExt = ext.toLowerCase();
  const lowerName = filename.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  if (VIDEO_EXTS.has(lowerExt)) {
    if (
      lowerName.includes('screen recording') ||
      lowerName.includes('screen_recording') ||
      lowerPath.includes('screen recording')
    ) {
      return 'screen_recording';
    }
    return 'video';
  }

  if (lowerExt === '.gif') {
    return 'gif';
  }

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

  return 'photo';
}

async function scanFolder(folderPath, maxDepth = 4) {
  const items = [];
  if (!fs.existsSync(folderPath)) return items;

  const queue = [{ dir: folderPath, depth: 0 }];
  let processedSinceYield = 0;

  while (queue.length > 0) {
    const { dir, depth } = queue.shift();
    if (depth > maxDepth) continue;

    let entries = [];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      if (ent.name.startsWith('.') && ent.name !== '.DS_Store') continue;

      const fullPath = path.join(dir, ent.name);

      if (ent.isDirectory()) {
        if (!IGNORED_DIRS.has(ent.name) && !ent.name.startsWith('.')) {
          queue.push({ dir: fullPath, depth: depth + 1 });
        }
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (PHOTO_EXTS.has(ext) || VIDEO_EXTS.has(ext)) {
          let stat = null;
          try {
            stat = await fs.promises.stat(fullPath);
          } catch {}

          if (stat && stat.size > 1024) { // Ignore 0-byte corrupt files
            const category = detectCategory(ent.name, ext, fullPath);
            const itemId = `media-${crypto.createHash('md5').update(fullPath).digest('hex').slice(0, 12)}`;

            items.push({
              id: itemId,
              filename: ent.name,
              filePath: fullPath,
              fileSize: stat.size,
              fileUrl: `http://127.0.0.1:${serverPort}/api/media?path=${encodeURIComponent(fullPath)}`,
              thumbnailUrl: `http://127.0.0.1:${serverPort}/api/thumbnail?path=${encodeURIComponent(fullPath)}&size=400`,
              category,
              format: ext.slice(1).toUpperCase(),
              mimeType: MIME_MAP[ext] || 'application/octet-stream',
              createdAt: stat.birthtimeMs || stat.mtimeMs || Date.now(),
              modifiedAt: stat.mtimeMs || Date.now(),
              folderPath: path.dirname(fullPath),
              folderName: path.basename(path.dirname(fullPath)),
              favorite: false,
            });
          }
        }
      }

      // Yield every 60 items so the Node event loop never starves
      if (++processedSinceYield >= 60) {
        processedSinceYield = 0;
        await new Promise((r) => setImmediate(r));
      }
    }
  }

  return items;
}

// ----------------- Create Electron Window -----------------
async function createWindow() {
  await startEmbeddedServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 620,
    title: 'Gallery',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 16 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window-fullscreen-changed', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window-fullscreen-changed', false);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  await mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);
}

// ----------------- IPC Handlers -----------------
ipcMain.handle('scan-mac-default', async (_event, customTargets) => {
  const home = os.homedir();
  let scanTargets = [
    { name: 'Pictures', path: path.join(home, 'Pictures'), enabled: true, isStandard: true },
    { name: 'Desktop', path: path.join(home, 'Desktop'), enabled: true, isStandard: true },
    { name: 'Downloads', path: path.join(home, 'Downloads'), enabled: true, isStandard: true },
    { name: 'Movies', path: path.join(home, 'Movies'), enabled: true, isStandard: true },
  ];

  if (Array.isArray(customTargets) && customTargets.length > 0) {
    scanTargets = customTargets;
  }

  const folders = [];
  let allItems = [];

  for (const target of scanTargets) {
    if (target.enabled !== false && fs.existsSync(target.path)) {
      const items = await scanFolder(target.path, 3);
      folders.push({
        id: `folder-${crypto.createHash('md5').update(target.path).digest('hex').slice(0, 8)}`,
        name: target.name || path.basename(target.path),
        path: target.path,
        itemCount: items.length,
        lastScanned: Date.now(),
        isStandard: Boolean(target.isStandard),
        enabled: true,
      });
      allItems = allItems.concat(items);
    }
  }

  // De-duplicate items by filePath
  const seenPaths = new Set();
  const uniqueItems = [];
  for (const item of allItems) {
    if (!seenPaths.has(item.filePath)) {
      seenPaths.add(item.filePath);
      uniqueItems.push(item);
    }
  }

  // Sort descending by date
  uniqueItems.sort((a, b) => b.createdAt - a.createdAt);

  return { folders, items: uniqueItems };
});

ipcMain.handle('scan-folder-path', async (_event, folderPath) => {
  if (!folderPath || !fs.existsSync(folderPath)) return null;
  const items = await scanFolder(folderPath, 3);
  const folder = {
    id: `folder-${crypto.createHash('md5').update(folderPath).digest('hex').slice(0, 8)}`,
    name: path.basename(folderPath),
    path: folderPath,
    itemCount: items.length,
    lastScanned: Date.now(),
    isStandard: false,
  };
  return { folder, items };
});

ipcMain.handle('select-folders', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose Folders to Scan for Photos and Videos',
    properties: ['openDirectory', 'multiSelections'],
    message: 'Select folders on your Mac to add to the Gallery',
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths;
});

ipcMain.handle('show-in-finder', async (_event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('open-path', async (_event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    await shell.openPath(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('trash-item', async (_event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      await shell.trashItem(filePath);
      return true;
    } catch (err) {
      console.error('Failed to trash item:', err);
      return false;
    }
  }
  return false;
});

// Persistence IPC
ipcMain.handle('get-settings', async () => {
  return safeReadJson(SETTINGS_FILE, null);
});

ipcMain.handle('save-settings', async (_event, settings) => {
  return safeWriteJson(SETTINGS_FILE, settings);
});

let saveLibraryDebounceTimer = null;

ipcMain.handle('get-library', async () => {
  const data = await safeReadJsonAsync(LIBRARY_FILE, { folders: [], items: [] });
  if (Array.isArray(data.items)) {
    data.items = data.items.map((item) => {
      if (item.filePath) {
        return {
          ...item,
          fileUrl: `http://127.0.0.1:${serverPort}/api/media?path=${encodeURIComponent(item.filePath)}`,
          thumbnailUrl: `http://127.0.0.1:${serverPort}/api/thumbnail?path=${encodeURIComponent(item.filePath)}&size=400`,
        };
      }
      return item;
    });
  }
  return data;
});

ipcMain.handle('save-library', async (_event, libraryData) => {
  clearTimeout(saveLibraryDebounceTimer);
  return new Promise((resolve) => {
    saveLibraryDebounceTimer = setTimeout(async () => {
      const ok = await safeWriteJsonAtomic(LIBRARY_FILE, libraryData);
      resolve(ok);
    }, 400);
  });
});

ipcMain.handle('get-favorites', async () => {
  return safeReadJson(FAVORITES_FILE, []);
});

ipcMain.handle('save-favorites', async (_event, favorites) => {
  return safeWriteJson(FAVORITES_FILE, favorites);
});

ipcMain.handle('get-albums', async () => {
  return safeReadJson(ALBUMS_FILE, []);
});

ipcMain.handle('save-albums', async (_event, albums) => {
  return safeWriteJson(ALBUMS_FILE, albums);
});

ipcMain.handle('get-server-port', () => serverPort);

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// App Lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverInstance) {
    try { serverInstance.close(); } catch {}
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverInstance) {
    try { serverInstance.close(); } catch {}
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
