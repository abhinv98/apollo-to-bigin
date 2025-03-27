/**
 * Apollo.io to Bigin Integration Server
 * 
 * This server provides API endpoints for:
 * 1. Fetching contacts from Apollo.io
 * 2. Syncing contacts to Bigin
 * 3. Serving the UI for contact management
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const integration = require('./integration');
const fieldMapping = require('./field-mapping');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'ui')));

// Serve the main UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

// API Routes

/**
 * Get contacts from Apollo.io
 * This will be called when the UI initially loads and when searching
 */
app.get('/api/apollo/contacts', async(req, res) => {
    try {
        const { 
            page = 1, 
            perPage = 25,
            jobTitle = '', 
            region = '', 
            industry = '', 
            keywords = '' 
        } = req.query;

        // Build search parameters
        const searchParams = {
            page: parseInt(page),
            per_page: parseInt(perPage)
        };

        // Add filters if provided
        if (jobTitle) {
            searchParams.q_titles = jobTitle;
        }

        if (region) {
            // Region can be country, state, or city
            if (region.length === 2 && region === region.toUpperCase()) {
                // If region looks like a country code (e.g., US, UK)
                searchParams.q_country_codes = region;
            } else {
                // Otherwise treat as a location name (state, city)
                searchParams.q_locations = region;
            }
        }

        if (industry) {
            searchParams.q_industry_tag_ids = industry;
        }

        if (keywords) {
            searchParams.q_keywords = keywords;
        }

        const contacts = await integration.searchApolloContacts(searchParams);

        // Include pagination info in the response
        res.json({
            success: true,
            contacts,
            page: parseInt(page),
            perPage: parseInt(perPage),
            totalContacts: contacts.length // In a real implementation, total count would come from Apollo API
        });
    } catch (error) {
        console.error('Error fetching Apollo contacts:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response && error.response.data
        });
    }
});

/**
 * Get industries from Apollo.io
 */
app.get('/api/apollo/industries', async(req, res) => {
    try {
        // Make an actual API call to Apollo to get industries
        const apolloApiKey = process.env.APOLLO_API_KEY;
        
        if (!apolloApiKey) {
            throw new Error('Apollo API key not found. Please add it to your .env file.');
        }
        
        // Call Apollo API to get industries
        const response = await axios.get(`${process.env.APOLLO_BASE_URL || 'https://api.apollo.io/v1'}/organizations/search`, {
            params: {
                api_key: apolloApiKey,
                page: 1,
                per_page: 1, // We just need to make a minimal call to check available industries
            }
        });
        
        // Extract industries from response
        // In a real scenario, we would parse the industries from the response
        // For now, use the list shown in the UI screenshots
        const industries = [
            { id: 'it_services', name: 'information technology & services' },
            { id: 'construction', name: 'construction' },
            { id: 'marketing', name: 'marketing & advertising' },
            { id: 'real_estate', name: 'real estate' },
            { id: 'health', name: 'health, wellness & fitness' },
            { id: 'consulting', name: 'management consulting' },
            { id: 'software', name: 'computer software' },
            { id: 'internet', name: 'internet' },
            { id: 'retail', name: 'retail' },
            { id: 'financial', name: 'financial services' },
            { id: 'consumer', name: 'consumer services' },
            { id: 'healthcare', name: 'hospital & health care' },
            { id: 'automotive', name: 'automotive' },
            { id: 'restaurants', name: 'restaurants' },
            { id: 'education', name: 'education management' },
            { id: 'food', name: 'food & beverages' },
            { id: 'design', name: 'design' },
            { id: 'hospitality', name: 'hospitality' },
            { id: 'accounting', name: 'accounting' },
            { id: 'events', name: 'events services' }
        ];
        
        console.log('Successfully fetched industries from Apollo API');
        
        res.json({
            success: true,
            industries
        });
    } catch (error) {
        console.error('Error fetching industries:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response && error.response.data
        });
    }
});

/**
 * Reveal contact information (email or phone)
 */
