import { sqliteTable, text, integer, numeric, blob, foreignKey } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod"; 
import { z } from "zod";

// A paper is a BibTeX like entry with a pdf blob attached
export const papers = sqliteTable(
    "papers", 
    {
        id: integer("id").primaryKey(),
        paper_title: text("paper_title").notNull(),
        authors: text("authors").notNull(),
        year: integer("year").notNull(),
        journal: text("journal"),
        volume: text("volume"),
        pdf: blob("pdf"),
    },
    (papers) => {
        return {
            id: index("id").on(papers.id),
        };
    }
);

export type Paper = z.infer<typeof papers>;

export const compounds = sqliteTable("compounds", {
    id: integer("id").primaryKey(),
    smiles: text("smiles"),
    inchi: text("inchi"),
    molfile: text("molfile"),
    paperId: integer("paper_id").notNull().references(() => papers.id, {onDelete: "CASCADE"}),
});
export type Compound = z.infer<typeof compounds>;

export const insertPapersSchema = createInsertSchema(papers, { 
    paper_title: z.string().min(1),
    authors: z.string().min(1),
    year: z.number().int(),
    journal: z.string().min(1).optional(),
    volume: z.string().min(1).optional(),
    pdf: z.any().optional(),
});
export const selectPapersSchema = createSelectSchema(papers);

export const insertCompoundsSchema = createInsertSchema(compounds, {
    name: z.string().min(1),
    paperId: z.number().int(),
    smiles: z.string().min(1).optional(),
    inchi: z.string().min(1).optional(),
    molfile: z.string().min(1).optional(),
});
export const selectCompoundsSchema = createSelectSchema(compounds);
