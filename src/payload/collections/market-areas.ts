/**
 * Market Areas Collection Configuration
 *
 * Types and methods for the Market Areas collection in Payload CMS
 */
import type { PayloadPaginatedDocs } from "../types";

// Market Area type for regional content
export interface MarketArea {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	active?: boolean | null;
	surroundingAreas?: SurroundingArea[] | null;
	createdAt: string;
	updatedAt: string;
}

export interface SurroundingArea {
	name: string;
	id?: string | null;
}

export interface MarketAreaCollectionMethods {
	/**
	 * Get market areas with optional filtering
	 */
	getMarketAreas(params?: {
		limit?: number;
		page?: number;
		sort?: string;
	}): Promise<PayloadPaginatedDocs<MarketArea>>;

	/**
	 * Get a single market area by slug
	 */
	getMarketAreaBySlug(slug: string): Promise<MarketArea | null>;
}
