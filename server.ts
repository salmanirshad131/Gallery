import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const THUMBNAILS_DIR = path.join(os.homedir(), '.cache', 'gallery_thumbnails');
try {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
} catch {}

const PHOTO_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
  '.avif', '.gif', '.bmp', '.tiff', '.tif', '.svg',
]);

const VIDEO_EXTS = new Set([
  '.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv',
]);

const MIME_MAP: Record<string, string> = {
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

function getCacheKey(filePath: string, mtimeMs: number, size = 400): string {
  const hash = crypto.createHash('md5').update(`${filePath}:${mtimeMs}:${size}`).digest('hex');
  return path.join(THUMBNAILS_DIR, `${hash}.jpg`);
}

function generateThumbnail(filePath: string, cachePath: string, size = 400): Promise<boolean> {
  return new Promise((resolve) => {
    const ext = path.extname(filePath).toLowerCase();

    if (VIDEO_EXTS.has(ext)) {
      const tempOutDir = os.tmpdir();
      execFile('/usr/bin/qlmanage', ['-t', '-s', String(size), '-o', tempOutDir, filePath], (err) => {
        if (!err) {
          const generatedName = `${path.basename(filePath)}.png`;
          const generatedPath = path.join(tempOutDir, generatedName);
          if (fs.existsSync(generatedPath)) {
            execFile('/usr/bin/sips', ['-s', 'format', 'jpeg', generatedPath, '--out', cachePath], () => {
              try { fs.unlinkSync(generatedPath); } catch {}
              resolve(fs.existsSync(cachePath));
            });
            return;
          }
        }
        resolve(false);
      });
      return;
    }

    if (PHOTO_EXTS.has(ext)) {
      execFile('/usr/bin/sips', ['-s', 'format', 'jpeg', '-Z', String(size), filePath, '--out', cachePath], (err) => {
        if (!err && fs.existsSync(cachePath)) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      return;
    }

    resolve(false);
  });
}

function detectCategory(filename: string, ext: string, filePath: string) {
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

  if (lowerExt === '.gif') return 'gif';

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

function scanFolder(folderPath: string, maxDepth = 3) {
  const items: any[] = [];
  if (!fs.existsSync(folderPath)) return items;

  const IGNORED = new Set([
    'node_modules', '.git', '.cache', 'Library', '.Trash',
    'Applications', 'System', 'tmp',
  ]);

  function traverse(currentDir: string, depth: number) {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const ent of entries) {
      if (ent.name.startsWith('.') && ent.name !== '.DS_Store') continue;
      const fullPath = path.join(currentDir, ent.name);

      if (ent.isDirectory()) {
        if (!IGNORED.has(ent.name) && !ent.name.startsWith('.')) {
          traverse(fullPath, depth + 1);
        }
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (PHOTO_EXTS.has(ext) || VIDEO_EXTS.has(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size > 1024) {
              const category = detectCategory(ent.name, ext, fullPath);
              const itemId = `media-${crypto.createHash('md5').update(fullPath).digest('hex').slice(0, 12)}`;
              items.push({
                id: itemId,
                filename: ent.name,
                filePath: fullPath,
                fileSize: stat.size,
                fileUrl: `/api/media?path=${encodeURIComponent(fullPath)}`,
                thumbnailUrl: `/api/thumbnail?path=${encodeURIComponent(fullPath)}&size=400`,
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
          } catch {}
        }
      }
    }
  }

  traverse(folderPath, 0);
  return items;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Thumbnail API
  app.get('/api/thumbnail', async (req, res) => {
    const rawPath = req.query.path as string;
    const size = Math.min(800, Math.max(100, Number(req.query.size) || 400));
    if (!rawPath) return res.status(400).send('Missing path parameter');

    const filePath = path.resolve(rawPath);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      return res.status(500).send('Cannot stat file');
    }

    const ext = path.extname(filePath).toLowerCase();
    if (['.svg', '.gif'].includes(ext)) {
      res.setHeader('Content-Type', MIME_MAP[ext] || 'image/jpeg');
      return fs.createReadStream(filePath).pipe(res);
    }

    const cachePath = getCacheKey(filePath, stat.mtimeMs, size);
    if (fs.existsSync(cachePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return fs.createReadStream(cachePath).pipe(res);
    }

    const success = await generateThumbnail(filePath, cachePath, size);
    if (success && fs.existsSync(cachePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return fs.createReadStream(cachePath).pipe(res);
    }

    if (PHOTO_EXTS.has(ext)) {
      res.setHeader('Content-Type', MIME_MAP[ext] || 'image/jpeg');
      return fs.createReadStream(filePath).pipe(res);
    }

    return res.status(404).send('Could not generate thumbnail');
  });

  // Media API with range support
  app.get('/api/media', (req, res) => {
    const rawPath = req.query.path as string;
    if (!rawPath) return res.status(400).send('Missing path parameter');

    const filePath = path.resolve(rawPath);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      return res.status(500).send('Cannot read file');
    }

    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.heic' || ext === '.heif' || ext === '.tiff') {
      const fullCachePath = getCacheKey(filePath, stat.mtimeMs, 2560);
      if (fs.existsSync(fullCachePath)) {
        res.setHeader('Content-Type', 'image/jpeg');
        return fs.createReadStream(fullCachePath).pipe(res);
      }
      execFile('/usr/bin/sips', ['-s', 'format', 'jpeg', filePath, '--out', fullCachePath], (err) => {
        if (!err && fs.existsSync(fullCachePath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          return fs.createReadStream(fullCachePath).pipe(res);
        }
        res.status(500).send('Cannot process HEIC image');
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
      if (start >= fileSize) return res.status(416).send('Range not satisfiable');

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

  // REST endpoints for browser fallback
  app.get('/api/scan-mac', (_req, res) => {
    const home = os.homedir();
    const targets = [
      { name: 'Pictures', path: path.join(home, 'Pictures') },
      { name: 'Desktop', path: path.join(home, 'Desktop') },
      { name: 'Downloads', path: path.join(home, 'Downloads') },
      { name: 'Movies', path: path.join(home, 'Movies') },
    ];

    const folders: any[] = [];
    let allItems: any[] = [];

    for (const target of targets) {
      if (fs.existsSync(target.path)) {
        const items = scanFolder(target.path, 3);
        folders.push({
          id: `folder-${target.name.toLowerCase()}`,
          name: target.name,
          path: target.path,
          itemCount: items.length,
          lastScanned: Date.now(),
          isStandard: true,
        });
        allItems = allItems.concat(items);
      }
    }

    const seen = new Set();
    const unique: any[] = [];
    for (const it of allItems) {
      if (!seen.has(it.filePath)) {
        seen.add(it.filePath);
        unique.push(it);
      }
    }
    unique.sort((a, b) => b.createdAt - a.createdAt);

    res.json({ folders, items: unique });
  });

  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apple Photos server running on http://localhost:${PORT}`);
  });
}

startServer();
