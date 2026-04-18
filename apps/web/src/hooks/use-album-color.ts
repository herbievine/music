import { useEffect, useState } from "react";

type RGB = [number, number, number];

function getDominantColor(img: HTMLImageElement): RGB {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return [0, 0, 0];

	// Sample at a small size for performance
	const size = 64;
	canvas.width = size;
	canvas.height = size;
	ctx.drawImage(img, 0, 0, size, size);

	const data = ctx.getImageData(0, 0, size, size).data;

	let rSum = 0;
	let gSum = 0;
	let bSum = 0;
	let count = 0;

	for (let i = 0; i < data.length; i += 16) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		// Skip near-black/near-white pixels (album borders, backgrounds)
		const brightness = (r + g + b) / 3;
		if (brightness < 20 || brightness > 235) continue;

		// Skip very desaturated pixels
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		if (max - min < 15) continue;

		rSum += r;
		gSum += g;
		bSum += b;
		count++;
	}

	if (count === 0) return [80, 80, 80];

	return [
		Math.round(rSum / count),
		Math.round(gSum / count),
		Math.round(bSum / count),
	];
}

export function useAlbumColor(imageUrl: string | undefined) {
	const [color, setColor] = useState<RGB | null>(null);

	useEffect(() => {
		if (!imageUrl) {
			setColor(null);
			return;
		}

		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			setColor(getDominantColor(img));
		};
		img.onerror = () => {
			setColor(null);
		};
		img.src = imageUrl;
	}, [imageUrl]);

	return color;
}
