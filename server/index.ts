import app from "./app";
import { z } from "zod";

const ServeEnv = z.object({
    PORT: z
        .string()
        .regex(/^\d+$/, "Port must be a numeric string")
        .default("3000")
        .transform(Number),
});
const ProcessEnv = ServeEnv.parse(process.env);

const server = Bun.serve({
    port: ProcessEnv.PORT,
    hostname: "localhost",
    fetch: app.fetch,
});

console.log("Server running", server.port);
