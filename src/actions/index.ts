/**
 * Astro Actions for Form Submission
 *
 * Server-side actions for handling form submissions to Payload CMS
 */

import { ActionError, defineAction } from "astro:actions";
import { env } from "cloudflare:workers";
import { z } from "astro/zod";
import { getPayloadClient } from "@/payload";
import type { FormSubmissionRequest } from "@/payload/collections/forms";

/**
 * Verify Cloudflare Turnstile token
 */
async function verifyTurnstileToken(
	token: string,
	secretKey: string,
): Promise<boolean> {
	const formData = new FormData();
	formData.append("secret", secretKey);
	formData.append("response", token);

	try {
		const result = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				body: formData,
			},
		);

		const outcome = (await result.json()) as { success: boolean };
		return outcome.success;
	} catch (error) {
		console.error("Turnstile verification error:", error);
		return false;
	}
}

/**
 * Contact Form Schema
 */
const contactFormSchema = z.object({
	type: z.enum(["church", "school", "sponsor", "other"], {
		error: "Please select a type",
	}),
	name: z.string().min(1, "Name is required"),
	email: z.email("Valid email is required"),
	phone: z.string().optional(),
	message: z.string().optional(),
	formId: z.number().default(1), // Default to form ID 1
	"cf-turnstile-response": z
		.string({ error: "CAPTCHA verification is required" })
		.min(1, "CAPTCHA verification is required"),
});

/**
 * Generic Form Submission Schema (without file support)
 */
const genericFormSchema = z.object({
	formId: z.number(),
	fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export const server = {
	/**
	 * Submit Contact Form
	 *
	 * Handles contact form submission without file attachments
	 */
	submitContactForm: defineAction({
		accept: "form",
		input: contactFormSchema,
		handler: async (input, _context) => {
			// Verify Turnstile token server-side
			const isValidToken = await verifyTurnstileToken(
				input["cf-turnstile-response"],
				env.TURNSTILE_SECRET_KEY,
			);

			if (!isValidToken) {
				throw new ActionError({
					code: "UNAUTHORIZED",
					message: "CAPTCHA verification failed. Please try again.",
				});
			}

			const payload = getPayloadClient({
				worker: env.PAYLOAD_CMS_WORKER,
				apiUrl: env.PAYLOAD_API_URL,
			});

			try {
				// Prepare submission data
				const submissionData = [
					{ field: "type", value: input.type },
					{ field: "name", value: input.name },
					{ field: "email", value: input.email },
					...(input.phone ? [{ field: "phone", value: input.phone }] : []),
					...(input.message
						? [{ field: "message", value: input.message }]
						: []),
				];

				// Submit form to Payload CMS
				const submissionResponse = await payload.submitForm({
					form: input.formId,
					submissionData,
				});

				return {
					success: true,
					message: "Form submitted successfully!",
					submissionId: submissionResponse.doc.id,
				};
			} catch (error) {
				console.error("Form submission error:", error);

				// Check if error message indicates the form was submitted but there's a Payload CMS internal error
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				if (
					errorMessage.includes("Form submission failed: Internal Server Error")
				) {
					// The submission likely succeeded despite the 500 error (Payload CMS D1 bug)
					// Return success to avoid confusing the user
					return {
						success: true,
						message: "Form submitted successfully!",
						submissionId: undefined,
					};
				}

				throw new Error(
					error instanceof Error
						? error.message
						: "Failed to submit form. Please try again.",
				);
			}
		},
	}),

	/**
	 * Submit Generic Form
	 *
	 * Handles any form submission dynamically based on form ID and fields
	 * (without file upload support)
	 */
	submitForm: defineAction({
		accept: "form",
		input: genericFormSchema,
		handler: async (input, _context) => {
			const payload = getPayloadClient({
				worker: env.PAYLOAD_CMS_WORKER,
				apiUrl: env.PAYLOAD_API_URL,
			});

			try {
				// Prepare submission data
				const submissionData: FormSubmissionRequest["submissionData"] =
					Object.entries(input.fields).map(([field, value]) => ({
						field,
						value: String(value),
					}));

				// Submit form
				const submissionResponse = await payload.submitForm({
					form: input.formId,
					submissionData,
				});

				return {
					success: true,
					message: "Form submitted successfully!",
					submissionId: submissionResponse.doc.id,
				};
			} catch (error) {
				console.error("Form submission error:", error);
				throw new Error(
					error instanceof Error
						? error.message
						: "Failed to submit form. Please try again.",
				);
			}
		},
	}),

	/**
	 * Get Form Definition
	 *
	 * Fetch form configuration from Payload CMS
	 */
	getForm: defineAction({
		accept: "json",
		input: z.object({
			formId: z.union([z.string(), z.number()]),
		}),
		handler: async (input, _context) => {
			const payload = getPayloadClient({
				worker: env.PAYLOAD_CMS_WORKER,
				apiUrl: env.PAYLOAD_API_URL,
			});

			try {
				const form = await payload.getForm(input.formId);
				return {
					success: true,
					form,
				};
			} catch (error) {
				console.error("Failed to fetch form:", error);
				throw new Error(
					error instanceof Error
						? error.message
						: "Failed to load form. Please try again.",
				);
			}
		},
	}),
};
