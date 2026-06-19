export function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function extractSpotifyId(url: string): { type: 'track' | 'playlist', id: string } | null {
  const trackRegex = /spotify\.com\/track\/([a-zA-Z0-9]+)/;
  const playlistRegex = /spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
  
  const trackMatch = url.match(trackRegex);
  if (trackMatch) return { type: 'track', id: trackMatch[1] };
  
  const playlistMatch = url.match(playlistRegex);
  if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
  
  return null;
}
