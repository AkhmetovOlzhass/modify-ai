export function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const loading = button.querySelector('.loading');

    if (!btnText || !loading) return;

    if (isLoading) {
        btnText.classList.add('hidden');
        loading.classList.remove('hidden');
        button.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        loading.classList.add('hidden');
        button.disabled = false;
    }
}

export function renderTrack(track, container) {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-item';

    const info = document.createElement('div');
    info.className = 'track-info';
    info.innerHTML = `
        <div class="track-title">${track.name}</div>
        <div class="track-artist">${track.artists.map(a => a.name).join(', ')}</div>
    `;

    const status = document.createElement('div');
    status.className = 'track-status';
    status.textContent = '✅ Added';

    trackElement.appendChild(info);
    trackElement.appendChild(status);
    container.appendChild(trackElement);
    
    return trackElement;
}