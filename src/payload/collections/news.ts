/**
 * News Collection Configuration
 *
 * Types and methods for the News collection in Payload CMS
 * News articles are associated with a MarketArea (community)
 */
import type { Media, PayloadPaginatedDocs, RichText } from "../types";
import type { MarketArea } from "./market-areas";

/**
 * News article type
 * marketArea and featuredImage use union types because Payload returns
 * just the ID by default, or the full object when populated via depth
 */
export interface News {
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

export interface NewsCollectionMethods {
	/**
	 * Get news articles with optional filtering
	 */
	getNews(params?: {
		limit?: number;
		page?: number;
		sort?: string;
		depth?: number;
	}): Promise<PayloadPaginatedDocs<News>>;

	/**
	 * Get news articles for a specific market area (community)
	 */
	getNewsByMarketArea(
		marketAreaId: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		},
	): Promise<PayloadPaginatedDocs<News>>;

	/**
	 * Get news articles for a market area by its slug
	 */
	getNewsByMarketAreaSlug(
		marketAreaSlug: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		},
	): Promise<PayloadPaginatedDocs<News>>;

	/**
	 * Get a single news article by slug
	 */
	getNewsBySlug(
		slug: string,
		params?: { depth?: number },
	): Promise<News | null>;

	/**
	 * Get a single news article by ID
	 */
	getNewsById(id: string, params?: { depth?: number }): Promise<News | null>;
}
