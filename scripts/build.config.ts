const config = {
	outDir: {
		cli: "dist/cli",
		web: "dist/web",
		lib: "dist/lib",
	},
	entryPoints: {
		cli: ["src/cli/index.ts"],
		web: ["src/web/index.html"],
		lib: ["src/lib/index.ts"],
	},
};

export default config;
