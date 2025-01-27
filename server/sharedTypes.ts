import {
    insertPaperSchema,
    insertCompoundSchema 
} from './schema';
import { z } from 'zod';

export const createPaperSchema = insertPaperSchema.omit({
    id: true
});

export const createCompoundSchema = insertCompoundSchema.omit({
    id: true, 
    paperId: true
});

export type CreatePaper = z.infer<typeof createPaperSchema>;
export type CreateCompound = z.infer<typeof createCompoundSchema>;
export type InsertPaper = z.infer<typeof insertPaper>;
export type InsertCompound = z.infer<typeof insertCompound>;
