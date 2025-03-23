/**
 * Example: Bulk Operations between Apollo.io and Bigin
 * 
 * This example demonstrates how to:
 * 1. Fetch multiple contacts from Apollo.io
 * 2. Batch process them for Bigin
 * 3. Handle the bulk operations efficiently
 */

require('dotenv').config({ path: '../.env' });
const integration = require('../integration');

// Mock Apollo contacts for demo purposes
const mockApolloContacts = [{
        id: 'apollo-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '+1-555-123-4567',
        title: 'CTO',
        organization_name: 'Tech Innovators Inc',
        organization_website: 'https://techinnovators.com',
        organization_industry: 'Software'
    },
    {
        id: 'apollo-2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@acmecorp.com',
        phone_number: '+1-555-987-6543',
        title: 'VP of Marketing',
        organization_name: 'ACME Corporation',
        organization_website: 'https://acmecorp.com',
        organization_industry: 'Retail'
    },
    {
        id: 'apollo-3',
        first_name: 'Robert',
        last_name: 'Johnson',
        email: 'robert.johnson@globaltech.net',
        phone_number: '+1-555-456-7890',
        title: 'Product Manager',
        organization_name: 'Global Tech Solutions',
        organization_website: 'https://globaltech.net',
        organization_industry: 'IT Services'
    },
    {
        id: 'apollo-4',
        first_name: 'Emily',
        last_name: 'Williams',
        email: 'emily.williams@futuresoft.io',
        phone_number: '+1-555-789-0123',
        title: 'Sales Director',
        organization_name: 'Future Software',
        organization_website: 'https://futuresoft.io',
        organization_industry: 'Software'
    },
    {
        id: 'apollo-5',
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael.brown@nextstep.com',
        phone_number: '+1-555-234-5678',
        title: 'CEO',
        organization_name: 'NextStep Innovations',
        organization_website: 'https://nextstep.com',
        organization_industry: 'Technology'
    }
];

/**
 * Process contacts in batches
 * @param {Array} contacts - Array of contacts to process
 * @param {number} batchSize - Size of each batch
 * @param {Function} processFn - Function to process each batch
 * @returns {Promise<Array>} - Results of all batches
 */
async function processBatches(contacts, batchSize, processFn) {
    const results = [];

    // Split contacts into batches
    for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1} (${batch.length} contacts)...`);

        // Process this batch
        const batchResults = await processFn(batch);
        results.push(...batchResults);

        // If not the last batch, wait a bit to respect rate limits
        if (i + batchSize < contacts.length) {
            console.log('Waiting before processing next batch...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return results;
}

/**
 * Sync a batch of contacts to Bigin
 * @param {Array} contactBatch - Batch of contacts to sync
 * @returns {Promise<Array>} - Results of the sync operation
 */
async function syncContactBatch(contactBatch) {
    const results = [];

    for (const contact of contactBatch) {
        try {
            console.log(`Syncing contact: ${contact.first_name} ${contact.last_name}`);
            const result = await integration.syncApolloContactToBigin(contact);
            results.push({
                id: contact.id,
                status: 'success',
                bigin_id: result.id,
                message: 'Contact synced successfully'
            });
        } catch (error) {
            console.error(`Error syncing contact ${contact.id}:`, error.message);
            results.push({
                id: contact.id,
                status: 'error',
                message: error.message
            });
        }
    }

    return results;
}

/**
 * Get unique organizations from contacts
 * @param {Array} contacts - Array of contacts
 * @returns {Array} - Unique organizations
 */
function extractUniqueOrganizations(contacts) {
    const orgMap = new Map();

    contacts.forEach(contact => {
        if (contact.organization_name && !orgMap.has(contact.organization_name)) {
            orgMap.set(contact.organization_name, {
                name: contact.organization_name,
                website: contact.organization_website,
                industry: contact.organization_industry,
                phone_number: contact.organization_phone
            });
        }
    });

    return Array.from(orgMap.values());
}

async function performBulkOperations() {
    try {
        console.log('Bulk Operations Example');
        console.log('----------------------');

        // Step 1: Ensure we have a valid Bigin token
        console.log('\n1. Refreshing Bigin token...');
        await integration.refreshBiginToken();
        console.log('✓ Bigin token refreshed successfully');

        // Step 2: Extract unique organizations
        console.log('\n2. Extracting unique organizations from contacts...');
        const uniqueOrgs = extractUniqueOrganizations(mockApolloContacts);
        console.log(`✓ Extracted ${uniqueOrgs.length} unique organizations`);

        // Step 3: Sync organizations to Bigin first
        console.log('\n3. Syncing organizations to Bigin...');
        const orgResults = await processBatches(uniqueOrgs, 2, async(batch) => {
            const results = [];

            for (const org of batch) {
                try {
                    // Check if organization already exists
                    const biginAccounts = await integration.getBiginAccounts();
                    const existingAccount = biginAccounts.find(account =>
                        account.Account_Name &&
                        account.Account_Name.toLowerCase() === org.name.toLowerCase()
                    );

                    if (existingAccount) {
                        console.log(`Organization "${org.name}" already exists in Bigin`);
                        results.push({
                            name: org.name,
                            status: 'exists',
                            bigin_id: existingAccount.id
                        });
                    } else {
                        console.log(`Creating organization "${org.name}" in Bigin...`);
                        const newAccount = await integration.createBiginAccount(org);
                        results.push({
                            name: org.name,
                            status: 'created',
                            bigin_id: newAccount.id
                        });
                    }
                } catch (error) {
                    console.error(`Error processing organization ${org.name}:`, error.message);
                    results.push({
                        name: org.name,
                        status: 'error',
                        message: error.message
                    });
                }
            }

            return results;
        });

        console.log('\nOrganization sync results:');
        console.log(orgResults);

        // Step 4: Sync contacts to Bigin in batches
        console.log('\n4. Syncing contacts to Bigin in batches...');
        const contactResults = await processBatches(mockApolloContacts, 2, syncContactBatch);

        console.log('\nContact sync results:');
        console.log(contactResults);

        // Summary
        const successCount = contactResults.filter(r => r.status === 'success').length;
        const errorCount = contactResults.filter(r => r.status === 'error').length;

        console.log('\nBulk operation summary:');
        console.log(`- Total contacts processed: ${contactResults.length}`);
        console.log(`- Successfully synced: ${successCount}`);
        console.log(`- Errors: ${errorCount}`);

        console.log('\nBulk operations completed!');
    } catch (error) {
        console.error('Error in bulk operations:', error);
    }
}

// Run the example
performBulkOperations().catch(console.error);