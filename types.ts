// Database model types
export interface Project {
  id?: number;
  name: string;
  path: string;
  created_at?: string;
  fields: ChemicalDataField[];
}

export interface ChemicalDataField {
  name: string;
  type: 'number' | 'string';
}

export interface PDF {
  id?: number; // Optional for creation, required when retrieved
  title: string;
  authors: string;
  year: number;
  journal: string;
  volume: string;
  data?: Uint8Array; // Full PDF data, not included in list responses
}

export interface Compound {
  id?: number; // Optional for creation, required when retrieved
  pdf_id: number;
  smiles: string;
  inchi: string;
  image: string;
  chemical_data: Record<string, number | string>; // Dynamic fields based on project configuration
}

// API request/response types
export interface APIResponse {
  id?: number;
  message?: string;
  error?: string;
}

// Project management types
export interface ProjectData {
  activeProject?: number;
}