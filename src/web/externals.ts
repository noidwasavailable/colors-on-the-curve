import { BookOpenText } from "lucide-react";
import type { ComponentType } from "react";
import socialIcons from "@/assets/socialIcons";

/** Icon is either a lucide-react component or a raw SVG string. */
export type ExternalLinkIcon =
	| ComponentType<{ size?: number; strokeWidth?: number }>
	| string;

export interface ExternalLink {
	icon: ExternalLinkIcon;
	label: string;
	href: string;
}

export const EXTERNAL_LINKS: ExternalLink[] = [
	{
		icon: BookOpenText,
		label: "About",
		href: "https://nourlwasavailable.com/",
	},
	{
		icon: socialIcons.Github,
		label: "Source Code",
		href: "https://github.com/noidwasavailable",
	},
];
