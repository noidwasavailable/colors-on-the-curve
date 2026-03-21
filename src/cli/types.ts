import type { FigmaTokenGroup, PaletteResult } from "@/lib/types";

export type SaveOptions = {
	exportTokens?: boolean;
};

export type SaveResult = {
	outFilePath: string;
	tokensSaved: boolean;
	tokensFilePath: string;
};

export type SaveFunction = (
	data: PaletteResult | PaletteResult[] | undefined,
	tokens?: FigmaTokenGroup,
	options?: SaveOptions,
) => Promise<SaveResult>;
