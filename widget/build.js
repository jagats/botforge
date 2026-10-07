const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🛠️ Building BotForge embeddable widget...");

const widgetDir = __dirname;
const distDir = path.join(widgetDir, "dist");
const backendStaticDir = path.join(widgetDir, "..", "backend", "app", "static");
const frontendPublicDir = path.join(widgetDir, "..", "frontend", "public");

// Ensure directories
[distDir, backendStaticDir, frontendPublicDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Compile with tsc
try {
  console.log("Compiling TypeScript with tsc...");
  execSync("npx tsc -p tsconfig.json", { cwd: widgetDir, stdio: "inherit" });
} catch (err) {
  console.error("TypeScript compilation failed:", err);
  process.exit(1);
}

const builtFile = path.join(distDir, "widget.js");
if (!fs.existsSync(builtFile)) {
  console.error("Expected build output dist/widget.js not found!");
  process.exit(1);
}

// Copy to backend/app/static and frontend/public
const backendTarget = path.join(backendStaticDir, "widget.js");
const frontendTarget = path.join(frontendPublicDir, "widget.js");

fs.copyFileSync(builtFile, backendTarget);
fs.copyFileSync(builtFile, frontendTarget);

const stats = fs.statSync(builtFile);
const sizeKb = (stats.size / 1024).toFixed(2);

console.log(`✅ Build successful!`);
console.log(`📦 Bundle size: ${sizeKb} KB (zero external dependencies)`);
console.log(`🚀 Copied to:`);
console.log(`   - ${builtFile}`);
console.log(`   - ${backendTarget}`);
console.log(`   - ${frontendTarget}`);
