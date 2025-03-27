/**
 * Apollo.io and Bigin Integration
 * 
 * This script provides functions for integrating Apollo.io and Bigin APIs,
 * allowing data transfer between the two platforms.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fieldMapping = require('./field-mapping');

// API configuration
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const BIGIN_ACCESS_TOKEN = process.env.BIGIN_ACCESS_TOKEN;
const BIGIN_REFRESH_TOKEN = process.env.BIGIN_REFRESH_TOKEN;
const BIGIN_CLIENT_ID = process.env.BIGIN_CLIENT_ID;
const BIGIN_CLIENT_SECRET = process.env.BIGIN_CLIENT_SECRET;

// API URLs
const APOLLO_BASE_URL = 'https://api.apollo.io/v1';
const BIGIN_BASE_URL = process.env.BIGIN_BASE_URL || 'https://www.zohoapis.com/bigin/v1';
const BIGIN_AUTH_URL = 'https://accounts.zoho.com/oauth/v2/token';

// Token cache for Bigin
let biginAccessToken = process.env.BIGIN_ACCESS_TOKEN || null;
let biginTokenExpiry = null;
let lastTokenRefresh = 0;
let biginContacts = null;
let lastContactsFetch = 0;

// Rate limiting protection
const RATE_LIMIT_COOLDOWN = 60000; // 1 minute cooldown

/**
 * Delay function for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after the delay
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search for contacts in Apollo.io
 * @param {Object} searchParams - Search parameters for Apollo
 * @returns {Promise<Array>} - Array of contacts
 */
async function searchApolloContacts(searchParams = {}) {
    try {
        // Ensure we have an API key
        if (!APOLLO_API_KEY) {
            throw new Error('Apollo API key not found. Please add it to your .env file.');
        }

        // Build search parameters with defaults
        const params = {
            api_key: APOLLO_API_KEY,
            ...searchParams
        };

        console.log('Sending Apollo API request with params:', JSON.stringify(params, null, 2));

        // Call Apollo API for person search
        const response = await axios.post(`${APOLLO_BASE_URL}/mixed_people/search`, params);

        // Log response status and summary for debugging
        console.log(`Apollo API response status: ${response.status}`);
        if (response.data && response.data.people) {
            console.log(`Retrieved ${response.data.people.length} contacts from Apollo`);
        }

        // If people data is available, return it
        if (response.data && response.data.people) {
            return response.data.people;
        }

        return [];
    } catch (error) {
        console.error('Error searching Apollo contacts:', error.message);
        if (error.response && error.response.data) {
            console.error('Apollo API error details:', error.response.data);
        }
        throw error;
    }
}

/**
 * Enrich contact data with Apollo.io
 * @param {Object} contactInfo - Basic contact info
 * @returns {Promise<Object>} - Enriched contact data
 */
async function enrichContactWithApollo(contactInfo) {
    try {
        const response = await axios.post(`${APOLLO_BASE_URL}/people/match`, {
            api_key: APOLLO_API_KEY,
            first_name: contactInfo.first_name,
            last_name: contactInfo.last_name,
            email: contactInfo.email,
            organization_name: contactInfo.organization_name
        });

        return response.data.person;
    } catch (error) {
        console.error('Error enriching contact with Apollo:', error.response && error.response.data || error.message);
        throw error;
    }
}

/**
 * Refresh Bigin access token using refresh token
 * @returns {Promise<string>} - New access token
 */
async function refreshBiginToken() {
    try {
        const now = Date.now();

        // Check if we have a valid token
        if (biginAccessToken && biginTokenExpiry && biginTokenExpiry > now) {
            return biginAccessToken;
        }

        // Check if we're within the rate limit cooldown period
        if (now - lastTokenRefresh < RATE_LIMIT_COOLDOWN) {
            console.log('Rate limit protection: Waiting to refresh token...');
            throw new Error('Rate limit protection active. Please try again soon.');
        }

        // Update last refresh timestamp
        lastTokenRefresh = now;

        // Check if we have the required credentials
        if (!BIGIN_CLIENT_ID || !BIGIN_CLIENT_SECRET || !BIGIN_REFRESH_TOKEN) {
            throw new Error('Bigin credentials not found. Please check your .env file.');
        }

        // Build refresh token request
        const params = new URLSearchParams();
        params.append('refresh_token', BIGIN_REFRESH_TOKEN);
        params.append('client_id', BIGIN_CLIENT_ID);
        params.append('client_secret', BIGIN_CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');

        // Call Zoho/Bigin API to refresh token
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);

        if (response.data && response.data.access_token) {
            // Save the new token
            biginAccessToken = response.data.access_token;

            // Set expiry (default is 1 hour, subtract 5 minutes for safety)
            const expiresIn = response.data.expires_in || 3600;
            biginTokenExpiry = now + (expiresIn * 1000) - (5 * 60 * 1000);

            // Update the .env file with the new token
            updateEnvFile('BIGIN_ACCESS_TOKEN', biginAccessToken);

            return biginAccessToken;
        } else {
            throw new Error('Failed to refresh Bigin access token');
        }
    } catch (error) {
        // Format error for better debugging
        if (error.response && error.response.data) {
            const errorData = error.response.data;
            console.error('Error refreshing Bigin token:', errorData);

            // Check for rate limit errors
            if (errorData.error === 'Access Denied' &&
                errorData.error_description &&
                errorData.error_description.includes('too many requests')) {
                // Set a longer cooldown for rate limit errors
                lastTokenRefresh = Date.now();
            }

            throw new Error(errorData.error_description || errorData.error || error.message);
        } else {
            console.error('Error refreshing Bigin token:', error.message);
            throw error;
        }
    }
}

