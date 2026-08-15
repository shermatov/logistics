// Local development entry point. Not used on Vercel — see api/index.ts,
// which imports the same `app` and exports it as a serverless function.
import { app } from "./app.js";

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Logistics API listening on :${port}`);
});
