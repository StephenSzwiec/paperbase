import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { papersRoute, compoundsRoute } from "./routes";

const app = new Hono();

app.use("*", logger()); 

const apiRoutes = app.basePath("/api").route("/papers", papersRoute).route("/compounds", compoundsRoute);

app.get("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", serveStatic({ root: "./frontend/dist", index: "index.html" }));

export default app;
export type ApiRoutes = typeof apiRoutes;
