/**
 * Apollo.io and Bigin Integration - Sample Usage
 */

require('dotenv').config();
const integration = require('./integration');

// Example usage of the integration functions
async function main() {
    try {
        console.log('Apollo.io and Bigin Integration Demo');
        console.log('------------------------------------');

        // Step 1: Ensure we have a valid Bigin token
        console.log('\n1. Refreshing Bigin token...');
        await integration.refreshBiginToken();
        console.log('✓ Token refreshed successfully');

        // Step 2: Search for contacts in Apollo
        console.log('\n2. Searching for contacts in Apollo...');
        const searchParams = {
            q_organization_domains: 'example.com',
            page: 1,
            per_page: 5
        };

        // NOTE: This is commented out to avoid making real API calls without valid credentials
        // const apolloContacts = await integration.searchApolloContacts(searchParams);
        // console.log(`✓ Found ${apolloContacts.length} contacts in Apollo`);

        // For demo purposes, use a mock Apollo contact
        const mockApolloContact = {
            id: 'mock-apollo-id',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone_number: '+1234567890',
            title: 'Product Manager',
            organization_name: 'Example Corp',
            organization_website: 'https://example.com',
            organization_industry: 'Technology'
        };
        console.log('✓ Using mock Apollo contact for demo');
        console.log(mockApolloContact);

        // Step 3: Get existing contacts from Bigin
        console.log('\n3. Getting existing contacts from Bigin...');
        const biginContacts = await integration.getBiginContacts();
        console.log(`✓ Found ${biginContacts.length} contacts in Bigin`);

        // Step 4: Get existing accounts from Bigin
        console.log('\n4. Getting existing accounts from Bigin...');
        const biginAccounts = await integration.getBiginAccounts();
        console.log(`✓ Found ${biginAccounts.length} accounts in Bigin`);

        // Step 5: Sync the Apollo contact to Bigin
        console.log('\n5. Syncing Apollo contact to Bigin...');
        const syncResult = await integration.syncApolloContactToBigin(mockApolloContact);
        console.log('✓ Contact synced successfully:');
        console.log(syncResult);

        console.log('\nIntegration demo completed successfully!');
    } catch (error) {
        console.error('Error in integration demo:', error);
    }
}

// Run the demo
main().catch(console.error);