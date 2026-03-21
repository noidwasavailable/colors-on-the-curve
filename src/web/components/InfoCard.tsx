import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ExternalLinkIcon } from "@/web/externals";
import { EXTERNAL_LINKS } from "@/web/externals";

function svgToDataUri(svg: string): string {
	// Inject viewBox if the SVG tag doesn't already have one so that
	// the <img> element has a coordinate system to scale against.
	const normalised = svg.includes("viewBox")
		? svg
		: svg.replace("<svg", `<svg viewBox="0 0 24 24"`);
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalised)}`;
}

function LinkIcon({
	icon,
	size = 14,
}: {
	icon: ExternalLinkIcon;
	size?: number;
}) {
	if (typeof icon === "string") {
		return (
			<img
				src={svgToDataUri(icon)}
				alt=""
				width={size}
				height={size}
				style={{ flexShrink: 0, filter: "invert(1)", opacity: 0.7 }}
			/>
		);
	}
	const Icon = icon;
	return <Icon size={size} strokeWidth={2} />;
}

export function InfoCard() {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// Close when clicking outside
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	return (
		<div ref={ref} style={{ position: "relative" }}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label="Info"
				style={{
					background: "none",
					border: "none",
					padding: "0.25rem",
					cursor: "pointer",
					color: open ? "var(--accent-hover)" : "var(--text-muted)",
					display: "flex",
					alignItems: "center",
					borderRadius: "var(--radius-sm)",
					transition: "color 0.15s ease",
				}}
				onMouseEnter={(e) =>
					((e.currentTarget as HTMLButtonElement).style.color =
						"var(--accent-hover)")
				}
				onMouseLeave={(e) => {
					if (!open)
						(e.currentTarget as HTMLButtonElement).style.color =
							"var(--text-muted)";
				}}
			>
				<Info size={16} strokeWidth={2} />
			</button>

			{open && (
				<div
					style={{
						position: "absolute",
						top: "calc(100% + 0.5rem)",
						left: "50%",
						transform: "translateX(-100%)",
						background: "rgba(25, 28, 35, 0.95)",
						backdropFilter: "blur(16px)",
						WebkitBackdropFilter: "blur(16px)",
						border: "1px solid var(--border-color-focus)",
						borderRadius: "var(--radius-md)",
						padding: "0.75rem",
						minWidth: "160px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
						zIndex: 100,
						display: "flex",
						flexDirection: "column",
						gap: "0.25rem",
					}}
				>
					<span style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
						Made by{" "}
						<a
							href="https://github.com/noidwasavailable"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								color: "var(--text-main)",
								textDecoration: "none",
								fontWeight: 600,
							}}
						>
							noidwasavailable
						</a>
					</span>
					{EXTERNAL_LINKS.map((link) => (
						<a
							key={link.href}
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.625rem",
								padding: "0.5rem 0.625rem",
								borderRadius: "var(--radius-sm)",
								color: "var(--text-muted)",
								textDecoration: "none",
								fontSize: "0.875rem",
								fontWeight: 500,
								transition: "background 0.15s ease, color 0.15s ease",
							}}
							onMouseEnter={(e) => {
								const el = e.currentTarget as HTMLAnchorElement;
								el.style.background = "rgba(255,255,255,0.06)";
								el.style.color = "var(--text-main)";
							}}
							onMouseLeave={(e) => {
								const el = e.currentTarget as HTMLAnchorElement;
								el.style.background = "transparent";
								el.style.color = "var(--text-muted)";
							}}
						>
							<LinkIcon icon={link.icon} size={14} />
							{link.label}
						</a>
					))}
				</div>
			)}
		</div>
	);
}
