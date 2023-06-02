export default function formatDuration(time: number) {
  if (isNaN(time)) {
    return "00:00";
  }

  time /= 1000;

  const minutes = Math.floor(time / 60);
  const formatMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const seconds = Math.floor(time % 60);
  const formatSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${formatMinutes}:${formatSeconds}`;
}
