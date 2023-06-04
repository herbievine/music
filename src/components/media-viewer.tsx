"use client";

import { Media } from "@/types/media";
import Link from "next/link";
import Image from "next/image";

type MediaViewerProps = {
  media: Media;
};

export default function MediaViewer({ media }: MediaViewerProps) {
  return (
    <Link
      key={media.id}
      className="py-2 cursor-pointer"
      href={`/${media.type}?id=${media.id}`}
    >
      <div className={"w-full flex items-center space-x-2"}>
        <Image
          src={media.coverLinkLow}
          alt={`${media.title} by ${media.artist}`}
          width={45}
          height={45}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <p className="font-semibold">{media.title}</p>
          <p className="text-sm font-semibold text-neutral-500 truncate">
            {media.type === "song" ? "Song" : "Album"}
            {" • "}
            {media.artist}
          </p>
        </div>
      </div>
    </Link>
  );
}
