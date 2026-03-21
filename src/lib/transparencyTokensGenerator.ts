import { parseArgs } from "util";
import { parse as pathParse, join } from "path";
import { generateTransparencyTokens } from "./figmaExporter";

async function main() {
	const { positionals } = parseArgs({
		args: Bun.argv,
		strict: false,
		allowPositionals: true,
	});

	// positionals[0] is bun, positionals[1] is the script
	const inputFile = positionals[2];
	if (!inputFile) {
		console.error(
			"Usage: bun run src/transparencyTokensGenerator.ts <path-to-tokens.json>",
		);
		process.exit(1);
	}

	const parsed = pathParse(inputFile);
	// parsed.name omits the last extension (e.g. .json). We also strip .tokens if it exists.
	const baseName = parsed.name.replace(/\.tokens$/, "");
	const outDir = join(parsed.dir || ".", `${baseName}-transparency`);

	let tokensData: any;
	try {
		tokensData = await Bun.file(inputFile).json();
	} catch (error) {
		console.error(`Failed to read or parse input file: ${inputFile}`);
		console.error(error);
		process.exit(1);
	}

	await generateTransparencyTokens(tokensData, outDir);
	console.log(`Generated transparency tokens in the '${outDir}' directory.`);
}

await main();
