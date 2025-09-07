import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  for (const file of ["../.env", "../.env.example"]) {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const match = content.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        return match[1].trim();
      }
    }
  }

  return undefined;
}

if (!resolveDatabaseUrl()) {
  console.error("Error: DATABASE_URL is required for this operation.");
  process.exit(1);
}
