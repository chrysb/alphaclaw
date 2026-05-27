import { mkdirSync, rmSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const publicRoot = path.join(projectRoot, "lib", "public");
const distDir = path.join(publicRoot, "dist");
const entryPoint = path.join(publicRoot, "js", "app.js");
const tailwindConfigPath = path.join(projectRoot, "tailwind.config.cjs");
const tailwindInputPath = path.join(publicRoot, "css", "tailwind.input.css");
const tailwindOutputPath = path.join(publicRoot, "css", "tailwind.generated.css");
const xtermCssSrc = path.join(
  projectRoot,
  "node_modules",
  "@xterm",
  "xterm",
  "css",
  "xterm.css",
);
const xtermCssDestDir = path.join(publicRoot, "css", "vendor");
const xtermCssDest = path.join(xtermCssDestDir, "xterm.css");
const execFileAsync = promisify(execFile);

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(xtermCssDestDir, { recursive: true });
copyFileSync(xtermCssSrc, xtermCssDest);
await execFileAsync(
  "npm",
  [
    "exec",
    "tailwindcss",
    "--",
    "-c",
    tailwindConfigPath,
    "-i",
    tailwindInputPath,
    "-o",
    tailwindOutputPath,
    "--minify",
  ],
  { cwd: projectRoot },
);

await esbuild.build({
  entryPoints: [entryPoint],
  outdir: distDir,
  bundle: true,
  format: "esm",
  splitting: true,
  minify: true,
  sourcemap: false,
  target: ["es2022"],
  entryNames: "[name].bundle",
  chunkNames: "chunks/[name]-[hash]",
  logLevel: "info",
});
