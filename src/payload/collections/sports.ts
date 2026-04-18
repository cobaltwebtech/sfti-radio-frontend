/**
 * Sports Collection Configuration
 *
 * Types and methods for the Sports collection in Payload CMS
 * Sports articles are associated with a MarketArea (community)
 */
import type { Media, PayloadPaginatedDocs, RichText } from "../types";
import type { MarketArea } from "./market-areas";

export interface Sports {
	id: string;
	marketArea: string | MarketArea;
	title: string;
	slug: string;
	description: string;
	featuredImage?: string | Media | null;
	publishDate: string;
	content: RichText;
	status?: "draft" | "published" | "archived" | null;
	createdAt: string;
	updatedAt: string;
}

export interface SportsCollectionMethods {
	/**
	 * Get sports articles with optional filtering
	 */
	getSports(params?: {
		limit?: number;
		page?: number;
		sort?: string;
		depth?: number;
	}): Promise<PayloadPaginatedDocs<Sports>>;

	/**
	 * Get sports articles for a specific market area (community) by ID
	 */
	getSportsByMarketArea(
		marketAreaId: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		},
	): Promise<PayloadPaginatedDocs<Sports>>;

	/**
	 * Get sports articles for a market area by its slug
	 */
	getSportsByMarketAreaSlug(
		marketAreaSlug: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		},
	): Promise<PayloadPaginatedDocs<Sports>>;

	/**
	 * Get a single sports article by slug
	 */
	getSportsBySlug(
		slug: string,
		params?: { depth?: number },
	): Promise<Sports | null>;

	/**
	 * Get a single sports article by ID
	 */
	getSportsById(
		id: string,
		params?: { depth?: number },
	): Promise<Sports | null>;
}
