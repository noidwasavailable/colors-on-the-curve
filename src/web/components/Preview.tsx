import type { UiMode } from "@/lib/constants";
import type { PaletteResult } from "@/lib/types";
import { PaletteItem } from "./PaletteItem";

interface PreviewProps {
	palettes: PaletteResult[];
	mode: UiMode;
	activeIndex: number;
	onSelectPalette: (idx: number) => void;
	onRemovePalette: (idx: number) => void;
	onAddPalette: () => void;
	onRenamePalette: (idx: number, name: string) => void;
}

export function Preview({
	palettes,
	mode,
	activeIndex,
	onSelectPalette,
	onRemovePalette,
	onRenamePalette,
	onAddPalette,
}: PreviewProps) {
	if (palettes.length === 0) {
		return (
			<div
				style={{
					display: "grid",
					placeItems: "center",
					height: "100%",
					color: "var(--text-muted)",
				}}
			>
				No palettes to preview
			</div>
		);
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				overflowY: "auto",
				padding: "1.5rem",
				gap: "1rem",
			}}
		>
			{palettes.map((palette, i) => (
				<PaletteItem
					key={palette.id || `palette-${i}`}
					palette={palette}
					index={i}
					mode={mode}
					isActive={mode === "PALETTES" && activeIndex === i}
					canRemove={palettes.length > 1}
					onSelectPalette={() => onSelectPalette(i)}
					onRemovePalette={() => onRemovePalette(i)}
					onRenamePalette={(name) => onRenamePalette(i, name)}
				/>
			))}

			{mode === "PALETTES" && (
				<button
					type="button"
					className="btn"
					style={{
						marginTop: "1rem",
						borderStyle: "dashed",
						padding: "1rem",
						opacity: 0.8,
					}}
					onClick={onAddPalette}
				>
					+ Add Palette
				</button>
			)}
		</div>
	);
}
