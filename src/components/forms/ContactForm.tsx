/**
 * Contact Form Component
 *
 * Progressive enhancement contact form using Astro Actions
 * Works with and without JavaScript
 */

import { actions } from "astro:actions";
import { Icon } from "@iconify/react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type Lenis from "lenis";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

declare global {
	interface Window {
		lenis?: Lenis;
	}
}

interface ContactFormProps {
	formId?: number;
	onSuccess?: () => void;
	turnstileSiteKey?: string;
}

interface FormState {
	submitting: boolean;
	success: boolean;
	error: string | null;
}

export function ContactForm({
	formId = 1,
	onSuccess,
	turnstileSiteKey,
}: ContactFormProps) {
	const [formState, setFormState] = useState<FormState>({
		submitting: false,
		success: false,
		error: null,
	});
	const [selectedType, setSelectedType] = useState<string>("");
	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const turnstileRef = useRef<TurnstileInstance>(null);

	const scrollToTop = useEffectEvent(() => {
		const lenis = window.lenis;
		if (lenis) {
			lenis.scrollTo(0, { immediate: false });
		} else {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	});

	useEffect(() => {
		if (formState.success) {
			scrollToTop();
		}
	}, [formState.success]);

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		setFormState({ submitting: true, success: false, error: null });

		const form = e.currentTarget;
		const formData = new FormData(form);

		try {
			const result = await actions.submitContactForm(formData);

			if (result.data?.success) {
				setFormState({ submitting: false, success: true, error: null });

				// Reset form
				form.reset();
				setSelectedType(""); // Also reset the selected type state
				turnstileRef.current?.reset();
				setTurnstileToken("");

				// Call success callback if provided
				onSuccess?.();
			} else {
				throw new Error("Submission failed");
			}
		} catch (error) {
			console.error("Form submission error:", error);
			setFormState({
				submitting: false,
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to submit form. Please try again.",
			});
			// Reset turnstile on error
			turnstileRef.current?.reset();
			setTurnstileToken("");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<input type="hidden" name="formId" value={formId} />

			{/* Success Message */}
			{formState.success ? (
				<div className="p-4 bg-success/50 border border-success rounded-lg text-success-foreground">
					<p className="font-medium">Thank you for contacting us!</p>
					<p className="text-sm mt-1">
						We'll get back to you as soon as possible.
					</p>
				</div>
			) : (
				<>
					{/* Error Message */}
					{formState.error && (
						<div className="p-4 bg-error/10 border border-error rounded-lg text-error-foreground">
							<p className="font-medium">Error</p>
						</div>
					)}

					{/* Type Select Field */}
					<div className="space-y-2">
						<Label htmlFor="type">
							Select a Type <span className="text-error">*</span>
						</Label>
						<Select
							value={selectedType}
							onValueChange={setSelectedType}
							required
							disabled={formState.submitting}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Choose a type..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="church">Church</SelectItem>
								<SelectItem value="school">School</SelectItem>
								<SelectItem value="sponsor">Sponsor</SelectItem>
								<SelectItem value="other">Other</SelectItem>
							</SelectContent>
						</Select>
						<input type="hidden" name="type" value={selectedType} />
					</div>

					{/* Name Field */}
					<div className="space-y-2">
						<Label htmlFor="name">
							Name <span className="text-error">*</span>
						</Label>
						<Input
							type="text"
							id="name"
							name="name"
							required
							disabled={formState.submitting}
							placeholder="Your full name"
							className="w-full"
						/>
					</div>

					{/* Email Field */}
					<div className="space-y-2">
						<Label htmlFor="email">
							Email <span className="text-error">*</span>
						</Label>
						<Input
							type="email"
							id="email"
							name="email"
							required
							disabled={formState.submitting}
							placeholder="your.email@example.com"
							className="w-full"
						/>
					</div>

					{/* Phone Field */}
					<div className="space-y-2">
						<Label htmlFor="phone">Phone</Label>
						<Input
							type="tel"
							id="phone"
							name="phone"
							disabled={formState.submitting}
							placeholder="(555) 123-4567"
							className="w-full"
						/>
					</div>

					{/* Message Field */}
					<div className="space-y-2">
						<Label htmlFor="message">Message</Label>
						<Textarea
							id="message"
							name="message"
							disabled={formState.submitting}
							rows={6}
							placeholder="Tell us how we can help..."
							className="w-full"
						/>
					</div>

					{/* Turnstile CAPTCHA */}
					<div className="space-y-2">
						<Turnstile
							ref={turnstileRef}
							siteKey={
								turnstileSiteKey || import.meta.env.PUBLIC_TURNSTILE_SITE_KEY
							}
							onSuccess={(token: string) => setTurnstileToken(token)}
							onError={() => {
								setTurnstileToken("");
								setFormState((prev) => ({
									...prev,
									error: "CAPTCHA verification failed. Please try again.",
								}));
							}}
							onExpire={() => setTurnstileToken("")}
							options={{
								theme: "auto",
								size: "flexible",
							}}
						/>
						<input
							type="hidden"
							name="cf-turnstile-response"
							value={turnstileToken}
						/>
					</div>

					{/* Submit Button */}
					<div>
						<Button
							type="submit"
							disabled={formState.submitting || !turnstileToken}
							className="w-full"
						>
							{formState.submitting ? (
								<>
									<Icon icon="lucide:loader-circle" className="animate-spin" />
									Submitting...
								</>
							) : (
								"Send Message"
							)}
						</Button>
					</div>

					{/* Progressive Enhancement Notice */}
					<noscript>
						<div className="p-4 bg-warning/10 border border-warning rounded-lg text-warning-foreground">
							<p className="text-sm">
								JavaScript is disabled. The form will work, but you won't see
								real-time validation or loading states.
							</p>
						</div>
					</noscript>
				</>
			)}
		</form>
	);
}
