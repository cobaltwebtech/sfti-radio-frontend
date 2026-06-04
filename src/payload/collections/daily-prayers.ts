/**
 * Daily Prayers Collection Configuration
 *
 * Types and methods for the daily-prayer collection in Payload CMS.
 * Each document represents a month's worth of daily prayers (1-31).
 */
import type { LexicalContent } from "../../lib/lexical-renderer";
import type { PayloadPaginatedDocs } from "../types";

/**
 * A single day's prayer within a monthly document.
 */
export interface DailyPrayer {
	id: string;
	day: number; // 1-31
	prayer: LexicalContent;
	createdAt: string;
	updatedAt: string;
}

/**
 * A monthly document containing all daily prayers for that month.
 */
export interface DailyPrayersDocument {
	id: number | string;
	title: string; // e.g. "June 2026"
	month: number; // 1-12
	year: number; // e.g. 2026
	dailyPrayers: DailyPrayer[];
	createdAt: string;
	updatedAt: string;
}

export interface DailyPrayersCollectionMethods {
	/**
	 * Get prayers for a specific month/year.
	 */
	getDailyPrayersByMonthYear(
		month: number,
		year: number,
		params?: { depth?: number },
	): Promise<DailyPrayersDocument | null>;

	/**
	 * Get today's prayer (convenience method using current date).
	 */
	getTodaysPrayer(params?: { depth?: number }): Promise<DailyPrayer | null>;

	/**
	 * Get a single daily-prayer document by ID.
	 */
	getDailyPrayersDocumentById(
		id: string,
		params?: { depth?: number },
	): Promise<DailyPrayersDocument | null>;

	/**
	 * Get all daily-prayer documents (all months).
	 */
	getAllDailyPrayers(params?: {
		limit?: number;
		page?: number;
		sort?: string;
	}): Promise<PayloadPaginatedDocs<DailyPrayersDocument>>;
}
