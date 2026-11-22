import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to games directory (one level up from server/)
const GAMES_DIR = process.env.GAMES_DIR || path.join(__dirname, '../../games');

const router = express.Router();

// Ensure games dir exists
try { await fs.mkdir(GAMES_DIR, { recursive: true }); } catch {}

// Multer config for thumbnail upload (single file)
const storage = multer.memoryStorage();
const thumbUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max for thumbnails
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Solo imágenes PNG/JPG/GIF/WebP'));
    cb(null, true);
  }
});

// ==================== GET /api/games ====================
router.get('/', async (req, res) => {
  try {
    const entries = await fs.readdir(GAMES_DIR).catch(() => []);
    
    // Filter only directories that have a meta.json
    const games = [];
    for (const entry of entries) {
      if (!entry.startsWith('.')) continue;
      
      let gamePath, metaFile;
      try {
        gamePath = path.join(GAMES_DIR, entry);
        metaFile = path.join(gamePath, 'meta.json');
        
        const stat = await fs.stat(gamePath);
        if (!stat.isDirectory()) continue;
        
        // Check for both .zip and extracted folder patterns
        const hasZip = (await fs.readdir(gamePath)).includes(`${entry}.zip`);
        const hasMeta = await fs.access(metaFile).then(() => true).catch(() => false);
        
        if (!hasZip && !hasMeta) continue;
        
        let meta;
        try {
          meta = JSON.parse(await fs.readFile(metaFile, 'utf-8'));
        } catch {
          // Generate default metadata from folder name
          const parts = entry.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1));
          meta = {
            id: entry,
            title: parts.join(' '),
            description: '',
            thumbnail: null,
            tags: [],
            createdAt: stat.birthtime || new Date().toISOString(),
            updatedAt: stat.mtime.toISOString()
          };
        }

        // Check if game has index.html (valid playable game)
        const files = await fs.readdir(gamePath).catch(() => []);
        meta.hasIndexHtml = files.includes('index.html');
        
        games.push(meta);
      } catch { continue; }
    }

    res.json(games.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    console.error('Error listing games:', err);
    res.status(500).json({ error: 'Failed to list games' });
  }
});

// ==================== GET /api/games/:id ====================
router.get('/:id', async (req, res) => {
  try {
    const gamePath = path.join(GAMES_DIR, req.params.id);
    
    // Check if it's a zip file that needs extraction or an extracted folder
    let metaFile;
    try {
      await fs.access(gamePath);
      metaFile = path.join(gamePath, 'meta.json');
    } catch {
      // Try as .zip name (e.g., /api/games/snake -> look for snake.zip)
      const zipName = `${req.params.id}.zip`;
      try {
        await fs.access(path.join(GAMES_DIR, zipName));
        metaFile = path.join(gamePath, 'meta.json'); // same structure after extraction
      } catch {
        return res.status(404).json({ error: 'Game not found' });
      }
    }

    const metaContent = await fs.readFile(metaFile, 'utf-8');
    const meta = JSON.parse(metaContent);
    
    // Check if index.html exists (game is playable)
    try {
      await fs.access(path.join(gamePath, 'index.html'));
      meta.hasIndexHtml = true;
    } catch {
      meta.hasIndexHtml = false;
    }

    res.json(meta);
  } catch (err) {
    console.error('Error getting game:', err);
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Game not found' });
    res.status(500).json({ error: 'Failed to get game details' });
  }
});

