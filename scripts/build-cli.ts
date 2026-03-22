import config from "./build.config";

// if the build doesn't work because of some bun dependency issues, try doing:
// bun install --os="*" --cpu="*"
// it will force install all packages for all platforms
for (const target of [
	"bun-linux-x64",
	"bun-linux-arm64",
	"bun-darwin-x64",
	"bun-darwin-arm64",
	"bun-windows-x64",
] as Bun.Build.CompileTarget[]) {
	console.log(`Building for target: ${target}`);

	const [_, platform, arch] = target.split("-");
	const nodePlatform = platform === "windows" ? "win32" : platform;

	const build = await Bun.build({
		entrypoints: config.entryPoints.cli,
		compile: {
			target: target,
			outfile: `${config.outDir.cli}/${target}/cotc`,
		},
		define: {
			"process.platform": JSON.stringify(nodePlatform),
			"process.arch": JSON.stringify(arch),
		},
		format: "esm",
		minify: true,
		sourcemap: "linked",
	});

	console.log(`Build for ${target}: ${build.success ? "SUCCESS" : "FAIL"}`);
}
