import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { render } from "ink";
import type { UiMode } from "@/lib/constants";
import { defaultPaletteConfig } from "@/lib/defaults";
import type { ConfigInput } from "@/lib/types";
import type { SaveFunction } from "./types";
import { App } from "./ui/App";

async function main() {
	const args = process.argv.slice(2);

	if (args.includes("--help") || args.includes("-h")) {
		const helpText = await Bun.file(
			new URL("./help.txt", import.meta.url),
		).text();
		console.log(helpText);
		process.exit(0);
	}

	const configPath = args.find((a) => !a.startsWith("--"));
	const outDirArg = args.find((a) => a.startsWith("--out-dir="));
	const exportTokensFromFlag = args.includes("--tokens");

	const outDir = outDirArg?.split("=")[1] || "data";

	const fullPath = configPath ? resolve(process.cwd(), configPath) : null;
	const baseName = configPath
		? basename(configPath, extname(configPath))
		: "palette";

	try {
		let initialConfig: ConfigInput = { ...defaultPaletteConfig };
		let initialMode: UiMode = "PALETTES";

		if (fullPath) {
			const configModule = await import(fullPath);
			const loadedConfig =
				configModule.default || configModule.config || configModule;

			if (!loadedConfig) {
				console.error(
					'Config file must export a default object/array or a named export "config".',
				);
				process.exit(1);
			}

			if (
				loadedConfig.version === 1 &&
				loadedConfig.mode &&
				loadedConfig.config
			) {
				initialConfig = loadedConfig.config;
				initialMode = loadedConfig.mode;
			} else {
				initialConfig = loadedConfig;
			}
		}

		const outDirPath = resolve(process.cwd(), outDir);

		const onSave: SaveFunction = async (
			config,
			mode,
			outputData,
			tokenData,
			options,
		) => {
			await mkdir(outDirPath, { recursive: true });

			const outFilename = `${baseName}.json`;
			const outFilePath = join(outDirPath, outFilename);

			const exportData = {
				version: 1,
				mode,
				config,
				palettes: outputData,
			};

			await writeFile(
				outFilePath,
				JSON.stringify(exportData, null, 2),
				"utf-8",
			);

			const shouldExportTokens = options?.exportTokens ?? exportTokensFromFlag;

			let tokensSaved = false;
			const tokensFilePath = join(outDirPath, `${baseName}.tokens.json`);

			if (shouldExportTokens && tokenData) {
				await writeFile(
					tokensFilePath,
					JSON.stringify(tokenData, null, 2),
					"utf-8",
				);
				tokensSaved = true;
			}

			return { outFilePath, tokensSaved, tokensFilePath };
		};

		render(
			<App
				initialConfig={initialConfig}
				initialMode={initialMode}
				onSave={onSave}
				exportTokens={exportTokensFromFlag}
			/>,
		);
	} catch (err) {
		console.error("Failed to start CLI:", err);
		process.exit(1);
	}
}

main();
