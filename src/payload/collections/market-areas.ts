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
	streamId?: StreamId[] | null;
	customStreamUrl?: CustomStreamUrl[] | null;
	createdAt: string;
	updatedAt: string;
}

export interface SurroundingArea {
	name: string;
	id?: string | null;
}

export interface StreamId {
	id: string;
	title: string;
}

export interface CustomStreamUrl {
	id?: string | null;
	url: string;
	title: string;
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
