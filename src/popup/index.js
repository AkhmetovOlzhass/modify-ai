import { getUserProfile, createPlaylist, addTracksToPlaylist, unfollowPlaylist, searchTrack } from '../api/spotify.js';
import { generateSongsForMood } from '../api/gemini.js';
import { setLoading, renderTrack } from '../utils/ui.js';
import { saveSessionData, saveGeneratedTracks, getSessionData, clearPlaylistData, getMoodHistory } from '../storage/index.js';
import { Modal } from '../components/modal.js';
import { PlaylistManager } from '../components/playlist.js';

let currentUserId = null;
let currentPlaylistId = null;
let modal;
let playlistManager;

async function getValidAccessToken() {
    const { accessToken, expiresAt } = await chrome.storage.local.get([
        'accessToken',
        'expiresAt'
    ]);

    if (accessToken && Date.now() < expiresAt - 60000) {
        return accessToken;
    }

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'refresh_token' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            if (response && response.success) {
                resolve(response.accessToken);
            } else {
                reject(new Error(response?.message || 'Failed to refresh token'));
            }
        });
    });
}

async function updateUserProfile(accessToken) {
    const userProfile = await getUserProfile(accessToken);
    const profileElement = document.getElementById('userProfile');
    
    if (userProfile) {
        const nameElement = profileElement.querySelector('.user-name');
        nameElement.textContent = userProfile.display_name || 'Spotify User';
        profileElement.classList.remove('hidden');
        currentUserId = userProfile.id;
    }
}

async function handleLogin() {
    setLoading(document.getElementById('loginBtn'), true);
    
    chrome.runtime.sendMessage({ type: 'auth' }, async (response) => {
        setLoading(document.getElementById('loginBtn'), false);
        
        if (chrome.runtime.lastError) {
            modal.show('Error', 'Authentication failed. Please try again.', '❌');
            return;
        }

        if (response && response.error) {
            modal.show('Error', `Authentication failed: ${response.message}`, '❌');
            return;
        }

        if (response && response.success && response.accessToken) {
            document.getElementById('loginCard').classList.add('hidden');
            document.getElementById('moodSection').classList.remove('hidden');
            await updateUserProfile(response.accessToken);
            modal.show('Success', 'Successfully connected to Spotify!', '✅');
        } else {
            modal.show('Error', 'Authentication failed. Please try again.', '❌');
        }
    });
}

async function handleGeminiKeySave() {
    const geminiInput = document.getElementById('geminiKey');
    const key = geminiInput.value.trim();
    
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        geminiInput.value = key;
        document.getElementById('geminiForm').classList.add('hidden');
        document.getElementById('geminiSaved').classList.remove('hidden');
        modal.show('Success', 'Gemini API key saved successfully!', '✅');
    } else {
        modal.show('Input Required', 'Please enter a valid Gemini API Key.', '⚠️');
    }
}

async function handlePlaylistGeneration() {
  const moodInput = document.getElementById('moodInput');
  const mood = moodInput.value.trim();
  const geminiKey = localStorage.getItem('gemini_api_key');
  let spotifyToken;

  try {
    spotifyToken = await getValidAccessToken();
  } catch {
    modal.show('Authentication Required', 'Please connect to Spotify to continue.', '🔐');
    return;
  }

  if (!mood) {
    modal.show('Input Required', 'Please enter your mood to generate a playlist.', '⚠️');
    return;
  }

  if (!geminiKey) {
    modal.show('API Key Required', 'Please enter and save your Gemini API Key.', '🤖');
    return;
  }

  setLoading(document.getElementById('generateBtn'), true);

  try {
    const playlist = await createPlaylist(currentUserId, mood, spotifyToken);
    currentPlaylistId = playlist.id;
    playlistManager.setPlaylistId(currentPlaylistId);

    const songs = await generateSongsForMood(mood, geminiKey);
    document.getElementById('results').innerHTML = '';

    const trackResults = await Promise.all(
      songs.map(song => searchTrack(song.title, song.artist, spotifyToken))
    );

    const validTracks = trackResults.filter(Boolean);
    const trackUris = validTracks.map(track => track.uri);

    console.log(trackUris.length);
    

    if (trackUris.length > 0) {
      await addTracksToPlaylist(currentPlaylistId, trackUris, spotifyToken);
    }

    validTracks.forEach(track => renderTrack(track, document.getElementById('results')));

    await saveGeneratedTracks(validTracks);
    await saveSessionData(mood, currentPlaylistId, true);

    playlistManager.show(mood);
    modal.show('Success', `Generated playlist "${mood}" with ${validTracks.length} songs!`, '🎵');

  } catch (error) {
    console.error('Playlist ERROR:', error);
    modal.show('Error', 'Error creating playlist. Please try again.', '❌');
  } finally {
    setLoading(document.getElementById('generateBtn'), false);
  }
}


