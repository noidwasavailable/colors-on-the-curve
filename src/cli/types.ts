import type { UiMode } from "@/lib/constants";
import type { ConfigInput, FigmaTokenGroup, PaletteResult } from "@/lib/types";

export type SaveOptions = {
	exportTokens?: boolean;
	transparencyTokens?: boolean;
};

export type SaveResult = {
	outFilePath: string;
	tokensSaved: boolean;
	tokensFilePath: string;
	transparencyTokensSaved: boolean;
	transparencyDir: string;
};

export type SaveFunction = (
	config: ConfigInput,
	mode: UiMode,
	data: PaletteResult[],
	tokens?: FigmaTokenGroup,
	options?: SaveOptions,
) => Promise<SaveResult>;
