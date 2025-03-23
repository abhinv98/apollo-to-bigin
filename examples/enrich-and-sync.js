/**
 * Example: Enrich a contact with Apollo.io and sync to Bigin
 * 
 * This example demonstrates how to:
 * 1. Take a basic contact with minimal information
 * 2. Enrich it with Apollo.io to get additional details
 * 3. Sync the enriched contact to Bigin CRM
 */

require('dotenv').config({ path: '../.env' });
const integration = require('../integration');

// Sample minimal contact information
const basicContact = {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@acmecorp.com',
    organization_name: 'ACME Corporation'
};

async function enrichAndSyncContact() {
    try {
        console.log('Contact Enrichment and Sync Example');
        console.log('----------------------------------');

        // Step 1: Display our basic contact
        console.log('\n1. Starting with basic contact information:');
        console.log(basicContact);

        // Step 2: Enrich the contact with Apollo.io
        console.log('\n2. Enriching contact with Apollo.io...');

        // NOTE: This is commented out to avoid making real API calls without valid credentials
        // const enrichedContact = await integration.enrichContactWithApollo(basicContact);

        // Using mock enriched data for demo purposes
        const enrichedContact = {
            ...basicContact,
            id: 'mock-apollo-id',
            phone_number: '+1-555-123-4567',
            title: 'VP of Marketing',
            organization_website: 'https://acmecorp.com',
            organization_industry: 'Software',
            organization_size: '51-200',
            organization_location: 'San Francisco, CA',
            linkedin_url: 'https://linkedin.com/in/janesmith',
            twitter_url: 'https://twitter.com/janesmith'
        };

        console.log('✓ Contact enriched successfully:');
        console.log(enrichedContact);

        // Step 3: Ensure we have a valid Bigin token
        console.log('\n3. Refreshing Bigin token...');
        await integration.refreshBiginToken();
        console.log('✓ Bigin token refreshed successfully');

        // Step 4: Sync the enriched contact to Bigin
        console.log('\n4. Syncing enriched contact to Bigin...');
        const syncResult = await integration.syncApolloContactToBigin(enrichedContact);
        console.log('✓ Contact synced to Bigin:');
        console.log(syncResult);

        console.log('\nEnrichment and sync process completed successfully!');
    } catch (error) {
        console.error('Error in enrichment and sync process:', error);
    }
}

// Run the example
enrichAndSyncContact().catch(console.error);