import { Hono } from "hono";
import { logger } from "hono/logger";
import { papersRoute, compoundsRoute } from "./routes";

const app = new Hono();

app.use("*", logger()); 

const apiRoutes = app.basePath("/api").route("/papers", papersRoute).route("/compounds", compoundsRoute);

export default app;
export type ApiRoutes = typeof apiRoutes;
