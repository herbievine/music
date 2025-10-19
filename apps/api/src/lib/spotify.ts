import { SpotifyAPI } from "@statsfm/spotify.js";

export function spotifyClient(token: string) {
	return new SpotifyAPI({
		clientCredentials: {
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
		},
		accessToken: token,
	});
}
