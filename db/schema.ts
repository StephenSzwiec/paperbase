import { Database } from 'bun:sqlite';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import type { Project, ChemicalDataField, ProjectData } from '../types';

// Project management database path
const PROJECTS_DIR = join(homedir(), '.local', 'state', 'paperbase');
const PROJECTS_DB_PATH = join(PROJECTS_DIR, 'projects.db');

// Ensure projects directory exists
if (!existsSync(PROJECTS_DIR)) {
  mkdirSync(PROJECTS_DIR, { recursive: true });
  console.log('Created projects directory at', PROJECTS_DIR);
}

// Global variable to track currently active database connection
let activeConnection: Database | null = null;

// Initialize projects database
export function initializeProjectsDatabase(): Database {
  const dbExists = existsSync(PROJECTS_DB_PATH);
  const db = new Database(PROJECTS_DB_PATH);
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  
  // Create tables if they don't exist
  if (!dbExists) {
    console.log('Creating new projects database at', PROJECTS_DB_PATH);
    
    db.exec(`CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fields TEXT NOT NULL
    )`);
    
    db.exec(`CREATE TABLE project_data (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);
    
    // Initialize with no active project
    db.exec(`INSERT INTO project_data (key, value) VALUES ('activeProject', '')`);
    
    console.log('Projects database schema created successfully');
  } else {
    console.log('Using existing projects database at', PROJECTS_DB_PATH);
  }

  return db;
}

// Get the path to a specific project's database
export function getProjectPath(projectId: number, db: Database): string {
  const project = db.prepare('SELECT path FROM projects WHERE id = ?').get(projectId) as { path: string } | undefined;
  
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }
  
  return project.path;
}

// Get the currently active project
export function getActiveProject(db: Database): number | undefined {
  const activeProject = db.prepare("SELECT value FROM project_data WHERE key = 'activeProject'").get() as { value: string };
  return activeProject.value ? parseInt(activeProject.value) : undefined;
}

// Set the active project
export function setActiveProject(projectId: number | undefined, db: Database): void {
  const value = projectId !== undefined ? projectId.toString() : '';
  db.prepare("UPDATE project_data SET value = ? WHERE key = 'activeProject'").run(value);
}

// Initialize a new project database
export function initializeProjectDatabase(projectPath: string, fields: ChemicalDataField[]): Database {
  const db = new Database(projectPath);
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  
  // Store fields in a separate table for easy access
  db.exec(`CREATE TABLE schema_fields (
    name TEXT PRIMARY KEY,
    type TEXT NOT NULL
  )`);
  
  // Insert each field into the schema_fields table
  const insertField = db.prepare('INSERT INTO schema_fields (name, type) VALUES (?, ?)');
  for (const field of fields) {
    insertField.run(field.name, field.type);
  }
  
  // Create standard tables
  db.exec(`CREATE TABLE pdfs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    authors TEXT,
    year INTEGER,
    journal TEXT,
    volume TEXT,
    data BLOB
  )`);

  // Create compounds table with chemical_data as JSON
  db.exec(`CREATE TABLE compounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pdf_id INTEGER,
    smiles TEXT,
    inchi TEXT,
    image TEXT,
    chemical_data TEXT, 
    FOREIGN KEY(pdf_id) REFERENCES pdfs(id)
  )`);
  
  console.log('Project database schema created successfully at', projectPath);
  return db;
}

// Get the active database connection or create a new one for a specific project
export function getDatabaseConnection(projectsDb: Database): Database {
  // If there's already an active connection, return it
  if (activeConnection) {
    return activeConnection;
  }
  
  // Try to get the active project ID
  const activeProjectId = getActiveProject(projectsDb);
  
  // If no active project, throw an error
  if (activeProjectId === undefined) {
    throw new Error('No active project. Please select or create a project first.');
  }
  
  // Get the project's database path
  const projectPath = getProjectPath(activeProjectId, projectsDb);
  
  // Connect to the project's database
  activeConnection = new Database(projectPath);
  
  // Enable foreign keys
  activeConnection.exec('PRAGMA foreign_keys = ON;');
  
  console.log(`Connected to project database at ${projectPath}`);
  return activeConnection;
}

// Close the active database connection
export function closeActiveConnection(): void {
  if (activeConnection) {
    activeConnection.close();
    activeConnection = null;
  }
}

// Create a new project
export function createProject(
  projectsDb: Database, 
  name: string, 
  fields: ChemicalDataField[]
): number {
  const projectPath = join(PROJECTS_DIR, `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.db`);
  
  // Create the project database with the specified fields
  initializeProjectDatabase(projectPath, fields);
  
  // Store the project metadata in the projects database
  const result = projectsDb.prepare(
    'INSERT INTO projects (name, path, fields) VALUES (?, ?, ?)'
  ).run(
    name, 
    projectPath, 
    JSON.stringify(fields)
  );
  
  const projectId = Number(result.lastInsertId);
  
  // Set this as the active project
  setActiveProject(projectId, projectsDb);
  
  // Reset the active connection to use the new project
  closeActiveConnection();
  
  return projectId;
}

export function getProjectFields(projectsDb: Database, projectId: number): ChemicalDataField[] {
  const project = projectsDb.prepare('SELECT fields FROM projects WHERE id = ?').get(projectId) as { fields: string } | undefined;
  
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }
  
  return JSON.parse(project.fields) as ChemicalDataField[];
}

// Legacy function for backward compatibility
export function initializeDatabase(): Database {
  // Initialize the projects database
  const projectsDb = initializeProjectsDatabase();
  
  try {
    // Get the active project and connect to its database
    return getDatabaseConnection(projectsDb);
  } catch (error) {
    // If no active project, just return the projects database
    console.log('No active project, returning projects database');
    return projectsDb;
  }
}