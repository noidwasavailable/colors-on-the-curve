import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import type { UiMode } from "@/lib/constants";
import type { PaletteResult } from "@/lib/types";
import { ColorSwatch } from "./ColorSwatch";

interface PaletteItemProps {
	palette: PaletteResult;
	index: number;
	isActive: boolean;
	mode: UiMode;
	onSelectPalette: () => void;
	onRemovePalette: () => void;
	onRenamePalette: (name: string) => void;
}

export function PaletteItem({
	palette,
	index,
	isActive,
	mode,
	onSelectPalette,
	onRemovePalette,
	onRenamePalette,
}: PaletteItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(palette.name);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: conditionally interactive element
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "0.5rem",
				padding: isActive ? "1rem" : "0.5rem 1rem",
				border: isActive
					? "1px solid var(--accent-color)"
					: "1px solid transparent",
				background: isActive
					? "rgba(255, 255, 255, 0.05)"
					: "transparent",
				borderRadius: "var(--radius-lg)",
				cursor: mode === "PALETTES" ? "pointer" : "default",
				transition: "all 0.2s ease",
			}}
			role={mode === "PALETTES" ? "button" : undefined}
			tabIndex={mode === "PALETTES" ? 0 : undefined}
			onClick={() => {
				if (mode === "PALETTES") onSelectPalette();
			}}
			onKeyDown={(e) => {
				if (mode === "PALETTES" && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault();
					onSelectPalette();
				}
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				{isEditing ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
							width: "50%",
						}}
					>
						<input
							// biome-ignore lint/a11y/noAutofocus: intentional edit mode autofocus
							autoFocus
							type="text"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							onClick={(e) => e.stopPropagation()}
							placeholder={`Palette ${index + 1}`}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									onRenamePalette(editName);
									setIsEditing(false);
								} else if (e.key === "Escape") {
									setIsEditing(false);
									setEditName(palette.name);
								}
							}}
							style={{
								margin: 0,
								fontSize: "1.2rem",
								fontWeight: 600,
								background: "rgba(0,0,0,0.2)",
								border: "1px solid var(--border-color)",
								borderRadius: "var(--radius-sm)",
								color: "var(--text-main)",
								outline: "none",
								fontFamily: "var(--font-sans)",
								padding: "0.25rem 0.5rem",
								width: "100%",
							}}
						/>
						<button
							type="button"
							className="btn"
							style={{
								padding: "0.25rem",
								color: "var(--success-color)",
								background: "rgba(16, 185, 129, 0.1)",
								border: "none",
							}}
							onClick={(e) => {
								e.stopPropagation();
								onRenamePalette(editName);
								setIsEditing(false);
							}}
							title="Save Name"
						>
							<Check size={18} />
						</button>
						<button
							type="button"
							className="btn"
							style={{
								padding: "0.25rem",
								color: "var(--danger-color)",
								background: "rgba(239, 68, 68, 0.1)",
								border: "none",
							}}
							onClick={(e) => {
								e.stopPropagation();
								setIsEditing(false);
								setEditName(palette.name);
							}}
							title="Cancel"
						>
							<X size={18} />
						</button>
					</div>
				) : (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
						}}
					>
						<h3
							style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}
						>
							{palette.name}
						</h3>
						<button
							type="button"
							className="btn"
							style={{
								padding: "0.25rem",
								background: "transparent",
								border: "none",
								color: "var(--text-muted)",
								opacity: 0.6,
							}}
							onClick={(e) => {
								e.stopPropagation();
								setEditName(palette.name);
								setIsEditing(true);
							}}
							title="Edit Name"
						>
							<Pencil size={16} />
						</button>
					</div>
				)}
				<div
					style={{ display: "flex", gap: "1rem", alignItems: "center" }}
				>
					<span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
						{palette.colors.length} shades
					</span>
					{mode === "PALETTES" && (
						<button
							type="button"
							className="btn"
							style={{
								padding: "0.25rem 0.5rem",
								minWidth: "auto",
								height: "auto",
								color: "var(--text-muted)",
							}}
							onClick={(e) => {
								e.stopPropagation();
								onRemovePalette();
							}}
							title="Remove Palette"
						>
							−
						</button>
					)}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "row",
					width: "100%",
					borderRadius: "var(--radius-lg)",
					overflow: "visible", // for swatch hover popout
					isolation: "isolate",
				}}
			>
				{palette.colors.map((c) => (
					<ColorSwatch
						key={`${palette.name}-${c.shade}`}
						hex={c.hex}
						shade={c.shade}
						isCmykSafe={c.isCmykSafe}
						lightness={c.hsl[2]}
					/>
				))}
			</div>
		</div>
	);
}
