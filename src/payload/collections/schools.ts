/**
 * Schools Collection Configuration
 *
 * Types and methods for the Schools collection in Payload CMS
 * Schools are associated with a MarketArea (community)
 */
import type { Media, PayloadPaginatedDocs, RichText } from "../types";
import type { MarketArea } from "./market-areas";

export interface School {
	id: string;
	marketArea: string | MarketArea;
	name: string;
	slug: string;
	description?: string | null;
	featuredImage?: string | Media | null;
	district?: string | null;
	contact?: SchoolContact | null;
	location?: SchoolLocation | null;
	grades?: string | null;
	content?: RichText | null;
	status?: "draft" | "published" | "archived" | null;
	createdAt: string;
	updatedAt: string;
}

export interface SchoolContact {
	phone?: string | null;
	email?: string | null;
	website?: string | null;
}

export interface SchoolLocation {
	address?: string | null;
}

export interface SchoolsCollectionMethods {
	/**
	 * Get schools with optional filtering
	 */
	getSchools(params?: {
		limit?: number;
		page?: number;
		sort?: string;
		depth?: number;
	}): Promise<PayloadPaginatedDocs<School>>;

	/**
	 * Get schools for a specific market area (community) by ID
	 */
	getSchoolsByMarketArea(
		marketAreaId: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		},
	): Promise<PayloadPaginatedDocs<School>>;

	/**
	 * Get schools for a market area by its slug
	 */
	getSchoolsByMarketAreaSlug(
		marketAreaSlug: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		},
	): Promise<PayloadPaginatedDocs<School>>;

	/**
	 * Get a single school by slug
	 */
	getSchoolBySlug(
		slug: string,
		params?: { depth?: number },
	): Promise<School | null>;

	/**
	 * Get a single school by ID
	 */
	getSchoolById(
		id: string,
		params?: { depth?: number },
	): Promise<School | null>;
}