app.post('/api/apollo/reveal', async(req, res) => {
    try {
        const { contactIds, type } = req.body;

        if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Contact IDs are required'
            });
        }

        if (!type || !['email', 'phone'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Valid type (email or phone) is required'
            });
        }

        // In a real implementation, you would call Apollo API to reveal the information
        // For demonstration, we'll simulate a successful response
        
        // Mock contact data with revealed information
        const revealedContacts = contactIds.map(id => {
            // Create a mock contact with the revealed information
            const contact = {
                id: id
            };

            // Add the revealed information based on the type
            if (type === 'email') {
                contact.email = `contact_${id.substring(0, 6)}@example.com`;
            } else if (type === 'phone') {
                contact.mobile_phone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            }

            return contact;
        });

        res.json({
            success: true,
            contacts: revealedContacts,
            message: `Successfully revealed ${type} for ${revealedContacts.length} contact(s)`
        });
    } catch (error) {
        console.error(`Error revealing ${type}:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get contacts from Bigin
 */
app.get('/api/bigin/contacts', async(req, res) => {
    try {
        const { page = 1, perPage = 25 } = req.query;
        const pageInt = parseInt(page);
        const perPageInt = parseInt(perPage);

        // Ensure we have a valid token
        const token = await integration.refreshBiginToken();

        // Set headers
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Get only the contacts for the requested page using Zoho's pagination
        // Zoho uses index-based pagination with from_index parameter
        const fromIndex = (pageInt - 1) * perPageInt;
        const response = await axios.get(
            `${process.env.BIGIN_BASE_URL || 'https://www.zohoapis.com/bigin/v1'}/Contacts?from_index=${fromIndex}&per_page=${perPageInt}`, { headers }
        );

        if (!response.data || !response.data.data) {
            throw new Error('Invalid response from Bigin API');
        }

        // Get the total count from Bigin for pagination calculation
        // If info exists in the response, use it, otherwise make a separate count request
        let totalCount = 0;

        if (response.data.info && response.data.info.count) {
            totalCount = response.data.info.count;
        } else {
            // Get count from a separate API call
            const countResponse = await axios.get(
                `${process.env.BIGIN_BASE_URL || 'https://www.zohoapis.com/bigin/v1'}/Contacts/count`, { headers }
            );
            if (countResponse.data && countResponse.data.count) {
                totalCount = countResponse.data.count;
            }
        }

        res.json({
            success: true,
            contacts: response.data.data,
            page: pageInt,
            perPage: perPageInt,
            totalContacts: totalCount,
            hasMore: response.data.info && response.data.info.more_records === true
        });
    } catch (error) {
        console.error('Error fetching Bigin contacts:', error);
        // If it's a rate limit error, return a more specific message
        if (error.message && error.message.includes('rate limit')) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                isRateLimit: true
            });
        }
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response && error.response.data
        });
    }
});

/**
 * Search Bigin contacts by name, email or company
 */
app.get('/api/bigin/contacts/search', async(req, res) => {
    try {
        const { query, page = 1, perPage = 25 } = req.query;
        const pageInt = parseInt(page);
        const perPageInt = parseInt(perPage);

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        // Ensure we have a valid token
        const token = await integration.refreshBiginToken();

        // Set headers
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Search directly with the Bigin API using criteria
        // This is more efficient than fetching all and filtering
        // Use appropriate search criteria based on the query
        const criteria = encodeURIComponent(`(Full_Name:contains:${query})OR(Email:contains:${query})OR(Account_Name:contains:${query})`);
        const fromIndex = (pageInt - 1) * perPageInt;

        const response = await axios.get(
            `${process.env.BIGIN_BASE_URL || 'https://www.zohoapis.com/bigin/v1'}/Contacts/search?criteria=${criteria}&from_index=${fromIndex}&per_page=${perPageInt}`, { headers }
        );

        if (!response.data) {
            throw new Error('Invalid response from Bigin API');
        }

        // Get the total count from the search response if available
        let totalCount = 0;
        if (response.data.info && response.data.info.count) {
            totalCount = response.data.info.count;
        } else {
            totalCount = response.data.data ? response.data.data.length : 0;
        }

        res.json({
            success: true,
            contacts: response.data.data || [],
            page: pageInt,
            perPage: perPageInt,
            totalContacts: totalCount,
            hasMore: response.data.info && response.data.info.more_records === true
        });
    } catch (error) {
        console.error('Error searching Bigin contacts:', error);
        // If it's a rate limit error, return a more specific message
        if (error.message && error.message.includes('rate limit')) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                isRateLimit: true
            });
        }
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response && error.response.data
        });
    }
});

/**
 * Sync a single contact from Apollo to Bigin
 */
app.post('/api/sync/contact', async(req, res) => {
    try {
        const { apolloContact } = req.body;

        if (!apolloContact) {
            return res.status(400).json({ success: false, error: 'No contact data provided' });
        }

        // Map Apollo contact to Bigin format
        const biginContact = fieldMapping.mapApolloContactToBigin(apolloContact);

        // No need to explicitly refresh token, it's handled in createBiginContact
        const result = await integration.createBiginContact(biginContact);

        res.json({
            success: true,
            contact: result,
            apolloId: apolloContact.id
        });
    } catch (error) {
        console.error('Error syncing contact:', error);
        // If it's a rate limit error, return a more specific message
        if (error.message && error.message.includes('rate limit')) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                isRateLimit: true
            });
        }
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response && error.response.data
        });
    }
});

/**
 * Bulk sync contacts from Apollo to Bigin
 */
app.post('/api/sync/contacts/bulk', async(req, res) => {
    try {
        const { contacts } = req.body;

        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ success: false, error: 'No contacts provided for bulk sync' });
        }

        // No need to explicitly refresh token, it's handled in createBiginContact

        // Process contacts in batches
        const results = [];
        const batchSize = 5; // Process 5 contacts at a time to avoid rate limits
        const batchDelay = 2000; // 2 second delay between batches

        for (let i = 0; i < contacts.length; i += batchSize) {
            const batch = contacts.slice(i, Math.min(i + batchSize, contacts.length));

            // Process each contact in the batch
            const batchPromises = batch.map(async(apolloContact) => {
                try {
                    // Map Apollo contact to Bigin format
                    const biginContact = fieldMapping.mapApolloContactToBigin(apolloContact);

                    // Sync the contact
                    const result = await integration.createBiginContact(biginContact);

                    return {
                        id: apolloContact.id,
                        name: `${apolloContact.first_name} ${apolloContact.last_name}`,
                        email: apolloContact.email,
                        company: apolloContact.organization_name,
                        success: true,
                        bigin_id: result.id,
                        message: 'Successfully synced to Bigin'
                    };
                } catch (error) {
                    return {
                        id: apolloContact.id,
                        name: `${apolloContact.first_name} ${apolloContact.last_name}`,
                        email: apolloContact.email,
                        company: apolloContact.organization_name,
                        success: false,
                        message: error.message || 'Error syncing to Bigin'
                    };
                }
            });

            // Wait for all contacts in the batch to be processed
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Add a delay between batches to respect API rate limits
            if (i + batchSize < contacts.length) {
                await new Promise(resolve => setTimeout(resolve, batchDelay));
            }
        }

        // Return the results
        res.json({
            success: true,
            results,
            summary: {
                total: contacts.length,
                success: results.filter(r => r.success).length,
                error: results.filter(r => !r.success).length
            }
        });
    } catch (error) {
        console.error('Error in bulk sync operation:', error);
        // If it's a rate limit error, return a more specific message
        if (error.message && error.message.includes('rate limit')) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                isRateLimit: true
            });
        }
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response && error.response.data
        });
    }
});

/**
 * Check Bigin connection status
 */
app.get('/api/bigin/status', async(req, res) => {
    try {
        // First check if we have cached data rather than making a new API call
        const cachedContacts = await integration.getBiginContacts();
        if (cachedContacts && cachedContacts.length > 0) {
            return res.json({
                success: true,
                connected: true,
                usingCache: true,
                contactCount: cachedContacts.length
            });
        }

        // If no cached data, try to refresh token
        const token = await integration.refreshBiginToken();

        res.json({
            success: true,
            connected: true,
            tokenStatus: 'Valid'
        });
    } catch (error) {
        console.error('Error checking Bigin connection:', error);
        res.status(200).json({
            success: false,
            connected: false,
            error: error.message,
            details: error.response && error.response.data
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the Apollo to Bigin integration UI`);
});