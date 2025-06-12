/**
 * Time Utilities - Handles time formatting and relative time display
 */
class TimeUtils {
    /**
     * Get relative time string from timestamp
     */
    static getRelativeTime(timestamp) {
        const now = new Date();
        // PostgreSQL CURRENT_TIMESTAMP returns UTC, so treat the timestamp as UTC
        const past = new Date(timestamp + 'Z');
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) {
            return diffInSeconds + ' secs';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return minutes + ' mins';
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return hours + ' hrs';
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return days + ' days';
        } else {
            const months = Math.floor(diffInSeconds / 2592000);
            return months + ' months';
        }
    }
    
    /**
     * Update all relative time elements on the page
     */
    static updateRelativeTimes() {
        document.querySelectorAll('.relative-time').forEach(function(element) {
            const timestamp = element.getAttribute('data-timestamp');
            if (timestamp) {
                element.textContent = TimeUtils.getRelativeTime(timestamp);
            }
        });
    }
    
    /**
     * Initialize relative time updates
     */
    static initializeRelativeTimeUpdates() {
        // Update times on page load
        TimeUtils.updateRelativeTimes();
        
        // Update times every 30 seconds
        setInterval(TimeUtils.updateRelativeTimes, 30000);
    }
}

// Global helper functions for backward compatibility
function getRelativeTime(timestamp) {
    return TimeUtils.getRelativeTime(timestamp);
}

function updateRelativeTimes() {
    TimeUtils.updateRelativeTimes();
}

// Auto-initialize when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TimeUtils.initializeRelativeTimeUpdates();
    });
} else {
    TimeUtils.initializeRelativeTimeUpdates();
}