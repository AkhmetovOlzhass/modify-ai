const CLIENT_ID = '4e92d00ae36a4fdeb2d3b76a1ee70a50';
const REDIRECT_URI = typeof chrome !== 'undefined' ? chrome.identity.getRedirectURL('spotify') : 'http://localhost';
const SCOPES = 'playlist-modify-public playlist-modify-private user-read-private';

export async function getUserProfile(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }
    
    return await response.json();
}

export async function createPlaylist(userId, mood, accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/me/playlists`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            name: `Moodify — "${mood}"`,
            description: 'AI-curated playlist by Moodify. Listen, save what you like, then delete when done!',
            public: false
        })
    });

    if (!response.ok) {
        throw new Error('Failed to create playlist');
    }

    return await response.json();
}

export async function addTracksToPlaylist(playlistId, trackUris, accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            uris: trackUris
        })
    });

    if (!response.ok) {
        throw new Error('Failed to add tracks to playlist');
    }

    return await response.json();
}

export async function unfollowPlaylist(playlistId, accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to unfollow playlist');
    }

    return true;
}

export async function searchTrack(title, artist, accessToken) {
    const query = `${title} ${artist}`;
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    return data.tracks?.items?.[0] || null;
}

export { CLIENT_ID, REDIRECT_URI, SCOPES };