import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatHandler } from './chatController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API Routes
app.post('/api/chat', chatHandler);

app.post('/api/verify-social', async (req, res) => {
  const { platform, username } = req.body;
  if (!platform || !username) return res.status(400).json({ error: 'Missing platform or username' });

  const cleanUsername = username.replace('@', '');
  const urls = {
    tiktok: `https://www.tiktok.com/@${cleanUsername}`,
    facebook: `https://www.facebook.com/${cleanUsername}`,
    instagram: `https://www.instagram.com/${cleanUsername}`,
    telegram: `https://t.me/${cleanUsername}`
  };

  const url = urls[platform.toLowerCase()];
  if (!url) return res.status(400).json({ error: 'Invalid platform' });

  try {
    // Check if fetch is available (Node 18+)
    if (typeof fetch === 'undefined') {
      console.warn('Fetch is not available in this Node.js environment. Falling back to success.');
      return res.json({ exists: true, warning: 'Server environment check limited' });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      // Short timeout to avoid hanging the UI
      signal: AbortSignal.timeout(5000)
    });

    // If we get a 404, the profile likely doesn't exist
    if (response.status === 404) {
      return res.json({ exists: false, error: 'Profile not found' });
    }

    // TikTok and others often return 403 or 429 to crawlers
    // If it's not a 404, we assume it's possibly valid but blocked for scraping
    return res.json({ exists: true });
  } catch (error) {
    console.error(`Verification error for ${platform}:`, error.message);
    // CRITICAL: If the check fails for ANY reason (timeout, network, scraping block), 
    // we return exists: true to avoid blocking a potentially valid user.
    // The Admin will do the final manual check anyway.
    return res.json({ exists: true, warning: 'System could not verify, pending expert review' });
  }
});

// Serve static files from the client build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing, return all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