/**
 * Update .env file with new value
 * @param {string} key - Key to update
 * @param {string} value - New value
 */
function updateEnvFile(key, value) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');

        // Check if file exists
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');

            // Check if key exists
            const regex = new RegExp(`^${key}=.*`, 'm');

            if (regex.test(envContent)) {
                // Update existing key
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                // Add new key
                envContent += `\n${key}=${value}`;
            }

            // Write updated content
            fs.writeFileSync(envPath, envContent);
        }
    } catch (error) {
        console.error('Error updating .env file:', error.message);
    }
}

/**
 * Get Bigin headers with valid access token
 * @returns {Object} - Headers for Bigin API calls
 */
async function getBiginHeaders() {
    // If token is undefined or potentially expired, refresh it
    const accessToken = process.env.BIGIN_ACCESS_TOKEN;

    return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Get contacts from Bigin with caching to avoid rate limits
 * @param {boolean} forceRefresh - Force refresh the contacts cache
 * @returns {Promise<Array>} - Array of Bigin contacts
 */
async function getBiginContacts(forceRefresh = false) {
    try {
        const now = Date.now();
        const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes

        // Return cached contacts if available and not expired
        if (!forceRefresh && biginContacts && (now - lastContactsFetch < CACHE_LIFETIME)) {
            console.log('Using cached Bigin contacts to avoid rate limits');
            return biginContacts;
        }

        // Check if we're within the rate limit cooldown period
        if (now - lastContactsFetch < RATE_LIMIT_COOLDOWN) {
            console.log('Rate limit protection: Using cached contacts or empty array');
            return biginContacts || [];
        }

        // Update last fetch timestamp
        lastContactsFetch = now;

        // Ensure we have a valid token
        const token = await refreshBiginToken();

        // Set headers
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Call Bigin API
        const response = await axios.get(`${BIGIN_BASE_URL}/Contacts`, { headers });

        if (response.data && response.data.data) {
            // Cache the contacts
            biginContacts = response.data.data;
            return biginContacts;
        }

        return [];
    } catch (error) {
        // If we have cached contacts, return them on error
        if (biginContacts) {
            console.log('Error fetching Bigin contacts, using cached data');
            return biginContacts;
        }

        console.error('Error fetching Bigin contacts:', error.message);
        if (error.response && error.response.data) {
            console.error('Bigin API error details:', error.response.data);
        }
        throw error;
    }
}

/**
 * Create contact in Bigin
 * @param {Object} contactData - Contact data to create
 * @returns {Promise<Object>} - Created contact
 */
async function createBiginContact(contactData) {
    try {
        // Ensure we have a valid token
        const token = await refreshBiginToken();

        // Set headers
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Check if the contact has an Account_Name that needs to be created first
        let accountId = null;

        if (contactData.Account_Name && contactData.Account_Name.name) {
            // First check if the account already exists
            const accountName = contactData.Account_Name.name;
            const accountResponse = await axios.get(
                `${BIGIN_BASE_URL}/Accounts/search?criteria=Account_Name:equals:${encodeURIComponent(accountName)}`, { headers }
            );

            if (accountResponse.data && accountResponse.data.data && accountResponse.data.data.length > 0) {
                // Account exists, use its ID
                accountId = accountResponse.data.data[0].id;
            } else {
                // Account doesn't exist, create it
                const accountData = {
                    Account_Name: accountName
                };

                const createAccountResponse = await axios.post(
                    `${BIGIN_BASE_URL}/Accounts`, { data: [accountData] }, { headers }
                );

                if (createAccountResponse.data && createAccountResponse.data.data && createAccountResponse.data.data.length > 0) {
                    accountId = createAccountResponse.data.data[0].details.id;
                }
            }
        }

        // If we have an account ID, update the contact data
        if (accountId) {
            contactData.Account_Name = { id: accountId };
        }

        // Check if contact already exists (by email)
        if (contactData.Email) {
            const searchResponse = await axios.get(
                `${BIGIN_BASE_URL}/Contacts/search?criteria=Email:equals:${encodeURIComponent(contactData.Email)}`, { headers }
            );

            if (searchResponse.data && searchResponse.data.data && searchResponse.data.data.length > 0) {
                // Contact exists, update it
                const contactId = searchResponse.data.data[0].id;

                const updateResponse = await axios.put(
                    `${BIGIN_BASE_URL}/Contacts/${contactId}`, { data: [contactData] }, { headers }
                );

                if (updateResponse.data && updateResponse.data.data && updateResponse.data.data.length > 0) {
                    return {
                        ...updateResponse.data.data[0],
                        id: contactId,
                        isUpdate: true
                    };
                }
            }
        }

        // Create new contact
        const response = await axios.post(
            `${BIGIN_BASE_URL}/Contacts`, { data: [contactData] }, { headers }
        );

        if (response.data && response.data.data && response.data.data.length > 0) {
            // Update contacts cache with the new contact
            if (biginContacts) {
                biginContacts.push(response.data.data[0].details);
            }

            return response.data.data[0].details;
        } else {
            throw new Error('Failed to create contact in Bigin');
        }
    } catch (error) {
        console.error('Error creating Bigin contact:', error.message);
        if (error.response && error.response.data) {
            console.error('Bigin API error details:', error.response.data);
        }
        throw error;
    }
}

/**
 * Get accounts/companies from Bigin
 * @returns {Promise<Array>} - Array of Bigin accounts
 */
async function getBiginAccounts() {
    try {
        const headers = await getBiginHeaders();
        const response = await axios.get(`${BIGIN_BASE_URL}/Accounts`, { headers });

        return response.data.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Token expired, refresh and retry
            await refreshBiginToken();
            return getBiginAccounts();
        }

        console.error('Error getting Bigin accounts:', error.response && error.response.data || error.message);
        throw error;
    }
}

