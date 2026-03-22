import config from "./build.config";

for (const target of [
	"bun-linux-x64",
	"bun-linux-arm64",
	"bun-darwin-x64",
	"bun-darwin-arm64",
	"bun-windows-x64",
] as Bun.Build.CompileTarget[]) {
	console.log(`Building for target: ${target}`);

	const build = await Bun.build({
		entrypoints: ["src/cli/index.ts"],
		compile: {
			target: target,
			outfile: `${config.outDir.cli}/${target}/cotc`,
		},
		format: "esm",
		minify: true,
		sourcemap: "linked",
		banner: `
      import { createRequire as _createRequire } from 'node:module';
      const require = _createRequire(import.meta.url);
    `,
		external: ["react-devtools-core"],
		// optimizeImports: ["ink", "ink-text-input", "lucide-react", "ntc-ts"],
		// bytecode: true,
	});

	console.log(`Build for ${target}: ${build.success ? "SUCCESS" : "FAIL"}`);
}
