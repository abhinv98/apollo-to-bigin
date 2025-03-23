/**
 * Sample script to fetch one contact from Apollo.io and one from Bigin
 * for field mapping reference
 */

require('dotenv').config();
const axios = require('axios');
const querystring = require('querystring');

// API keys from .env file
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const BIGIN_ACCESS_TOKEN = process.env.BIGIN_ACCESS_TOKEN;
const BIGIN_REFRESH_TOKEN = process.env.BIGIN_REFRESH_TOKEN;
const BIGIN_CLIENT_ID = process.env.BIGIN_CLIENT_ID;
const BIGIN_CLIENT_SECRET = process.env.BIGIN_CLIENT_SECRET;

// Log environment variables for debugging (masked for security)
console.log('Environment variables:');
console.log(`- APOLLO_API_KEY: ${APOLLO_API_KEY ? APOLLO_API_KEY.substring(0, 4) + '...' : 'not set'}`);
console.log(`- BIGIN_ACCESS_TOKEN: ${BIGIN_ACCESS_TOKEN ? BIGIN_ACCESS_TOKEN.substring(0, 4) + '...' : 'not set'}`);
console.log(`- BIGIN_REFRESH_TOKEN: ${BIGIN_REFRESH_TOKEN ? BIGIN_REFRESH_TOKEN.substring(0, 4) + '...' : 'not set'}`);
console.log(`- BIGIN_CLIENT_ID: ${BIGIN_CLIENT_ID ? BIGIN_CLIENT_ID.substring(0, 4) + '...' : 'not set'}`);
console.log(`- BIGIN_CLIENT_SECRET: ${BIGIN_CLIENT_SECRET ? BIGIN_CLIENT_SECRET.substring(0, 4) + '...' : 'not set'}`);

async function refreshBiginToken() {
    try {
        console.log('Refreshing Bigin token...');

        // Use form data instead of URL params
        const formData = querystring.stringify({
            refresh_token: BIGIN_REFRESH_TOKEN,
            client_id: BIGIN_CLIENT_ID,
            client_secret: BIGIN_CLIENT_SECRET,
            grant_type: 'refresh_token'
        });

        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token',
            formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('Token refresh response:', response.data);

        if (response.data && response.data.access_token) {
            console.log('Token refresh successful!');
            return response.data.access_token;
        } else {
            throw new Error('No access token in response');
        }
    } catch (error) {
        console.error('Error refreshing token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function fetchApolloContact() {
    try {
        console.log('\n--- FETCHING APOLLO CONTACT ---\n');

        const response = await axios.post('https://api.apollo.io/v1/mixed_people/search', {
            api_key: APOLLO_API_KEY,
            page: 1,
            per_page: 1
        });

        if (response.data && response.data.people && response.data.people.length > 0) {
            const contact = response.data.people[0];
            console.log('Apollo Contact Sample:');
            console.log(JSON.stringify(contact, null, 2));

            // Display important fields for mapping
            console.log('\nImportant Apollo Fields:');
            console.log(`- ID: ${contact.id}`);
            console.log(`- Name: ${contact.first_name} ${contact.last_name}`);
            console.log(`- Email: ${contact.email}`);
            console.log(`- Title: ${contact.title}`);
            console.log(`- Organization: ${contact.organization ? contact.organization.name : 'N/A'}`);
            console.log(`- Phone: ${contact.phone_number || 'N/A'}`);
            console.log(`- LinkedIn: ${contact.linkedin_url || 'N/A'}`);
            console.log(`- City: ${contact.city || 'N/A'}`);
            console.log(`- State: ${contact.state || 'N/A'}`);
            console.log(`- Country: ${contact.country || 'N/A'}`);

            return contact;
        } else {
            console.log('No Apollo contacts found.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching Apollo contact:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function fetchBiginContact(accessToken) {
    try {
        console.log('\n--- FETCHING BIGIN CONTACT ---\n');
        console.log(`Using access token: ${accessToken.substring(0, 10)}...`);

        const response = await axios.get('https://www.zohoapis.com/bigin/v1/Contacts', {
            params: {
                per_page: 1
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.data && response.data.data.length > 0) {
            const contact = response.data.data[0];
            console.log('Bigin Contact Sample:');
            console.log(JSON.stringify(contact, null, 2));

            // Display important fields for mapping
            console.log('\nImportant Bigin Fields:');
            Object.keys(contact).forEach(key => {
                console.log(`- ${key}: ${typeof contact[key] === 'object' ? JSON.stringify(contact[key]) : contact[key]}`);
            });

            return contact;
        } else {
            console.log('No Bigin contacts found.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching Bigin contact:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function main() {
    try {
        // Fetch Apollo contact
        const apolloContact = await fetchApolloContact();

        // Refresh Bigin token and fetch Bigin contact
        try {
            const newAccessToken = await refreshBiginToken();
            console.log(`New access token: ${newAccessToken}`);

            // Use the new token to fetch a Bigin contact
            await fetchBiginContact(newAccessToken);
        } catch (error) {
            console.log('Failed to refresh Bigin token, trying with existing token...');

            if (BIGIN_ACCESS_TOKEN) {
                // Try with existing token from .env
                await fetchBiginContact(BIGIN_ACCESS_TOKEN);
            } else {
                console.error('No access token available');
            }
        }
    } catch (error) {
        console.error('Error in main execution:', error);
    }
}

// Run the script
main();