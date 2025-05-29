export class PlaylistManager {
    constructor(container, openButton, deleteButton) {
        this.container = container;
        this.openButton = openButton;
        this.deleteButton = deleteButton;
        this.descriptionElement = container.querySelector('#playlistDescription');
        this.playlistId = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.openButton) {
            this.openButton.addEventListener('click', () => this.openInSpotify());
        }
    }
    
    setPlaylistId(id) {
        this.playlistId = id;
    }
    
    show(mood) {
        if (this.descriptionElement) {
            this.descriptionElement.textContent = `"${mood}" mood playlist created!`;
        }
        this.container.classList.remove('hidden');
    }
    
    hide() {
        this.container.classList.add('hidden');
    }
    
    openInSpotify() {
        if (this.playlistId) {
            chrome.tabs.create({ url: `https://open.spotify.com/playlist/${this.playlistId}` });
        }
    }
}