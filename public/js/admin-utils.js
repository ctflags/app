/**
 * Admin Utilities - Common functions for admin pages
 */
class AdminUtils {
    constructor(organizerToken) {
        this.organizerToken = organizerToken;
    }

    /**
     * Make API request with token
     */
    async makeRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        // Add token to URL if not already present
        const separator = url.includes('?') ? '&' : '?';
        const urlWithToken = url.includes('token=') ? url : `${url}${separator}token=${this.organizerToken}`;
        
        return fetch(urlWithToken, { ...defaultOptions, ...options });
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
                        // Just reload the page silently - no need for success popup
                        location.reload();
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
                // Just reload the page silently - no need for success popup
                location.reload();
            } else {
                const error = await response.json();
                showResult('error', '❌ Error', 'Error: ' + error.message);
            }
        } catch (error) {
            showResult('error', '❌ Network Error', 'Error: ' + error.message);
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
}

// Export for use in other scripts
window.AdminUtils = AdminUtils;