// api-service.js - Handles communication with the backend API
import authHelper from './auth-helper.js';

class ApiService {
    constructor() {
        // Base API URL - can be configured in extension settings
        this.apiUrl = 'http://localhost:3000'; // Default to localhost for development
        this.initialize();
    }

    async initialize() {
        // Load API URL from settings if available
        try {
            const settings = await this.getSettings();
            if (settings.apiUrl) {
                this.apiUrl = settings.apiUrl;
            }
        } catch (error) {
            console.error('Failed to load API settings:', error);
        }
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get('apiSettings', (result) => {
                resolve(result.apiSettings || { apiUrl: this.apiUrl });
            });
        });
    }

    /**
     * Makes an authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<any>} - Response data
     */
    async request(endpoint, options = {}) {
        const settings = await this.getSettings();
        const url = `${settings.apiUrl}${endpoint}`;

        // Ensure we're sending credentials (cookies)
        const fetchOptions = {
            ...options,
            credentials: 'include', // Important: send cookies with request
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            }
        };

        try {
            // Before making the request, check if we have a valid auth cookie
            const hasValidCookie = await authHelper.hasValidAuthCookie(settings.apiUrl);

            if (!hasValidCookie && endpoint !== '/me') {
                throw new Error('Not authenticated. Please log in to the API service in your browser.');
            }

            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error (${response.status}): ${errorText}`);
            }

            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * Check authentication status
     * @returns {Promise<Object>} - User data if authenticated
     */
    async checkAuth() {
        try {
            // First try to get user info from cookie without making a request
            const settings = await this.getSettings();
            const hasValidCookie = await authHelper.hasValidAuthCookie(settings.apiUrl);

            if (!hasValidCookie) {
                console.log('No valid auth cookie found');
                return null;
            }

            // Now make the API request to verify with the server
            return await this.request('/me');
        } catch (error) {
            console.log('Not authenticated or API unreachable:', error.message);
            return null;
        }
    }

    /**
     * Uploads a recording to the API
     * @param {Object} recording - Recording data
     * @returns {Promise<Object>} - Saved recording from API
     */
    async saveRecording(recording) {
        // Format the recording data for the API
        const recordData = {
            name: recording.name,
            tabUrl: recording.tabUrl,
            events: recording.events
        };

        return this.request('/records', {
            method: 'POST',
            body: JSON.stringify(recordData)
        });
    }

    /**
     * Fetches all recordings from the API
     * @returns {Promise<Array>} - List of recordings
     */
    async getRecordings() {
        return this.request('/records');
    }

    /**
     * Fetches a single recording from the API
     * @param {string} id - Recording ID
     * @returns {Promise<Object>} - Recording data
     */
    async getRecording(id) {
        return this.request(`/records/${id}`);
    }

    /**
     * Deletes a recording from the API
     * @param {string} id - Recording ID
     * @returns {Promise<void>}
     */
    async deleteRecording(id) {
        return this.request(`/records/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Updates a recording in the API
     * @param {string} id - Recording ID
     * @param {Object} data - Updated recording data
     * @returns {Promise<Object>} - Updated recording
     */
    async updateRecording(id, data) {
        return this.request(`/records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;