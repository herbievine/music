export default function trackTime(time: number) {
  const date = new Date(time);
  return `${date.getMinutes()}:${date.getSeconds()}`;
}
