import express from 'express';
import multer from 'multer';
import { join } from 'path';
import type { Request, Response } from 'express';
import { initializeDatabase } from './db/schema';
import type { PDF, Compound, APIResponse } from './types';

// Initialize express app
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const db = initializeDatabase();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Define request types with proper typing
interface PDFUploadRequest extends Request {
  body: {
    bibtexData: string; // JSON string that will be parsed
  };
  file?: {
    buffer: Buffer;
  };
}

interface CompoundRequest extends Request {
  body: Compound;
}

// PDF endpoints
app.post('/api/pdfs', upload.single('pdf'), (req: PDFUploadRequest, res: Response<APIResponse>) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const bibtexData: PDF = JSON.parse(req.body.bibtexData);
    const pdfData = req.file.buffer;

    const stmt = db.prepare(`
      INSERT INTO pdfs (title, authors, year, journal, volume, data) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      bibtexData.title,
      bibtexData.authors,
      bibtexData.year,
      bibtexData.journal,
      bibtexData.volume,
      pdfData
    );

    res.json({ id: Number(result.lastInsertId) });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/pdfs', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT id, title, authors, year, journal, volume FROM pdfs');
    const pdfs = stmt.all() as PDF[];
    res.json(pdfs);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/pdfs/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT data FROM pdfs WHERE id = ?');
    const pdf = stmt.get(id) as { data: Buffer } | undefined;

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.send(Buffer.from(pdf.data));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/pdfs/:id', (req: Request, res: Response<APIResponse>) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM pdfs WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'PDF deleted' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// Compound endpoints
app.post('/api/compounds', (req: CompoundRequest, res: Response<APIResponse>) => {
  try {
    const { pdf_id, smiles, inchi, pce, image } = req.body;

    const stmt = db.prepare(`
      INSERT INTO compounds (pdf_id, smiles, inchi, pce, image) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(pdf_id, smiles, inchi, pce, image);
    res.json({ id: Number(result.lastInsertId) });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/compounds/:pdfId', (req: Request, res: Response) => {
  try {
    const { pdfId } = req.params;
    const stmt = db.prepare('SELECT * FROM compounds WHERE pdf_id = ?');
    const compounds = stmt.all(pdfId) as Compound[];
    res.json(compounds);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/compounds/:id', (req: Request, res: Response<APIResponse>) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM compounds WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Compound deleted' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// Start server
const PORT = 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});