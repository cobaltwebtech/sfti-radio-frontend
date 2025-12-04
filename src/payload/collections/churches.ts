/**
 * Churches Collection Configuration
 *
 * Types and methods for the Churches collection in Payload CMS
 * Churches are associated with a MarketArea (community)
 */
import type { PayloadPaginatedDocs } from "../types";
import type { MarketArea } from "./market-areas";
import type { Media } from "./media";
import type { RichText } from "./news";

export interface Church {
	id: string;
	marketArea: string | MarketArea;
	name: string;
	slug: string;
	denomination?: string | null;
	featuredImage?: string | Media | null;
	contact?: ChurchContact | null;
	location?: ChurchLocation | null;
	serviceTimes?: ServiceTime[] | null;
	content?: RichText | null;
	status?: "draft" | "published" | "archived" | null;
	createdAt: string;
	updatedAt: string;
}

export interface ChurchContact {
	phone?: string | null;
	email?: string | null;
	website?: string | null;
}

export interface ChurchLocation {
	address?: string | null;
}

export interface ServiceTime {
	id?: string | null;
	day?:
		| "sunday"
		| "monday"
		| "tuesday"
		| "wednesday"
		| "thursday"
		| "friday"
		| "saturday"
		| null;
	time?: string | null;
	serviceName?: string | null;
}

export interface ChurchesCollectionMethods {
	/**
	 * Get churches with optional filtering
	 */
	getChurches(params?: {
		limit?: number;
		page?: number;
		sort?: string;
		depth?: number;
	}): Promise<PayloadPaginatedDocs<Church>>;

	/**
	 * Get churches for a specific market area (community) by ID
	 */
	getChurchesByMarketArea(
		marketAreaId: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		},
	): Promise<PayloadPaginatedDocs<Church>>;

	/**
	 * Get churches for a market area by its slug
	 */
	getChurchesByMarketAreaSlug(
		marketAreaSlug: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		},
	): Promise<PayloadPaginatedDocs<Church>>;

	/**
	 * Get a single church by slug
	 */
	getChurchBySlug(
		slug: string,
		params?: { depth?: number },
	): Promise<Church | null>;

	/**
	 * Get a single church by ID
	 */
	getChurchById(
		id: string,
		params?: { depth?: number },
	): Promise<Church | null>;
}
