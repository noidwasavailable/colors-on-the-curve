import { cp, rm } from "node:fs/promises";
import { join } from "node:path";
import config from "./build.config";

const outDir = config.outDir.lib;
const rootDir = join(import.meta.dir, "..");
const libSrcDir = join(rootDir, "src/lib");

// 1. Clean dist/lib/
console.log(`Cleaning ${outDir}...`);
await rm(outDir, { recursive: true, force: true });

// 2. Build JS bundle with Bun
console.log("Building JS bundle...");
const build = await Bun.build({
	entrypoints: config.entryPoints.lib,
	outdir: outDir,
	target: "bun",
	format: "esm",
	minify: false,
	splitting: false,
	sourcemap: "none",
	external: ["ntc-ts"],
});

if (!build.success) {
	console.error("Build FAILED:");
	for (const log of build.logs) {
		console.error(log);
	}
	process.exit(1);
}
console.log(`Build for lib: SUCCESS (${build.outputs.length} output(s))`);

// 3. Emit .d.ts declarations via tsc
console.log("Emitting type declarations...");
const tsc = Bun.spawn(
	[process.execPath, "x", "tsc", "--project", join(rootDir, "tsconfig.lib.json")],
	{ cwd: rootDir, stdout: "inherit", stderr: "inherit" },
);
const tscCode = await tsc.exited;
if (tscCode !== 0) {
	console.error("tsc declaration emit FAILED");
	process.exit(1);
}
console.log("Type declarations emitted.");

// 4. Copy package.json and README.md into dist/lib/
console.log("Copying package.json and README.md...");
await cp(join(libSrcDir, "package.json"), join(outDir, "package.json"));
await cp(join(rootDir, "README.md"), join(outDir, "README.md"));

console.log(`\n✅ Library built to ./${outDir}/`);
console.log(`   Run: cd ${outDir} && bun publish --dry-run`);