// ==================== POST /api/upload ====================
router.post('/upload', thumbUpload.single('thumbnail'), async (req, res) => {
  try {
    const body = req.body; // title, description, tags as JSON string
    
    let metadata;
    if (typeof body === 'string') {
      metadata = JSON.parse(body);
    } else {
      metadata = body;
    }

    const gameId = metadata.id || `game-${Date.now()}`;
    
    // Validate required fields
    if (!metadata.title) return res.status(400).json({ error: 'Title is required' });

    let gamePath, zipBuffer;
    
    // Check for uploaded .zip file (field name "gameFiles")
    const files = req.files || {};
    const gameZipFile = Array.isArray(files.gameFiles) ? files.gameFiles[0] : null;
    
    if (!gameZipFile && !metadata.zipData) {
      return res.status(400).json({ error: 'No game files uploaded' });
    }

    // Create base directory for the game (always as extracted folder, not zip)
    const basePath = path.join(GAMES_DIR);
    
    if (!gameZipFile && metadata.zipData) {
      // Base64 data from client
      zipBuffer = Buffer.from(metadata.zipData.replace(/^data:.+;base64,/, ''), 'base64');
      
      // Check for existing folder with same name (already extracted)
      const potentialPath = path.join(basePath, gameId);
      try {
        await fs.access(potentialPath);
        return res.status(409).json({ error: 'A game with this ID already exists' });
      } catch {}

    } else if (gameZipFile) {
      zipBuffer = gameZipFile.buffer;
      
      // Check for existing folder
      const potentialPath = path.join(basePath, gameId);
      try {
        await fs.access(potentialPath);
        return res.status(409).json({ error: 'A game with this ID already exists' });
      } catch {}

    } else {
      // Legacy support for individual files (not recommended)
      const potentialPath = path.join(basePath, gameId);
      try { await fs.access(potentialPath); return res.status(409).json({ error: 'A game with this ID already exists' }); } catch {}

    }

    // Create the game directory and extract zip if needed
    const finalGamePath = path.join(basePath, gameId);
    
    try { await fs.access(finalGamePath); return res.status(409).json({ error: 'A game with this ID already exists' }); } catch {}
    
    await fs.mkdir(finalGamePath, { recursive: true });

    if (zipBuffer && zipBuffer.length > 0) {
      // Extract the .zip file
      const AdmZip = require('adm-zip');
      try {
        const admZip = new AdmZip(zipBuffer);
        admZip.extractAllTo(finalGamePath, true);
        
        // Remove the zip file after extraction (keep only extracted content)
        await fs.unlink(path.join(GAMES_DIR, `${gameId}.zip`)).catch(() => {});
      } catch {
        return res.status(400).json({ error: 'Invalid ZIP file' });
      }
    }

    // Save thumbnail if provided
    let thumbPath = null;
    if (req.file) {
      const thumbName = `${gameId}-thumb.png`;
      await fs.writeFile(path.join(finalGamePath, thumbName), req.file.buffer);
      thumbPath = `/${thumbName}`;
    }

    // Generate or update meta.json
    let tags = [];
    if (metadata.tags) {
      try { tags = typeof metadata.tags === 'string' ? JSON.parse(metadata.tags) : Array.isArray(metadata.tags) ? metadata.tags : [metadata.tags]; } catch {}
    } else if (typeof body === 'object') {
      const parsedTags = req.body?.tags;
      if (parsedTags && !Array.isArray(parsedTags)) tags.push(String(parsedTags));
    }

    // Generate default title from ID if not provided
    let title = metadata.title || gameId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const meta = {
      id: gameId,
      title,
      description: metadata.description || '',
      thumbnail: thumbPath,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(path.join(finalGamePath, 'meta.json'), JSON.stringify(meta, null, 2));

    res.status(201).json({ 
      message: 'Game uploaded successfully', 
      game: meta 
    });
    
  } catch (err) {
    console.error('Error uploading game:', err);
    if (err instanceof multer.MulterError) return res.status(400).json({ error: `Upload error: ${err.message}` });
    res.status(500).json({ error: 'Failed to upload game' });
  }
});

// ==================== DELETE /api/games/:id ====================
router.delete('/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    
    // Check if it's a zip file or extracted folder
    let gamePath = path.join(GAMES_DIR, gameId);
    let isZipOnly = false;

    try { await fs.access(gamePath); } catch {
      // Try as .zip name
      const potentialZip = `${gameId}.zip`;
      if (await fs.access(path.join(GAMES_DIR, potentialZip)).then(() => true).catch(() => false)) {
        isZipOnly = true;
      } else {
        return res.status(404).json({ error: 'Game not found' });
      }
    }

    if (isZipOnly) {
      await fs.unlink(path.join(GAMES_DIR, `${gameId}.zip`));
    } else {
      // Remove the extracted folder and any associated zip
      const potentialZip = path.join(GAMES_DIR, `${gameId}.zip`);
      try { await fs.access(potentialZip); await fs.unlink(potentialZip); } catch {}

      await fs.rm(gamePath, { recursive: true, force: true });
    }

    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.error('Error deleting game:', err);
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Game not found' });
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

export default router;
