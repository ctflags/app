/**
 * Popup Manager - Handles all popup operations
 */
class PopupManager {
    constructor() {
        this.setupEventHandlers();
    }

    /**
     * Show a result popup (success/error)
     */
    showResult(type, title, message, autoReload = false) {
        const resultBox = document.getElementById('resultBox');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
        if (!resultBox || !resultTitle || !resultMessage) {
            console.error('Result popup elements not found');
            return;
        }
        
        resultTitle.textContent = title;
        resultMessage.innerHTML = message;
        
        // Set styling based on type
        if (type === 'success') {
            resultBox.classList.add('success');
        } else {
            resultBox.classList.remove('success');
        }
        
        // Store reload preference
        document.getElementById('resultPopup').setAttribute('data-reload', autoReload);
        
        // Show popup
        document.getElementById('resultPopup').style.display = 'flex';
        
        // Auto-reload if specified
        if (autoReload) {
            setTimeout(() => location.reload(), 2000);
        }
    }

    /**
     * Hide result popup
     */
    hideResultPopup() {
        const resultPopup = document.getElementById('resultPopup');
        if (resultPopup) {
            const shouldReload = resultPopup.getAttribute('data-reload') === 'true';
            resultPopup.style.display = 'none';
            
            if (shouldReload) {
                location.reload();
            }
        }
    }

    /**
     * Show simple confirmation popup
     */
    showConfirmation(title, message, confirmCallback, cancelCallback = null) {
        const popup = document.getElementById('deleteConfirmPopup') || document.getElementById('confirmPopup');
        if (!popup) {
            console.error('Confirmation popup not found');
            return;
        }

        const titleElement = popup.querySelector('.popup-title');
        const messageElement = popup.querySelector('.popup-message');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.innerHTML = message;
        
        // Store callbacks
        window.pendingConfirmAction = confirmCallback;
        window.pendingCancelAction = cancelCallback;
        
        popup.style.display = 'flex';
    }

    /**
     * Hide confirmation popup
     */
    hideConfirmation() {
        const popup = document.getElementById('deleteConfirmPopup') || document.getElementById('confirmPopup');
        if (popup) {
            popup.style.display = 'none';
            window.pendingConfirmAction = null;
            window.pendingCancelAction = null;
        }
    }

    /**
     * Show text confirmation popup (for dangerous operations)
     */
    showTextConfirmation(title, message, expectedText, confirmCallback) {
        const popup = document.getElementById('deleteAllPopup') || document.getElementById('textConfirmPopup');
        if (!popup) {
            console.error('Text confirmation popup not found');
            return;
        }

        const titleElement = popup.querySelector('.popup-title');
        const messageElement = popup.querySelector('.popup-message');
        const inputElement = popup.querySelector('.popup-input');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.innerHTML = message;
        if (inputElement) {
            inputElement.value = '';
            inputElement.placeholder = `Type "${expectedText}" to confirm`;
            inputElement.focus();
        }
        
        // Store callback and expected text
        window.pendingTextConfirmAction = confirmCallback;
        window.expectedConfirmText = expectedText;
        
        popup.style.display = 'flex';
    }

    /**
     * Hide text confirmation popup
     */
    hideTextConfirmation() {
        const popup = document.getElementById('deleteAllPopup') || document.getElementById('textConfirmPopup');
        if (popup) {
            popup.style.display = 'none';
            window.pendingTextConfirmAction = null;
            window.expectedConfirmText = null;
        }
    }

    /**
     * Validate and execute text confirmation
     */
    executeTextConfirmation() {
        const popup = document.getElementById('deleteAllPopup') || document.getElementById('textConfirmPopup');
        const inputElement = popup?.querySelector('.popup-input');
        
        if (!inputElement || !window.expectedConfirmText || !window.pendingTextConfirmAction) {
            return;
        }

        const inputValue = inputElement.value;
        const expectedText = window.expectedConfirmText;
        
        if (inputValue !== expectedText) {
            this.showResult('error', '❌ Invalid Confirmation', `Please type "${expectedText}" exactly as shown.`);
            return;
        }
        
        this.hideTextConfirmation();
        window.pendingTextConfirmAction();
    }

    /**
     * Execute simple confirmation
     */
    executeConfirmation() {
        if (window.pendingConfirmAction) {
            this.hideConfirmation();
            window.pendingConfirmAction();
        }
    }

    /**
     * Cancel confirmation
     */
    cancelConfirmation() {
        if (window.pendingCancelAction) {
            window.pendingCancelAction();
        }
        this.hideConfirmation();
    }

    /**
     * Setup global event handlers
     */
    setupEventHandlers() {
        // Close popups when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup-overlay')) {
                this.hideResultPopup();
                this.hideConfirmation();
                this.hideTextConfirmation();
            }
        });

        // Handle keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideResultPopup();
                this.hideConfirmation();
                this.hideTextConfirmation();
            }
            
            if (e.key === 'Enter') {
                // Handle Enter in text confirmation input
                const textConfirmInput = document.querySelector('#deleteAllPopup .popup-input, #textConfirmPopup .popup-input');
                if (textConfirmInput && textConfirmInput === document.activeElement) {
                    this.executeTextConfirmation();
                }
                
                // Handle Enter in result popup
                const resultPopup = document.getElementById('resultPopup');
                if (resultPopup && resultPopup.style.display === 'flex') {
                    this.hideResultPopup();
                }
            }
        });
    }
}

// Global popup manager instance
window.popupManager = new PopupManager();

// Global helper functions for backward compatibility
function showResult(type, title, message, autoReload = false) {
    window.popupManager.showResult(type, title, message, autoReload);
}

function hideResultPopup() {
    window.popupManager.hideResultPopup();
}