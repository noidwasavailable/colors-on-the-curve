/**
 * Centralised UI color tokens for the CLI.
 * All color props across App, Editor, and PalettePreview should reference this file.
 */
export const UI_COLORS = {
	/** Primary accent – app title, help border */
	accent: "#00D4FF",
	/** Success / active / save – bright green, readable in all terminals */
	success: "#50FA7B",
	/** Warning – mode label, property description */
	warning: "#FFD93D",
	/** Error / danger – out-of-gamut, quit key */
	error: "#FF6E6E",
	/** Muted text – hints, inactive labels, panel borders */
	muted: "#A0A0A0",
	/** Rename-mode border */
	rename: "#50FA7B",
} as const;