/**
 * Create account/company in Bigin
 * @param {Object} accountData - Account data to create
 * @returns {Promise<Object>} - Created account
 */
async function createBiginAccount(accountData) {
    try {
        const headers = await getBiginHeaders();

        // Transform Apollo data to Bigin format
        const biginAccount = {
            Account_Name: accountData.name,
            Website: accountData.website,
            Industry: accountData.industry,
            Phone: accountData.phone_number
        };

        const response = await axios.post(`${BIGIN_BASE_URL}/Accounts`, { data: [biginAccount] }, { headers });

        return response.data.data[0];
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Token expired, refresh and retry
            await refreshBiginToken();
            return createBiginAccount(accountData);
        }

        console.error('Error creating Bigin account:', error.response && error.response.data || error.message);
        throw error;
    }
}

/**
 * Sync Apollo contact to Bigin
 * @param {Object} apolloContact - Apollo contact data
 * @returns {Promise<Object>} - Synced Bigin contact
 */
async function syncApolloContactToBigin(apolloContact) {
    try {
        // Map Apollo contact to Bigin format
        const biginContact = fieldMapping.mapApolloContactToBigin(apolloContact);

        // Create or update contact in Bigin
        const result = await createBiginContact(biginContact);

        return result;
    } catch (error) {
        console.error('Error syncing contact:', error.message);
        if (error.response && error.response.data) {
            console.error('API error details:', error.response.data);
        }
        throw error;
    }
}

/**
 * Search for organizations in Apollo.io
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Array>} - Array of organizations
 */
async function searchApolloOrganizations(searchParams = {}) {
    try {
        // Ensure we have an API key
        if (!APOLLO_API_KEY) {
            throw new Error('Apollo API key not found. Please add it to your .env file.');
        }

        // Build search parameters with defaults
        const params = {
            api_key: APOLLO_API_KEY,
            ...searchParams
        };

        // Call Apollo API
        const response = await axios.post(`${APOLLO_BASE_URL}/organizations/search`, params);

        // If organizations data is available, return it
        if (response.data && response.data.organizations) {
            return response.data.organizations;
        }

        return [];
    } catch (error) {
        console.error('Error searching Apollo organizations:', error.message);
        if (error.response && error.response.data) {
            console.error('Apollo API error details:', error.response.data);
        }
        throw error;
    }
}

module.exports = {
    searchApolloContacts,
    enrichContactWithApollo,
    refreshBiginToken,
    getBiginContacts,
    createBiginContact,
    getBiginAccounts,
    createBiginAccount,
    syncApolloContactToBigin,
    searchApolloOrganizations
};