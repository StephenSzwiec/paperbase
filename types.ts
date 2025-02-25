// Database model types
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
  pce: number;
  image: string;
}

// API request/response types
export interface APIResponse {
  id?: number;
  message?: string;
  error?: string;
}