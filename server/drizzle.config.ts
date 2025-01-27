import { defineConfig } from 'drizzle-kit';

export defaultr defineConfig({
    dialect: 'sqlite',
    schema: './server/schema.ts',
    out: './drizzle',
});
