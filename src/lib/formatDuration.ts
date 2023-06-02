export default function formatDuration(time: number) {
  const date = new Date(time);
  return `${date.getMinutes()}:${date.getSeconds()}`;
}
