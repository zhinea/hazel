/**
 * Auth Helper - Manages cookie authentication with the API
 *
 * This module helps verify and manage the OIDC authentication cookie
 * for communication with the browser-recorder-api.
 */

class AuthHelper {
    /**
     * Check if we have a valid auth cookie
     * @param {string} apiUrl - The API URL to check against
     * @returns {Promise<boolean>} - True if we have a valid auth cookie
     */
    async hasValidAuthCookie(apiUrl) {
        try {
            // Extract domain from API URL
            const url = new URL(apiUrl);
            const domain = url.hostname;

            // Get all cookies for the domain
            const cookies = await chrome.cookies.getAll({ domain });

            // Check if we have an oidc-auth cookie
            const authCookie = cookies.find(cookie => cookie.name === 'oidc-auth');

            if (!authCookie) {
                console.log('No oidc-auth cookie found');
                return false;
            }

            // Check if the cookie is valid (not expired)
            if (authCookie.expirationDate && authCookie.expirationDate < Date.now() / 1000) {
                console.log('oidc-auth cookie is expired');
                return false;
            }

            // Check if the cookie has a value (JWT token)
            if (!authCookie.value) {
                console.log('oidc-auth cookie has no value');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking auth cookie:', error);
            return false;
        }
    }

    /**
     * Parse a JWT token to extract user info
     * @param {string} token - The JWT token
     * @returns {Object|null} - The decoded token payload or null if invalid
     */
    parseJwt(token) {
        try {
            // JWT tokens are base64 encoded with three parts: header.payload.signature
            const base64Url = token.split('.')[1];
            if (!base64Url) return null;

            // Replace specific characters for base64 URL decoding
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

            // Decode and parse the payload
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT token:', error);
            return null;
        }
    }

    /**
     * Get user information from the JWT auth cookie
     * @param {string} apiUrl - The API URL to check against
     * @returns {Promise<Object|null>} - User information or null if not authenticated
     */
    async getUserFromCookie(apiUrl) {
        try {
            // Extract domain from API URL
            const url = new URL(apiUrl);
            const domain = url.hostname;

            // Get all cookies for the domain
            const cookies = await chrome.cookies.getAll({ domain });

            // Check if we have an oidc-auth cookie
            const authCookie = cookies.find(cookie => cookie.name === 'oidc-auth');

            if (!authCookie || !authCookie.value) {
                return null;
            }

            // Parse the JWT token
            const userData = this.parseJwt(authCookie.value);

            return userData;
        } catch (error) {
            console.error('Error getting user from cookie:', error);
            return null;
        }
    }
}

// Create and export a singleton instance
const authHelper = new AuthHelper();
export default authHelper;