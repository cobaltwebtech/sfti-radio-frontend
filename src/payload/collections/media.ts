/**
 * Media Collection Configuration
 *
 * Types for the Media collection in Payload CMS
 * Media is a shared type used by multiple collections for images/files
 */

export interface Media {
	id: string;
	alt?: string | null;
	url?: string | null;
	filename?: string | null;
	mimeType?: string | null;
	filesize?: number | null;
	width?: number | null;
	height?: number | null;
	createdAt: string;
	updatedAt: string;
}
