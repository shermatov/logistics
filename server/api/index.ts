// Vercel serverless entry point: wraps the Express app so every request
// (routed here via vercel.json rewrites) is handled by the same routing/CORS
// logic used in local dev (src/index.ts).
import { app } from "../src/app.js";

export default app;
