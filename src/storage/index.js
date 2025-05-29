export const STORAGE_KEYS = {
    GENERATED_TRACKS: 'moodify_generated_tracks',
    CURRENT_MOOD: 'moodify_current_mood',
    CURRENT_PLAYLIST: 'moodify_current_playlist',
    LAST_SESSION: 'moodify_last_session',
    MOOD_HISTORY: 'moodify_mood_history'
};

export async function saveSessionData(mood, playlistId, hasResults = false) {
    const sessionData = {
        mood,
        hasResults,
        playlistId,
        timestamp: Date.now()
    };
    
    await chrome.storage.local.set({
        [STORAGE_KEYS.LAST_SESSION]: sessionData,
        [STORAGE_KEYS.CURRENT_PLAYLIST]: playlistId
    });
    
    if (mood) {
        await saveMoodToHistory(mood);
    }
}

export async function saveGeneratedTracks(tracks) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.GENERATED_TRACKS]: tracks
    });
}

export async function getSessionData() {
    const result = await chrome.storage.local.get([
        STORAGE_KEYS.GENERATED_TRACKS,
        STORAGE_KEYS.LAST_SESSION,
        STORAGE_KEYS.CURRENT_PLAYLIST
    ]);
    
    return {
        tracks: result[STORAGE_KEYS.GENERATED_TRACKS] || [],
        session: result[STORAGE_KEYS.LAST_SESSION] || null,
        playlistId: result[STORAGE_KEYS.CURRENT_PLAYLIST] || null
    };
}

export async function clearPlaylistData() {
    await chrome.storage.local.remove([
        STORAGE_KEYS.CURRENT_PLAYLIST,
        STORAGE_KEYS.GENERATED_TRACKS,
        STORAGE_KEYS.LAST_SESSION
    ]);
}

export async function saveMoodToHistory(mood) {
    const { moodHistory = [] } = await chrome.storage.local.get([STORAGE_KEYS.MOOD_HISTORY]);
    
    if (!moodHistory.includes(mood)) {
        const updatedHistory = [mood, ...moodHistory].slice(0, 10);
        await chrome.storage.local.set({
            [STORAGE_KEYS.MOOD_HISTORY]: updatedHistory
        });
    }
}

export async function getMoodHistory() {
    const { moodHistory = [] } = await chrome.storage.local.get([STORAGE_KEYS.MOOD_HISTORY]);
    return moodHistory;
}