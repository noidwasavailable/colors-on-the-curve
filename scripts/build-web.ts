import { join } from "node:path";
import config from "./build.config";

const jszipBrowser = join(
	import.meta.dir,
	"../node_modules/jszip/dist/jszip.min.js",
);

const build = await Bun.build({
	entrypoints: config.entryPoints.web,
	compile: true,
	target: "browser",
	outdir: config.outDir.web,
	minify: true,
	format: "esm",

	plugins: [
		{
			name: "browser-shims",
			setup(build) {
				// Redirect jszip to its pre-built browser bundle to avoid Node.js builtins
				build.onResolve({ filter: /^jszip$/ }, () => ({
					path: jszipBrowser,
				}));
			},
		},
	],
});

console.log(`Build for web: ${build.success ? "SUCCESS" : "FAIL"}`);
if (!build.success) {
	for (const log of build.logs) {
		console.error(log);
	}
}
process.exit(build.success ? 0 : 1);
