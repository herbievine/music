import dayjs from "dayjs";
import { trpc } from "../../utils/trpc";

type Props = {
	id: string;
	name?: string;
	imageUrl?: string;
};

export function MediaHeader({ id, name, imageUrl }: Props) {
	if (!name || !imageUrl) {
		return (
			<div className="flex flex-col items-center space-y-4">
				<div
					className="w-52 h-52 bg-zinc-800 rounded-2xl animate-pulse"
					style={{
						viewTransitionName: `key-${id}`,
					}}
				/>
				<div className="flex flex-col items-center space-y-2">
					<div className="h-6 w-40 bg-zinc-800 rounded-2xl animate-pulse" />
					<div className="h-4 w-28 bg-zinc-800 rounded-2xl animate-pulse" />
					<div className="h-4 w-32 bg-zinc-800 rounded-2xl animate-pulse" />
				</div>
			</div>
		);
	}

	if (name && imageUrl) {
		return (
			<div className="flex flex-col items-center space-y-4">
				<img
					src={imageUrl}
					alt={`${name} cover`}
					className="w-52 h-52 rounded-2xl"
					style={{
						viewTransitionName: `key-${id}`,
					}}
				/>
				<div className="flex flex-col items-center space-y-1">
					<h1 className="text-xl font-semibold text-center">{name}</h1>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center space-y-4">
			<img
				src={`https://albums.herbievine.com/${data.bucketCoverId}`}
				alt={`${data.name} cover`}
				className="w-52 h-52 rounded-2xl"
				style={{
					viewTransitionName: imageUrl ? `key-${id}` : `album-${id}`,
				}}
			/>
			<div className="flex flex-col items-center space-y-1">
				<h1 className="text-xl font-semibold text-center">{data.name}</h1>
				<span className="text-sm font-semibold text-center">
					{data.artist.name}
				</span>
				<span className="text-xs font-semibold uppercase text-zinc-500">
					{data.primaryGenreName} - {dayjs(data.releaseDate).format("YYYY")}
				</span>
			</div>
		</div>
	);
}
