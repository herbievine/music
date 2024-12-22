export async function getArrayBuffer(link: string, init?: RequestInit<RequestInitCfProperties>) {
  const response = await fetch(link, init);

  return response.arrayBuffer();
}
