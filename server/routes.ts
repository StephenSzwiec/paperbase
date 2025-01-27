import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { db } from "./db";
import { 
    papers as paperTable,
    compounds as compoundTable,
    insertPaperSchema,
    selectPaperSchema,
    insertCompoundSchema,
    selectCompoundSchema
} from "./schema";
import { eq, desc } from "drizzle-orm";
import { 
    createPaperSchema,
    createCompoundSchema
} from "./sharedTypes";

export const papersRoute = new Hono()
    .get("/", async (c) => {
        const papers = await db 
            .select()
            .from(paperTable)
            .all();

        return c.json({ papers: papers });
    })
    .get("/:id", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const paper = await db
            .select()
            .from(paperTable)
            .where(eq(paperTable.id, id))
            .then((res) => res[0]);

        if (!paper) {
            return c.notFound();
        }

        return c.json({ paper });
    })
    .post("/", zValidator("json", createPaperSchema), async (c) => {
        const paper = await c.req.valid("json");
        const validatedPaper = insertPapersSchema.parse({
            ...paper });
        const result = await db
            .insert(paperTable)
            .values(validatedPaper)
            .returning()
            .then((res) => res[0]);
        c.status(201);
        return c.json(result);
    })
    .delete("/:id", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const paper = await db
            .delete(paperTable)
            .where(eq(paperTable.id, id))
            .returning()
            .then((res) => res[0]);
        if(!paper) {
            return c.notFound();
        }
        return c.json({ paper : paper });
    });

export const compoundsRoute = new Hono()
    .get("/", async (c) => {
        const compounds = await db
            .select()
            .from(compoundTable)
            .all();
        return c.json({ compounds: compounds });
    })
    .get("/:id", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const compound = await db
            .select()
            .from(compoundTable)
            .where(eq(compoundTable.id, id))
            .then((res) => res[0]);

        if (!compound) {
            return c.notFound();
        }

        return c.json({ compound });
    })
    .post("/", zValidator("json", createCompoundSchema), async (c) => {
        const compound = await c.req.valid("json");
        const validatedCompound = insertCompoundsSchema.parse({
            ...compound });
        const result = await db
            .insert(compoundTable)
            .values(validatedCompound)
            .returning()
            .then((res) => res[0]);
        c.status(201);
        return c.json(result);
    })
    .delete("/:id", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const compound = await db
            .delete(compoundTable)
            .where(eq(compoundTable.id, id))
            .returning()
            .then((res) => res[0]);
        if(!compound) {
            return c.notFound();
        }
        return c.json({ compound : compound });
    });
