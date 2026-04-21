import { Icon } from "@iconify/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type StreamInfo, switchStream } from "./MusicPlayer";

const listenButtonVariants = cva(
	"flex-col whitespace-normal text-center font-semibold [&_svg]:size-10",
	{
		variants: {
			size: {
				default: "size-32",
				sm: "size-24 text-sm [&_svg]:size-8",
				lg: "size-40 text-lg [&_svg]:size-12",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

interface ListenButtonProps extends VariantProps<typeof listenButtonVariants> {
	stream: StreamInfo;
	className?: string;
	buttonVariant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "success"
		| "ghost"
		| "link";
	buttonSize?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
}

export function ListenButton({
	stream,
	className,
	size,
	buttonVariant,
	buttonSize,
}: ListenButtonProps) {
	const handleClick = () => {
		switchStream(stream);
	};

	return (
		<Button
			onClick={handleClick}
			className={cn(listenButtonVariants({ size, className }))}
			size={buttonSize}
			variant={buttonVariant}
		>
			<Icon icon="mdi:play-circle" className="size-6" />
			{stream.title}
		</Button>
	);
}

export default ListenButton;