async function handlePlaylistDeletion() {
    try {
        const accessToken = await getValidAccessToken();
        await unfollowPlaylist(currentPlaylistId, accessToken);
        
        document.getElementById('results').innerHTML = '';
        playlistManager.hide();
        currentPlaylistId = null;
        
        await clearPlaylistData();
        modal.show('Success', 'Playlist removed from your library!', '✅');
    } catch (error) {
        modal.show('Error', 'Failed to remove playlist. Please try again.', '❌');
    }
}

async function populateMoodSuggestions() {
    const moodHistory = await getMoodHistory();
    const suggestionsContainer = document.getElementById('moodSuggestions');
    
    if (moodHistory.length > 0) {
        suggestionsContainer.innerHTML = '';
        
        moodHistory.forEach(mood => {
            const pill = document.createElement('span');
            pill.className = 'mood-pill';
            pill.textContent = mood;
            pill.addEventListener('click', () => {
                document.getElementById('moodInput').value = mood;
            });
            suggestionsContainer.appendChild(pill);
        });
    }
}

async function initializeApp() {
    modal = new Modal();
    playlistManager = new PlaylistManager(
        document.getElementById('playlistActions'),
        document.getElementById('openPlaylistBtn'),
        document.getElementById('deletePlaylistBtn')
    );
    
    window.alert = function(message) {
        const title = Modal.getTitleForMessage(message);
        const icon = Modal.getIconForMessage(message);
        modal.show(title, message, icon);
    };
    
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('saveGeminiKey').addEventListener('click', handleGeminiKeySave);
    document.getElementById('editGeminiKey').addEventListener('click', () => {
        document.getElementById('geminiForm').classList.remove('hidden');
        document.getElementById('geminiSaved').classList.add('hidden');
        document.getElementById('geminiKey').focus();
    });
    document.getElementById('generateBtn').addEventListener('click', handlePlaylistGeneration);
    document.getElementById('deletePlaylistBtn').addEventListener('click', handlePlaylistDeletion);
    
    document.getElementById('moodInput').addEventListener('input', () => {
        saveSessionData(document.getElementById('moodInput').value, currentPlaylistId);
    });
    
    const { session, tracks, playlistId } = await getSessionData();
    currentPlaylistId = playlistId;
    
    if (currentPlaylistId) {
        playlistManager.setPlaylistId(currentPlaylistId);
    }
    
    if (session && session.mood) {
        document.getElementById('moodInput').value = session.mood;
    }
    
    if (tracks && tracks.length > 0 && session && session.timestamp) {
        const hourAgo = Date.now() - (60 * 60 * 1000);
        if (session.timestamp > hourAgo) {
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = '';
            tracks.forEach(track => {
                renderTrack(track, resultsContainer);
            });
            
            if (currentPlaylistId) {
                playlistManager.show(session.mood || 'Unknown');
            }
        }
    }
    
    try {
        const accessToken = await getValidAccessToken();
        document.getElementById('loginCard').classList.add('hidden');
        document.getElementById('moodSection').classList.remove('hidden');
        await updateUserProfile(accessToken);
    } catch {
        document.getElementById('loginCard').classList.remove('hidden');
        document.getElementById('userProfile').classList.add('hidden');
        document.getElementById('moodSection').classList.add('hidden');
    }
    
    const geminiKey = localStorage.getItem('gemini_api_key');
    if (geminiKey) {
        document.getElementById('geminiKey').value = geminiKey;
        document.getElementById('geminiForm').classList.add('hidden');
        document.getElementById('geminiSaved').classList.remove('hidden');
    }
    
    await populateMoodSuggestions();
    
    window.addEventListener('beforeunload', () => {
        saveSessionData(document.getElementById('moodInput').value, currentPlaylistId);
    });
    
    setInterval(() => {
        saveSessionData(document.getElementById('moodInput').value, currentPlaylistId);
    }, 30000);
}

document.addEventListener('DOMContentLoaded', initializeApp);