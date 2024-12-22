import { createFileRoute, useParams } from "@tanstack/react-router";
import { MediaHeader } from "../../components/media/header";
import { trpc } from "../../utils/trpc";
import { formatTime } from "../../lib/format-time";
import { useQueueStore } from "../../store/queue";
import { Button } from "../../components/ui/button";
import { Play } from "lucide-react";

export const Route = createFileRoute("/albums/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/albums/$id" });
  const { data } = trpc.getAlbumTracks.useQuery(id);
  const { add, play } = useQueueStore();

  return (
    <div className="flex flex-col space-y-4 pb-20">
      <MediaHeader id={id} />
      <div className="px-4 flex space-x-4">
        <Button
          onClick={() => {
            if (data) {
              add(data);
              play();
            }
          }}
          className="flex space-x-2 items-center justify-center"
        >
          <Play strokeWidth={2.5} size={16} fill="#f4f4f5" />
          <span>Play</span>
        </Button>
        {/* <Button> Add</Button> */}
      </div>
      <div className="flex flex-col divide-y divide-zinc-800">
        {data &&
          data.length > 0 &&
          data.map((track) => (
            <button
              key={track.id}
              onClick={() => {
                console.log(track);
                add([track]);
                play();
              }}
              className="px-4 py-2 flex justify-between items-center"
            >
              <div className="flex flex-col items-start">
                <span className="line-clamp-1 text-left">{track.name}</span>
                <span className="text-sm text-zinc-500">
                  {track.artist.name} - {formatTime(track.trackTimeMillis)}
                </span>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
