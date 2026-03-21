import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import type { UiMode } from "@/lib/constants";
import type { PaletteResult } from "@/lib/types";

export function ColorSwatch({
	hex,
	shade,
	isCmykSafe,
	lightness,
}: {
	hex: string;
	shade: number;
	isCmykSafe: boolean;
	lightness: number;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(hex);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const textColor = lightness > 60 ? "#202020" : "#f0f0f0";
	const textOutlineColor = lightness > 60 ? "#f0f0f0" : "#202020";

	return (
		<button
			type="button"
			onClick={handleCopy}
			style={{
				backgroundColor: hex,
				color: textColor,
				flex: 1,
				minHeight: "75px",
				display: "flex",
				flexDirection: "column",
				justifyContent: "flex-end",
				padding: "0.5rem 1rem",
				cursor: "pointer",
				position: "relative",
				transition: "transform 0.2s, box-shadow 0.2s, z-index 0s",
				outline: "1px solid rgba(0,0,0,0.1)",
				outlineOffset: "-1px",
			}}
			className="color-swatch hover-effect"
			onMouseEnter={(e) => {
				e.currentTarget.style.transform = "scale(1.05)";
				e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.3)";
				e.currentTarget.style.zIndex = "10";
				e.currentTarget.style.borderRadius = "var(--radius-md)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.transform = "scale(1)";
				e.currentTarget.style.boxShadow = "none";
				e.currentTarget.style.zIndex = "1";
				e.currentTarget.style.borderRadius = "0";
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-end",
				}}
			>
				<div style={{ display: "flex", flexDirection: "column" }}>
					<span
						style={{
							fontWeight: 700,
							fontSize: "1.1rem",
							textShadow: `-1px -1px 0 ${textOutlineColor}, 1px -1px 0 ${textOutlineColor}, -1px 1px 0 ${textOutlineColor}, 1px 1px 0 ${textOutlineColor}`,
						}}
					>
						{shade}
					</span>
					<span
						className="font-mono"
						style={{
							opacity: 0.8,
							fontSize: "0.875rem",
							textShadow: `-1px -1px 0 ${textOutlineColor}, 1px -1px 0 ${textOutlineColor}, -1px 1px 0 ${textOutlineColor}, 1px 1px 0 ${textOutlineColor}`,
						}}
					>
						{copied ? "Copied!" : hex.toUpperCase()}
					</span>
				</div>
				{!isCmykSafe && (
					<span
						title="Out of gamut for CMYK"
						style={{
							fontSize: "1.2rem",
							filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))",
						}}
					>
						⚠️
					</span>
				)}
			</div>
		</button>
	);
}

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
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editName, setEditName] = useState("");

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
			{palettes.map((palette, i) => {
				const isActive = mode === "ARRAY" && activeIndex === i;
				const isEditing = editingIndex === i;

				return (
					// biome-ignore lint/a11y/noStaticElementInteractions: conditionally interactive element
					<div
						key={palette.id || `palette-${i}`}
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
							cursor: mode === "ARRAY" ? "pointer" : "default",
							transition: "all 0.2s ease",
						}}
						role={mode === "ARRAY" ? "button" : undefined}
						tabIndex={mode === "ARRAY" ? 0 : undefined}
						onClick={() => {
							if (mode === "ARRAY") onSelectPalette(i);
						}}
						onKeyDown={(e) => {
							if (mode === "ARRAY" && (e.key === "Enter" || e.key === " ")) {
								e.preventDefault();
								onSelectPalette(i);
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
										placeholder={`Palette ${i + 1}`}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												onRenamePalette(i, editName);
												setEditingIndex(null);
											} else if (e.key === "Escape") {
												setEditingIndex(null);
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
											onRenamePalette(i, editName);
											setEditingIndex(null);
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
											setEditingIndex(null);
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
											setEditingIndex(i);
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
								<span className="text-muted font-mono text-sm">
									{palette.colors.length} shades
								</span>
								{mode === "ARRAY" && (
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
											onRemovePalette(i);
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
			})}

			{mode === "ARRAY" && (
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
