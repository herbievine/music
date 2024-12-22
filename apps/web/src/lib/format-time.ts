export function formatTime(ms: number) {
  if (isNaN(ms)) {
    return "00:00";
  }

  ms /= 1000;

  const minutes = Math.floor(ms / 60);
  const formatMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const seconds = Math.floor(ms % 60);
  const formatSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${formatMinutes}:${formatSeconds}`;
}
