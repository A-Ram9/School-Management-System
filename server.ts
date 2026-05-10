import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('schools.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL
  )
`);

const app = express();
app.use(express.json());

// Zod schema for school validation
const schoolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Add School API
app.post('/addSchool', (req, res) => {
  try {
    const validatedData = schoolSchema.parse(req.body);
    const { name, address, latitude, longitude } = validatedData;

    const stmt = db.prepare('INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, address, latitude, longitude);

    res.status(201).json({
      message: "School added successfully",
      schoolId: info.lastInsertRowid
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// List Schools API
app.get('/listSchools', (req, res) => {
  const userLat = parseFloat(req.query.latitude as string);
  const userLon = parseFloat(req.query.longitude as string);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ error: "Valid latitude and longitude are required as query parameters" });
  }

  const schools = db.prepare('SELECT * FROM schools').all() as any[];
  
  const sortedSchools = schools.map(school => ({
    ...school,
    distance: calculateDistance(userLat, userLon, school.latitude, school.longitude)
  })).sort((a, b) => a.distance - b.distance);

  res.json(sortedSchools);
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
