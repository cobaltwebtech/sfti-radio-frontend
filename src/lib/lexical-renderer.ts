/**
 * Lexical Rich Text Renderer
 *
 * Converts Payload CMS Lexical editor JSON to HTML
 */

export interface LexicalNode {
	type: string;
	version: number;
	children?: LexicalNode[];
	text?: string;
	format?: number | string;
	style?: string;
	direction?: string | null;
	indent?: number;
	mode?: string;
	detail?: number;
	// Upload/media fields
	relationTo?: string;
	value?: {
		id: number;
		url?: string;
		alt?: string;
		filename?: string;
		mimeType?: string;
		width?: number;
		height?: number;
	};
	// Link fields
	fields?: {
		url?: string;
		newTab?: boolean;
		linkType?: string;
	};
	// Heading fields
	tag?: string;
}

export interface LexicalContent {
	root: LexicalNode;
}

// Text format flags (bitmask)
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE = 8;
const IS_CODE = 16;
const IS_SUBSCRIPT = 32;
const IS_SUPERSCRIPT = 64;

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Apply text formatting based on format bitmask
 */
function applyTextFormat(text: string, format: number): string {
	let result = escapeHtml(text);

	if (format & IS_CODE) {
		result = `<code>${result}</code>`;
	}
	if (format & IS_BOLD) {
		result = `<strong>${result}</strong>`;
	}
	if (format & IS_ITALIC) {
		result = `<em>${result}</em>`;
	}
	if (format & IS_UNDERLINE) {
		result = `<u>${result}</u>`;
	}
	if (format & IS_STRIKETHROUGH) {
		result = `<s>${result}</s>`;
	}
	if (format & IS_SUBSCRIPT) {
		result = `<sub>${result}</sub>`;
	}
	if (format & IS_SUPERSCRIPT) {
		result = `<sup>${result}</sup>`;
	}

	return result;
}

/**
 * Render a single Lexical node to HTML
 */
function renderNode(node: LexicalNode, mediaBaseUrl?: string): string {
	switch (node.type) {
		case "root": {
			return (
				node.children
					?.map((child) => renderNode(child, mediaBaseUrl))
					.join("") || ""
			);
		}

		case "paragraph": {
			const pContent =
				node.children
					?.map((child) => renderNode(child, mediaBaseUrl))
					.join("") || "";
			return `<p>${pContent}</p>`;
		}

		case "heading": {
			const tag = node.tag || "h2";
			const headingContent =
				node.children
					?.map((child) => renderNode(child, mediaBaseUrl))
					.join("") || "";
			return `<${tag}>${headingContent}</${tag}>`;
		}

		case "text": {
			if (node.text === undefined) return "";
			const format = typeof node.format === "number" ? node.format : 0;
			return applyTextFormat(node.text, format);
		}

		case "linebreak": {
			return "<br />";
		}

		case "link": {
			const linkContent =
				node.children
					?.map((child) => renderNode(child, mediaBaseUrl))
					.join("") || "";
			const url = node.fields?.url || "#";
			const target = node.fields?.newTab
				? ' target="_blank" rel="noopener noreferrer"'
				: "";
			return `<a href="${escapeHtml(url)}"${target}>${linkContent}</a>`;
		}

		case "upload": {
			if (node.value && node.relationTo === "media") {
				const media = node.value;
				let imgUrl = "";

				// Use the filename with R2 base URL (same as featured images)
				if (media.filename && mediaBaseUrl) {
					// Ensure no double slashes by removing trailing slash from base URL
					const baseUrl = mediaBaseUrl.replace(/\/$/, "");
					imgUrl = `${baseUrl}/${media.filename}`;
				} else if (media.url) {
					// Fallback to the original URL if no base URL provided
					imgUrl = media.url;
				}

				const alt = escapeHtml(media.alt || media.filename || "");
				const width = media.width ? ` width="${media.width}"` : "";
				const height = media.height ? ` height="${media.height}"` : "";

				return `<figure><img src="${escapeHtml(imgUrl)}" alt="${alt}"${width}${height} loading="lazy" /></figure>`;
			}
			return "";
		}

		case "quote": {
			const quoteContent =
				node.children
					?.map((child) => renderNode(child, mediaBaseUrl))
					.join("") || "";
			return `<blockquote>${quoteContent}</blockquote>`;
		}

		case "list": {
			const listTag =
				(node as unknown as { listType: string }).listType === "number"
					? "ol"
					: "ul";
			const listContent =
				node.children
					?.map((child) => renderNode(child, mediaBaseUrl))
					.join("") || "";
			return `<${listTag}>${listContent}</${listTag}>`;
		}

		case "listitem": {
			const liContent =
				node.children
					?.map((child) => renderNode(child, mediaBaseUrl))
					.join("") || "";
			return `<li>${liContent}</li>`;
		}

		case "code": {
			const codeContent =
				node.children
					?.map((child) => renderNode(child, mediaBaseUrl))
					.join("") || "";
			return `<pre><code>${codeContent}</code></pre>`;
		}

		case "horizontalrule": {
			return "<hr />";
		}

		default: {
			// For unknown nodes, try to render children if they exist
			if (node.children) {
				return node.children
					.map((child) => renderNode(child, mediaBaseUrl))
					.join("");
			}
			return "";
		}
	}
}

/**
 * Convert Lexical JSON content to HTML string
 *
 * @param content - The Lexical content object from Payload CMS
 * @param mediaBaseUrl - Optional base URL for media files (e.g., "http://localhost:3000")
 * @returns HTML string
 */
export function renderLexicalToHtml(
	content: LexicalContent | undefined | null,
	mediaBaseUrl?: string,
): string {
	if (!content || !content.root) {
		return "";
	}

	return renderNode(content.root, mediaBaseUrl);
}
