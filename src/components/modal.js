export class Modal {
    constructor() {
        this.modal = document.getElementById('customModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalIcon = document.getElementById('modalIcon');
        this.closeButton = document.getElementById('modalClose');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.closeButton.addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', (e) => {
            if (e.target.id === 'customModal') this.hide();
        });
    }
    
    show(title, message, icon = 'ℹ️') {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modalIcon.textContent = icon;
        this.modal.classList.add('show');
    }
    
    hide() {
        this.modal.classList.remove('show');
    }
    
    static getIconForMessage(message) {
        if (message.includes('❗') || message.includes('Нужно войти')) {
            return '🔐';
        } else if (message.includes('✅')) {
            return '✅';
        } else if (message.includes('Ошибка') || message.includes('error')) {
            return '❌';
        } else if (message.includes('Please enter')) {
            return '⚠️';
        }
        return 'ℹ️';
    }
    
    static getTitleForMessage(message) {
        if (message.includes('❗') || message.includes('Нужно войти')) {
            return 'Authentication Required';
        } else if (message.includes('✅')) {
            return 'Success';
        } else if (message.includes('Ошибка') || message.includes('error')) {
            return 'Error';
        } else if (message.includes('Please enter')) {
            return 'Input Required';
        }
        return 'Information';
    }
}