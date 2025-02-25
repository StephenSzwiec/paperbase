import { Database } from 'bun:sqlite';
import { join } from 'path';
import { existsSync } from 'fs';

const DB_PATH = join(process.cwd(), 'paperbase.db');

// Initialize database with schema
export function initializeDatabase(): Database {
  const dbExists = existsSync(DB_PATH);
  const db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  
  // Create tables if they don't exist
  if (!dbExists) {
    console.log('Creating new database at', DB_PATH);
    
    db.exec(`CREATE TABLE pdfs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      authors TEXT,
      year INTEGER,
      journal TEXT,
      volume TEXT,
      data BLOB
    )`);

    db.exec(`CREATE TABLE compounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pdf_id INTEGER,
      smiles TEXT,
      inchi TEXT,
      pce REAL,
      image TEXT,
      FOREIGN KEY(pdf_id) REFERENCES pdfs(id)
    )`);
    
    console.log('Database schema created successfully');
  } else {
    console.log('Using existing database at', DB_PATH);
  }

  return db;
}

export default initializeDatabase;