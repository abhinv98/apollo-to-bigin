/**
 * API Testing Script for Apollo.io and Bigin
 * 
 * This script tests basic connectivity and functionality of both APIs.
 */

require('dotenv').config();
const axios = require('axios');

// API configuration from environment variables
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const BIGIN_ACCESS_TOKEN = process.env.BIGIN_ACCESS_TOKEN;
const BIGIN_REFRESH_TOKEN = process.env.BIGIN_REFRESH_TOKEN;
const BIGIN_CLIENT_ID = process.env.BIGIN_CLIENT_ID;
const BIGIN_CLIENT_SECRET = process.env.BIGIN_CLIENT_SECRET;

// API URLs
const APOLLO_BASE_URL = 'https://api.apollo.io/v1';
const BIGIN_BASE_URL = 'https://www.zohoapis.com/bigin/v1';
const BIGIN_AUTH_URL = 'https://accounts.zoho.com/oauth/v2/token';

/**
 * Test Apollo.io API
 */
async function testApolloAPI() {
    console.log('\n--- Testing Apollo.io API ---');

    try {
        // Test 1: Check API health
        console.log('\nTest 1: Checking API health...');
        const healthResponse = await axios.get(`${APOLLO_BASE_URL}/auth/health`);
        console.log('Health check response:', healthResponse.data);
        console.log('✓ Apollo.io API health check successful');

        // Test 2: Test API key validity
        console.log('\nTest 2: Testing API key validity...');
        if (!APOLLO_API_KEY || APOLLO_API_KEY === 'your_apollo_api_key_here') {
            console.log('⚠️ No valid Apollo.io API key found in environment variables');
            console.log('Skipping API key validation test');
            return;
        }

        const keyResponse = await axios.post(`${APOLLO_BASE_URL}/auth/validate`, {
            api_key: APOLLO_API_KEY
        });
        console.log('Key validation response:', keyResponse.data);
        console.log('✓ Apollo.io API key validation successful');

        // Test 3: Basic search capability
        console.log('\nTest 3: Testing basic search capability...');
        const searchResponse = await axios.post(`${APOLLO_BASE_URL}/mixed_people/search`, {
            api_key: APOLLO_API_KEY,
            q_organization_domains: 'example.com',
            page: 1,
            per_page: 1
        });
        const totalResults = searchResponse.data.breadcrumbs && searchResponse.data.breadcrumbs.total || 0;
        console.log(`Found ${totalResults} results`);
        console.log('✓ Apollo.io search capability test successful');

    } catch (error) {
        console.error('❌ Apollo.io API test failed:', error.response && error.response.data || error.message);
    }
}

/**
 * Refresh Bigin access token
 */
async function refreshBiginToken() {
    try {
        console.log('\nRefreshing Bigin token...');

        if (!BIGIN_REFRESH_TOKEN || !BIGIN_CLIENT_ID || !BIGIN_CLIENT_SECRET ||
            BIGIN_REFRESH_TOKEN === 'your_bigin_refresh_token_here' ||
            BIGIN_CLIENT_ID === 'your_bigin_client_id_here' ||
            BIGIN_CLIENT_SECRET === 'your_bigin_client_secret_here') {
            console.log('⚠️ No valid Bigin credentials found in environment variables');
            return null;
        }

        const params = new URLSearchParams();
        params.append('refresh_token', BIGIN_REFRESH_TOKEN);
        params.append('client_id', BIGIN_CLIENT_ID);
        params.append('client_secret', BIGIN_CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');

        const response = await axios.post(BIGIN_AUTH_URL, params);
        console.log('Token refreshed successfully');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Error refreshing Bigin token:', error.response && error.response.data || error.message);
        return null;
    }
}

/**
 * Test Bigin API
 */
async function testBiginAPI() {
    console.log('\n--- Testing Bigin API ---');

    try {
        // Test 1: Refresh token
        console.log('\nTest 1: Refreshing access token...');
        let accessToken = BIGIN_ACCESS_TOKEN;

        if (!accessToken || accessToken === 'your_bigin_access_token_here') {
            accessToken = await refreshBiginToken();
            if (!accessToken) {
                console.log('⚠️ Could not obtain a valid access token');
                return;
            }
        }

        console.log('✓ Access token obtained successfully');

        // Test 2: Get modules
        console.log('\nTest 2: Getting available modules...');
        const modulesResponse = await axios.get(`${BIGIN_BASE_URL}/settings/modules`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const modules = modulesResponse.data.modules || {};
        console.log('Available modules:', Object.keys(modules).join(', '));
        console.log('✓ Modules retrieval successful');

        // Test 3: Get a few contacts
        console.log('\nTest 3: Getting contacts...');
        const contactsResponse = await axios.get(`${BIGIN_BASE_URL}/Contacts?fields=Full_Name,Email&per_page=5`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const contacts = contactsResponse.data.data || [];
        console.log(`Retrieved ${contacts.length} contacts`);
        if (contacts.length > 0) {
            console.log('First contact:', contacts[0].Full_Name);
        }
        console.log('✓ Contacts retrieval successful');

    } catch (error) {
        console.error('❌ Bigin API test failed:', error.response && error.response.data || error.message);
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('=== Apollo.io and Bigin API Test ===\n');

    try {
        // Test Apollo.io API
        await testApolloAPI();

        // Test Bigin API
        await testBiginAPI();

        console.log('\n=== API Testing Complete ===');
    } catch (error) {
        console.error('Unexpected error during testing:', error);
    }
}

// Run the tests
runTests().catch(console.error);