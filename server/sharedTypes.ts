import {
    insertPapersSchema,
    insertCompoundsSchema 
} from './schema';
import { z } from 'zod';

export const createPaperSchema = insertPapersSchema.omit({
    id: true
});

export const createCompoundSchema = insertCompoundsSchema.omit({
    id: true, 
    paperId: true
});

export type CreatePaper = z.infer<typeof createPaperSchema>;
export type CreateCompound = z.infer<typeof createCompoundSchema>;
export type InsertPaper = z.infer<typeof insertPaper>;
export type InsertCompound = z.infer<typeof insertCompound>;
