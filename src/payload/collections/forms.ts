/**
 * Form Builder Collection Types and Methods
 *
 * Types and methods for working with Payload CMS Form Builder plugin
 */

import type {
	CollectionQueryParams,
	PayloadClientOptions,
	PayloadPaginatedDocs,
} from "../types";

/**
 * Lexical Rich Text Content
 */
export interface LexicalContent {
	root: {
		type: string;
		children: Array<{
			type: string;
			version: number;
			[key: string]: unknown;
		}>;
		direction: string | null;
		format: string;
		indent: number;
		version: number;
	};
	[key: string]: unknown;
}

/**
 * Form Field Base
 */
export interface FormFieldBase {
	id: string;
	name: string;
	label?: string;
	width?: number | null;
	defaultValue?: string | null;
	required?: boolean;
	blockName?: string | null;
	blockType: string;
}

/**
 * Text Field
 */
export interface TextField extends FormFieldBase {
	blockType: "text";
	placeholder?: string;
}

/**
 * Textarea Field
 */
export interface TextareaField extends FormFieldBase {
	blockType: "textarea";
	placeholder?: string;
}

/**
 * Email Field
 */
export interface EmailField extends FormFieldBase {
	blockType: "email";
	placeholder?: string;
}

/**
 * Number Field
 */
export interface NumberField extends FormFieldBase {
	blockType: "number";
	placeholder?: string;
}

/**
 * Select Field
 */
export interface SelectField extends FormFieldBase {
	blockType: "select";
	options?: Array<{ label: string; value: string }>;
}

/**
 * Checkbox Field
 */
export interface CheckboxField extends FormFieldBase {
	blockType: "checkbox";
}

/**
 * Upload Field
 */
export interface UploadField extends FormFieldBase {
	blockType: "upload";
	mimeTypes?: string[];
	maxSize?: number;
}

/**
 * Message Block (not a form field)
 */
export interface MessageBlock {
	id: string;
	blockType: "message";
	message?: LexicalContent;
	blockName?: string | null;
}

/**
 * Union type for all form fields
 */
export type FormField =
	| TextField
	| TextareaField
	| EmailField
	| NumberField
	| SelectField
	| CheckboxField
	| UploadField
	| MessageBlock;

/**
 * Payload Form Definition
 */
export interface PayloadForm {
	id: number;
	title: string;
	fields: FormField[];
	submitButtonLabel?: string;
	confirmationType: "message" | "redirect";
	confirmationMessage?: LexicalContent;
	redirect?: {
		url?: string | null;
	};
	createdAt: string;
	updatedAt: string;
}

/**
 * Form Submission Data
 */
export interface FormSubmissionField {
	field: string;
	value: string | number | boolean | string[];
}

/**
 * Form Submission Request
 */
export interface FormSubmissionRequest {
	form: number; // Form ID
	submissionData: FormSubmissionField[];
}

/**
 * Form Submission Response
 */
export interface FormSubmissionResponse {
	message: string;
	doc: FormSubmission;
}

/**
 * Form Submission Document
 */
export interface FormSubmission {
	id: number;
	form: number;
	submissionData: FormSubmissionField[];
	createdAt: string;
	updatedAt: string;
}

/**
 * File Upload Request Data
 */
export interface FileUploadData {
	fieldName: string;
	formSubmission?: number;
	submissionId?: string;
	pendingSubmissionId?: string;
}

/**
 * File Upload Response
 */
export interface FileUploadResponse {
	message: string;
	doc: FileUpload;
}

/**
 * File Upload Document
 */
export interface FileUpload {
	id: number;
	filename: string;
	mimeType: string;
	filesize: number;
	width?: number;
	height?: number;
	focalX?: number;
	focalY?: number;
	url: string;
	thumbnailURL?: string;
	fieldName?: string;
	formSubmission?: number;
	pendingSubmissionId?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Forms Collection Methods
 */
export interface FormsCollectionMethods {
	/**
	 * Get all forms
	 */
	getForms(
		params?: CollectionQueryParams,
	): Promise<PayloadPaginatedDocs<PayloadForm>>;

	/**
	 * Get a single form by ID
	 */
	getForm(id: string | number): Promise<PayloadForm>;

	/**
	 * Submit a form
	 */
	submitForm(data: FormSubmissionRequest): Promise<FormSubmissionResponse>;

	/**
	 * Upload a file for a form submission
	 */
	uploadFormFile(file: File, data: FileUploadData): Promise<FileUploadResponse>;
}

/**
 * Implementation of Forms Collection Methods
 */
export function createFormsCollectionMethods(
	options: PayloadClientOptions,
): FormsCollectionMethods {
	/**
	 * Fetch helper function
	 */
	async function payloadFetch<T>(
		endpoint: string,
		init?: RequestInit,
	): Promise<T> {
		if (options.worker) {
			// Use worker binding in production
			const response = await options.worker.fetch(
				`https://cms/${endpoint}`,
				init,
			);
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Payload API error: ${response.statusText} - ${errorText}`,
				);
			}
			return response.json();
		}

		if (options.apiUrl) {
			// Use direct API URL in development
			const response = await fetch(`${options.apiUrl}/${endpoint}`, init);
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Payload API error: ${response.statusText} - ${errorText}`,
				);
			}
			return response.json();
		}

		throw new Error(
			"No Payload CMS connection available. Provide either 'worker' or 'apiUrl'.",
		);
	}

	return {
		async getForms(params?: CollectionQueryParams) {
			const query = new URLSearchParams();
			if (params?.limit) query.set("limit", params.limit.toString());
			if (params?.page) query.set("page", params.page.toString());
			if (params?.sort) query.set("sort", params.sort);
			if (params?.depth) query.set("depth", params.depth.toString());
			if (params?.where) query.set("where", JSON.stringify(params.where));

			const queryString = query.toString();
			const endpoint = queryString ? `api/forms?${queryString}` : "api/forms";

			return payloadFetch<PayloadPaginatedDocs<PayloadForm>>(endpoint);
		},

		async getForm(id: string | number) {
			return payloadFetch<PayloadForm>(`api/forms/${id}`);
		},

		async submitForm(data: FormSubmissionRequest) {
			return payloadFetch<FormSubmissionResponse>("api/form-submissions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
		},

		async uploadFormFile(file: File, data: FileUploadData) {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("_payload", JSON.stringify(data));

			// Use different fetch logic for file uploads (FormData)
			if (options.worker) {
				const response = await options.worker.fetch(
					"https://cms/api/file-uploads",
					{
						method: "POST",
						body: formData,
					},
				);
				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`File upload error: ${response.statusText} - ${errorText}`,
					);
				}
				return response.json();
			}

			if (options.apiUrl) {
				const response = await fetch(`${options.apiUrl}/api/file-uploads`, {
					method: "POST",
					body: formData,
				});
				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`File upload error: ${response.statusText} - ${errorText}`,
					);
				}
				return response.json();
			}

			throw new Error("No Payload CMS connection available for file upload.");
		},
	};
}
