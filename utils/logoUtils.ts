// logoUtils.ts

/**
 * Utility function to decode a base64 logo and convert it to a data URL.
 * @param {string} base64String - The base64 encoded string of the logo.
 * @return {string} - The data URL of the logo.
 */
function base64ToDataURL(base64String) {
    return `data:image/png;base64,${base64String}`;
}

/**
 * Function to decode base64 and convert it to a data URL.
 * @param {string} base64Logo - Base64 string of the logo.
 * @return {string} - Data URL for the logo.
 */
function decodeBase64Logo(base64Logo) {
    return base64ToDataURL(base64Logo);
}

export { decodeBase64Logo };