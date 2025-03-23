/**
 * Example: Search for organizations in Apollo.io and sync to Bigin
 * 
 * This example demonstrates how to:
 * 1. Search for organizations in Apollo.io
 * 2. Create or update those organizations in Bigin
 */

require('dotenv').config({ path: '../.env' });
const integration = require('../integration');
const axios = require('axios');

// Apollo.io API for organization search
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_BASE_URL = 'https://api.apollo.io/v1';

/**
 * Search for organizations in Apollo.io
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Array>} - Array of organizations
 */
async function searchApolloOrganizations(searchParams) {
    try {
        const response = await axios.post(`${APOLLO_BASE_URL}/organizations/search`, {
            api_key: APOLLO_API_KEY,
            ...searchParams
        });

        return response.data.organizations;
    } catch (error) {
        console.error('Error searching Apollo organizations:', error.response ? .data || error.message);
        throw error;
    }
}

/**
 * Transform Apollo organization to Bigin account format
 * @param {Object} apolloOrg - Apollo organization
 * @returns {Object} - Bigin account format
 */
function transformToAccount(apolloOrg) {
    return {
        name: apolloOrg.name,
        website: apolloOrg.website_url,
        industry: apolloOrg.industry,
        phone_number: apolloOrg.phone
    };
}

async function syncOrganizations() {
    try {
        console.log('Organization Search and Sync Example');
        console.log('-----------------------------------');

        // Step 1: Ensure we have a valid Bigin token
        console.log('\n1. Refreshing Bigin token...');
        await integration.refreshBiginToken();
        console.log('✓ Bigin token refreshed successfully');

        // Step 2: Search for organizations in Apollo
        console.log('\n2. Searching for organizations in Apollo...');
        const searchParams = {
            q_organization_domains: 'salesforce.com',
            page: 1,
            per_page: 2
        };

        // NOTE: This is commented out to avoid making real API calls without valid credentials
        // const apolloOrgs = await searchApolloOrganizations(searchParams);

        // Using mock organization data for demo purposes
        const mockApolloOrgs = [{
                id: 'mock-apollo-org-1',
                name: 'Salesforce',
                website_url: 'https://salesforce.com',
                industry: 'Software',
                phone: '+1-800-123-4567',
                employee_count: 30000,
                founded_year: 1999,
                location: 'San Francisco, CA',
                linkedin_url: 'https://linkedin.com/company/salesforce'
            },
            {
                id: 'mock-apollo-org-2',
                name: 'Salesforce Marketing Cloud',
                website_url: 'https://marketingcloud.salesforce.com',
                industry: 'Marketing Software',
                phone: '+1-800-123-4567',
                employee_count: 5000,
                founded_year: 2000,
                location: 'Indianapolis, IN',
                linkedin_url: 'https://linkedin.com/company/salesforce-marketing-cloud'
            }
        ];

        console.log(`✓ Found ${mockApolloOrgs.length} organizations in Apollo`);

        // Step 3: Get existing accounts from Bigin
        console.log('\n3. Getting existing accounts from Bigin...');
        const biginAccounts = await integration.getBiginAccounts();
        console.log(`✓ Found ${biginAccounts.length} accounts in Bigin`);

        // Step 4: Sync each organization to Bigin
        console.log('\n4. Syncing organizations to Bigin...');
        const syncResults = [];

        for (const apolloOrg of mockApolloOrgs) {
            console.log(`\nProcessing organization: ${apolloOrg.name}`);

            // Check if account already exists in Bigin
            const existingAccount = biginAccounts.find(account =>
                account.Account_Name &&
                account.Account_Name.toLowerCase() === apolloOrg.name.toLowerCase()
            );

            if (existingAccount) {
                console.log(`✓ Organization "${apolloOrg.name}" already exists in Bigin`);
                syncResults.push(existingAccount);
            } else {
                // Transform Apollo organization to Bigin account format
                const accountData = transformToAccount(apolloOrg);

                // Create account in Bigin
                console.log(`Creating organization "${apolloOrg.name}" in Bigin...`);
                const newAccount = await integration.createBiginAccount(accountData);
                console.log(`✓ Organization created successfully with ID: ${newAccount.id}`);

                syncResults.push(newAccount);
            }
        }

        console.log('\nSync results:');
        console.log(syncResults);

        console.log('\nOrganization sync process completed successfully!');
    } catch (error) {
        console.error('Error in organization sync process:', error);
    }
}

// Run the example
syncOrganizations().catch(console.error);