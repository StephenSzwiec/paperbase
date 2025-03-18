import express from 'express';
import multer from 'multer';
import { join } from 'path';
import type { Request, Response } from 'express';
import { 
  initializeProjectsDatabase, 
  getDatabaseConnection, 
  createProject, 
  getActiveProject,
  setActiveProject,
  getProjectFields,
  closeActiveConnection
} from './db/schema';
import type { PDF, Compound, APIResponse, Project, ChemicalDataField } from './types';

// Initialize express app
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize projects database
const projectsDb = initializeProjectsDatabase();

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

interface ProjectRequest extends Request {
  body: {
    name: string;
    fields: ChemicalDataField[];
  };
}

// Project endpoints
// Define active project route first to avoid route conflicts
app.get('/api/projects/active', (req: Request, res: Response) => {
  try {
    // Get the active project ID
    const activeProjectId = getActiveProject(projectsDb);
    
    if (!activeProjectId) {
      return res.json({ project: null });
    }
    
    // Get the project details
    const stmt = projectsDb.prepare('SELECT id, name, path, created_at FROM projects WHERE id = ?');
    const project = stmt.get(activeProjectId) as Project | undefined;
    
    if (!project) {
      return res.json({ project: null });
    }
    
    res.json({ project });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/projects', (req: Request, res: Response) => {
  try {
    const stmt = projectsDb.prepare('SELECT id, name, path, created_at FROM projects');
    const projects = stmt.all() as Project[];
    
    // Get the active project
    const activeProject = getActiveProject(projectsDb);
    
    res.json({ projects, activeProject });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/projects', (req: ProjectRequest, res: Response<APIResponse>) => {
  try {
    const { name, fields } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'At least one chemical data field is required' });
    }
    
    // Validate fields
    for (const field of fields) {
      if (!field.name || !['number', 'string'].includes(field.type)) {
        return res.status(400).json({ error: 'Invalid field definition' });
      }
    }
    
    // Create the project
    const projectId = createProject(projectsDb, name, fields);
    
    res.json({ id: projectId, message: 'Project created successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = projectsDb.prepare('SELECT id, name, path, created_at, fields FROM projects WHERE id = ?');
    const project = stmt.get(id) as (Project & { fields: string }) | undefined;
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Parse the fields JSON
    const fields = JSON.parse(project.fields) as ChemicalDataField[];
    
    res.json({
      id: project.id,
      name: project.name,
      path: project.path,
      created_at: project.created_at,
      fields
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.put('/api/projects/:id', (req: ProjectRequest, res: Response<APIResponse>) => {
  try {
    const { id } = req.params;
    const { name, fields } = req.body;
    
    // Get the existing project
    const stmt = projectsDb.prepare('SELECT path FROM projects WHERE id = ?');
    const project = stmt.get(id) as { path: string } | undefined;
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update the project name and fields
    projectsDb.prepare('UPDATE projects SET name = ?, fields = ? WHERE id = ?')
      .run(name, JSON.stringify(fields), id);
    
    // If this is the active project, we need to reload it
    const activeProject = getActiveProject(projectsDb);
    if (activeProject === Number(id)) {
      closeActiveConnection();
    }
    
    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/projects/:id', (req: Request, res: Response<APIResponse>) => {
  try {
    const { id } = req.params;
    
    // Get the active project
    const activeProject = getActiveProject(projectsDb);
    
    // Check if this is the active project
    if (activeProject === Number(id)) {
      // Clear the active project
      setActiveProject(undefined, projectsDb);
      closeActiveConnection();
    }
    
    // Delete the project from the database
    projectsDb.prepare('DELETE FROM projects WHERE id = ?').run(id);
    
    // Note: We don't delete the file since it might be important data
    // Users can manually delete files if needed
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/projects/:id/activate', (req: Request, res: Response<APIResponse>) => {
  try {
    const { id } = req.params;
    
    // Get the project
    const stmt = projectsDb.prepare('SELECT id FROM projects WHERE id = ?');
    const project = stmt.get(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Set this as the active project
    setActiveProject(Number(id), projectsDb);
    
    // Close any existing connection to force a new connection
    closeActiveConnection();
    
    res.json({ message: 'Project activated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/projects/active', (req: Request, res: Response) => {
  try {
    // Get the active project ID
    const activeProjectId = getActiveProject(projectsDb);
    
    if (!activeProjectId) {
      return res.json({ project: null });
    }
    
    // Get the project details
    const stmt = projectsDb.prepare('SELECT id, name, path, created_at FROM projects WHERE id = ?');
    const project = stmt.get(activeProjectId) as Project | undefined;
    
    if (!project) {
      return res.json({ project: null });
    }
    
    res.json({ project });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/projects/active/fields', (req: Request, res: Response) => {
  try {
    // Get the active project
    const activeProject = getActiveProject(projectsDb);
    
    if (!activeProject) {
      return res.status(400).json({ error: 'No active project' });
    }
    
    // Get the fields for the active project
    const fields = getProjectFields(projectsDb, activeProject);
    
    res.json(fields);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// PDF endpoints
app.post('/api/pdfs', upload.single('pdf'), (req: PDFUploadRequest, res: Response<APIResponse>) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

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
    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

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
    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

    const { id } = req.params;
    const inline = req.query.inline === 'true';
    
    // For PDF data, get just the PDF
    const stmt = db.prepare('SELECT data FROM pdfs WHERE id = ?');
    const pdf = stmt.get(id) as { data: Buffer } | undefined;

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Set appropriate headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    
    // Use inline disposition to view in browser, or attachment to download
    const disposition = inline ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="document-${id}.pdf"`);
    
    // Prevent caching to ensure fresh content
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the PDF data
    res.send(Buffer.from(pdf.data));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.put('/api/pdfs/:id', (req: Request, res: Response<APIResponse>) => {
  try {
    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

    const { id } = req.params;
    const { title, authors, year, journal, volume } = req.body;

    // Validate required fields
    if (!title || !authors || !year || !journal) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the paper exists
    const checkStmt = db.prepare('SELECT id FROM pdfs WHERE id = ?');
    const paper = checkStmt.get(id);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Update the paper
    const stmt = db.prepare(`
      UPDATE pdfs 
      SET title = ?, authors = ?, year = ?, journal = ?, volume = ? 
      WHERE id = ?
    `);

    stmt.run(title, authors, year, journal, volume, id);
    res.json({ message: 'Paper updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/pdfs/:id', (req: Request, res: Response<APIResponse>) => {
  try {
    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

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
    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

    const { pdf_id, smiles, inchi, image, chemical_data } = req.body;

    // Convert chemical_data to a JSON string for storage
    const chemicalDataString = JSON.stringify(chemical_data);

    const stmt = db.prepare(`
      INSERT INTO compounds (pdf_id, smiles, inchi, image, chemical_data) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(pdf_id, smiles, inchi, image, chemicalDataString);
    res.json({ id: Number(result.lastInsertId) });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/compounds/:pdfId', (req: Request, res: Response) => {
  try {
    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

    const { pdfId } = req.params;
    const stmt = db.prepare('SELECT id, pdf_id, smiles, inchi, image, chemical_data FROM compounds WHERE pdf_id = ?');
    const compoundsRaw = stmt.all(pdfId) as (Omit<Compound, 'chemical_data'> & { chemical_data: string })[];
    
    // Parse the chemical_data JSON for each compound
    const compounds = compoundsRaw.map(compound => {
      return {
        ...compound,
        chemical_data: JSON.parse(compound.chemical_data)
      };
    });
    
    res.json(compounds);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.put('/api/compounds/:id', (req: CompoundRequest, res: Response<APIResponse>) => {
  try {
    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

    const { id } = req.params;
    const { pdf_id, smiles, inchi, image, chemical_data } = req.body;

    // Check if compound exists
    const checkStmt = db.prepare('SELECT id FROM compounds WHERE id = ?');
    const compound = checkStmt.get(id);
    
    if (!compound) {
      return res.status(404).json({ error: 'Compound not found' });
    }

    // Convert chemical_data to a JSON string for storage
    const chemicalDataString = JSON.stringify(chemical_data);

    // Update the compound
    const stmt = db.prepare(`
      UPDATE compounds 
      SET pdf_id = ?, smiles = ?, inchi = ?, image = ?, chemical_data = ?
      WHERE id = ?
    `);

    stmt.run(pdf_id, smiles, inchi, image, chemicalDataString, id);
    res.json({ message: 'Compound updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

app.delete('/api/compounds/:id', (req: Request, res: Response<APIResponse>) => {
  try {
    // Get the database connection for the active project
    const db = getDatabaseConnection(projectsDb);

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
