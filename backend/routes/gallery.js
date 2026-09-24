import express from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/gallery.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads/gallery');
const INCOMING_DIR = path.join(__dirname, '../uploads/incoming');

const CATEGORIES = [
  "Marriage Decoration", "Birthday Decoration", "Home Decoration",
  "Naming Ceremony", "Sreemantham Ceremony", "Engagement Decoration",
  "Car Decoration", "Temple Decoration", "New Year Decoration",
  "Festival Decoration"
];

// Ensure directories exist
await fs.mkdir(INCOMING_DIR, { recursive: true }).catch(() => {});
await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});

// Setup Multer
const storage = multer.diskStorage({
  destination: INCOMING_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = crypto.randomUUID();
    cb(null, `${id}${ext}`);
  }
});
const upload = multer({ storage });

// Helper to read JSON
async function getGalleryData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to write JSON
async function saveGalleryData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.post('/upload', upload.array('images'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const galleryData = await getGalleryData();
    const results = [];

    for (const file of files) {
      const id = path.parse(file.filename).name;
      let category = "Uncategorized";
      let confirmed = false;

      try {
        // Read image as base64 for Claude
        const imageBuffer = await fs.readFile(file.path);
        const base64Image = imageBuffer.toString('base64');
        const mediaType = file.mimetype;

        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 50,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Classify this event decoration photo into exactly ONE of these categories: [${CATEGORIES.join(', ')}]. Respond with only the category name, nothing else. If you are not sure or it doesn't match perfectly, pick the closest one or respond with "Uncategorized".`
                },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Image,
                  }
                }
              ]
            }
          ]
        });

        const rawCategory = response.content[0].text.trim();
        // Validate if Claude returned a valid category
        if (CATEGORIES.includes(rawCategory)) {
          category = rawCategory;
        }
      } catch (err) {
        console.error("Claude API error:", err);
      }

      // Move file to appropriate category folder
      const slug = slugify(category);
      const categoryDir = path.join(UPLOADS_DIR, slug);
      await fs.mkdir(categoryDir, { recursive: true }).catch(() => {});
      
      const newFilename = `${id}${path.extname(file.originalname)}`;
      const newPath = path.join(categoryDir, newFilename);
      
      await fs.rename(file.path, newPath);

      const record = {
        id,
        filename: newFilename,
        category,
        path: `/uploads/gallery/${slug}/${newFilename}`,
        classified_at: new Date().toISOString(),
        confirmed
      };

      galleryData.push(record);
      results.push(record);
    }

    await saveGalleryData(galleryData);
    res.json(results);

  } catch (error) {
    console.error("Upload route error:", error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const gallery = await getGalleryData();
    const { category } = req.query;
    
    if (category) {
      return res.json(gallery.filter(item => item.category === category));
    }
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    
    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const galleryData = await getGalleryData();
    const itemIndex = galleryData.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const item = galleryData[itemIndex];
    
    // If category changed, move the physical file
    if (item.category !== category) {
      const oldPath = path.join(__dirname, '..', item.path);
      const slug = slugify(category);
      const newDir = path.join(UPLOADS_DIR, slug);
      await fs.mkdir(newDir, { recursive: true }).catch(() => {});
      
      const newPath = path.join(newDir, item.filename);
      await fs.rename(oldPath, newPath);
      
      item.category = category;
      item.path = `/uploads/gallery/${slug}/${item.filename}`;
    }
    
    item.confirmed = true;
    
    await saveGalleryData(galleryData);
    res.json(item);
  } catch (error) {
    console.error("Patch route error:", error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const galleryData = await getGalleryData();
    const itemIndex = galleryData.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const item = galleryData[itemIndex];
    const filePath = path.join(__dirname, '..', item.path);
    
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Could not delete file physically, continuing with metadata removal", err);
    }
    
    galleryData.splice(itemIndex, 1);
    await saveGalleryData(galleryData);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;
