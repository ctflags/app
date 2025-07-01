/**
 * Admin Utilities - Common functions for admin pages
 */
class AdminUtils {
    constructor(organizerToken = null) {
        this.organizerToken = organizerToken || this.getTokenFromStorage();
    }

    /**
     * Get organizer token from localStorage
     */
    getTokenFromStorage() {
        return localStorage.getItem('organizerToken');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getTokenFromStorage();
    }

    /**
     * Make API request with token
     */
    async makeRequest(url, options = {}) {
        const token = this.getTokenFromStorage();
        
        if (!token) {
            // Redirect to login if no token
            window.location.href = '/organizer';
            return;
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        };
        
        return fetch(url, { ...defaultOptions, ...options });
    }

    /**
     * Delete item with confirmation
     */
    async deleteItem(endpoint, id, name, itemType = 'item') {
        window.popupManager.showConfirmation(
            `⚠️ Delete ${itemType}`,
            `This will permanently delete "<strong>${name}</strong>" and all related data.<br><br>Are you sure you want to continue?`,
            async () => {
                try {
                    const response = await this.makeRequest(`${endpoint}/${id}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        // Navigate to the current page with token to refresh data
                        const token = this.getTokenFromStorage();
                        if (token) {
                            window.location.href = `${window.location.pathname}?token=${token}`;
                        } else {
                            window.location.href = '/organizer';
                        }
                    } else {
                        const error = await response.json();
                        showResult('error', '❌ Deletion Failed', error.message);
                    }
                } catch (error) {
                    showResult('error', '❌ Network Error', 'Failed to connect to server. Please try again.');
                }
            }
        );
    }

    /**
     * Delete all items with text confirmation
     */
    async deleteAllItems(endpoint, confirmText = 'DELETE ALL', itemType = 'items') {
        window.popupManager.showTextConfirmation(
            `⚠️ WARNING: Delete All ${itemType}`,
            `This will permanently delete ALL ${itemType} and their associated data.<br><br>Type <strong>"${confirmText}"</strong> to confirm:`,
            confirmText,
            async () => {
                try {
                    const response = await this.makeRequest(`${endpoint}/delete-all`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        showResult('success', '✅ Successfully Deleted', 
                            `All ${itemType} and associated data have been deleted successfully.`, true);
                    } else {
                        const error = await response.json();
                        showResult('error', '❌ Deletion Failed', error.message);
                    }
                } catch (error) {
                    showResult('error', '❌ Network Error', 'Failed to connect to server. Please try again.');
                }
            }
        );
    }

    /**
     * Submit form data
     */
    async submitForm(endpoint, formData, isEditing = false, itemType = 'item') {
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const response = await this.makeRequest(endpoint, {
                method: method,
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                // Navigate to the current page with token to refresh data
                const token = this.getTokenFromStorage();
                if (token) {
                    window.location.href = `${window.location.pathname}?token=${token}`;
                } else {
                    window.location.href = '/organizer';
                }
            } else {
                const error = await response.json();
                const errorMessage = error.message || error.error || 'Unknown error occurred';
                showResult('error', '❌ Error', 'Error: ' + errorMessage);
            }
        } catch (error) {
            const errorMessage = error.message || 'Network error occurred';
            showResult('error', '❌ Network Error', 'Error: ' + errorMessage);
        }
    }

    /**
     * Show/hide form
     */
    toggleForm(formId, titleId, submitBtnId, isEditing, createTitle, editTitle, createBtnText, editBtnText) {
        const form = document.getElementById(formId);
        const title = document.getElementById(titleId);
        const submitBtn = document.getElementById(submitBtnId);
        
        if (!form || !title || !submitBtn) {
            console.error('Form elements not found');
            return;
        }
        
        form.classList.remove('hidden');
        title.textContent = isEditing ? editTitle : createTitle;
        submitBtn.textContent = isEditing ? editBtnText : createBtnText;
    }

    /**
     * Hide form
     */
    hideForm(formId, formElementId) {
        const form = document.getElementById(formId);
        const formElement = document.getElementById(formElementId);
        
        if (form) form.classList.add('hidden');
        if (formElement) formElement.reset();
    }

    /**
     * Filter table rows
     */
    filterTable(tableSelector, filters) {
        const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
        
        rows.forEach(row => {
            let showRow = true;
            
            for (const [filterKey, filterValue] of Object.entries(filters)) {
                if (filterValue && filterValue !== 'all') {
                    const cellValue = row.dataset[filterKey];
                    if (cellValue !== filterValue) {
                        showRow = false;
                        break;
                    }
                }
            }
            
            row.style.display = showRow ? '' : 'none';
        });
    }

    /**
     * Clear all filters
     */
    clearFilters(filterIds) {
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
    }

    /**
     * Logout user by clearing localStorage
     */
    logout() {
        localStorage.removeItem('organizerToken');
        localStorage.removeItem('organizerData');
        window.location.href = '/organizer';
    }
}

// Export for use in other scripts
window.AdminUtils = AdminUtils;