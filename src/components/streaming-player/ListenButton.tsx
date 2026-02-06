import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { type StreamInfo, switchStream } from "./MusicPlayer";

interface ListenButtonProps {
	stream: StreamInfo;
	className?: string;
	size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "success"
		| "ghost"
		| "link";
}

export function ListenButton({
	stream,
	className,
	size,
	variant,
}: ListenButtonProps) {
	const handleClick = () => {
		switchStream(stream);
	};

	return (
		<Button
			onClick={handleClick}
			className={className}
			size={size}
			variant={variant}
		>
			<Icon icon="mdi:play-circle" className="size-6" />
			{stream.title}
		</Button>
	);
}

export default ListenButton;
