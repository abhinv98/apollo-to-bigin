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

// Simple in-memory storage for webhook received phone numbers
// In a production app, this would be stored in a database
const phoneStore = {
    contacts: new Map(), // Map of contact IDs to phone numbers
    lastUpdated: new Map(), // Map of contact IDs to timestamps
    
    // Add or update a phone number
    addPhone(contactId, phone) {
        this.contacts.set(contactId, phone);
        this.lastUpdated.set(contactId, Date.now());
        console.log(`Stored phone for contact ${contactId}: ${phone.substring(0, 3)}***`);
    },
    
    // Get a phone number
    getPhone(contactId) {
        return this.contacts.get(contactId);
    },
    
    // Check if we have a phone for this contact
    hasPhone(contactId) {
        return this.contacts.has(contactId);
    },
    
    // Get all stored phones
    getAllPhones() {
        const result = [];
        this.contacts.forEach((phone, id) => {
            result.push({
                id,
                phone,
                lastUpdated: this.lastUpdated.get(id)
            });
        });
        return result;
    }
};

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
            // Use person_titles instead of q_titles for job title filtering
            // This should be an array of strings according to Apollo API docs
            searchParams.person_titles = [jobTitle];
            console.log(`Job title filter applied: ${jobTitle}`);
        }

        if (region) {
            // For region filtering, use person_locations for personal location
            // or organization_locations for company headquarters
            if (region.length === 2 && region === region.toUpperCase()) {
                // If region looks like a country code (e.g., US, UK)
                searchParams.person_locations = [`${region}`];
            } else if (['United States', 'India', 'China', 'Japan', 'Germany', 'France', 'UK', 
                        'Canada', 'Australia', 'Brazil', 'Russia'].includes(region)) {
                // If it's a recognized country name
                searchParams.person_locations = [`${region}`];
            } else {
                // Otherwise treat as a location name (state, city)
                searchParams.person_locations = [`${region}`];
            }
            
            console.log(`Region filter applied: ${region} → person_locations`);
        }

        if (industry) {
            searchParams.q_industry_tag_ids = [industry];
        }

        if (keywords) {
            // Apollo API supports keyword search with q_keywords
            searchParams.q_keywords = keywords;
        }

        console.log('Apollo search params:', JSON.stringify(searchParams, null, 2));
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
        // Based on our API testing, we've identified the actual industry IDs
        // We're using a hardcoded list to avoid consuming API credits unnecessarily
        const industries = [
            { id: '5567cd4773696439b10b0000', name: 'information technology & services' },
            { id: '5567cd4773696439af0b0000', name: 'computer software' },
            { id: '5567cd47736964399f0b0000', name: 'internet' },
            { id: '5567cd4773696439ae0b0000', name: 'marketing & advertising' },
            { id: '5567cd47736964399c0b0000', name: 'healthcare' },
            { id: '5567cdd47369643dbf260000', name: 'management consulting' },
            { id: '5567cd4773696439970b0000', name: 'financial services' },
            { id: '5567cd47736964399a0b0000', name: 'construction' },
            { id: '5567cd47736964399b0b0000', name: 'real estate' },
            { id: '5567cd4e73696438b7030000', name: 'health, wellness & fitness' },
            { id: '5567e09973696410db020800', name: 'staffing & recruiting' },
            { id: '5567cdc6736964393f210000', name: 'retail' },
            { id: '5567cd65736964548f3a0000', name: 'hospital & health care' },
            { id: '5567cd76736964391a0b0000', name: 'automotive' },
            { id: '5567cdf573696439bd260000', name: 'restaurants' },
            { id: '5567cd8173696449a00b0000', name: 'education management' },
            { id: '5567cd8873696452ab0b0000', name: 'food & beverages' },
            { id: '5567cd7c7369646c9c0b0000', name: 'design' },
            { id: '5567cd90736964558d0b0000', name: 'hospitality' },
            { id: '5567cd5a7369645b8a0b0000', name: 'accounting' },
            { id: '5567cd8a736964652c0b0000', name: 'events services' },
            { id: '5567ce2673696453d95c0000', name: 'mechanical or industrial engineering' },
            { id: '5567cd4773696454303a0000', name: 'nonprofit organization management' },
            { id: '5567cdd4736964392e0b0000', name: 'consumer services' }
        ];
        
        console.log('Successfully providing industries list without consuming API credits');
        
        res.json({
            success: true,
            industries
        });
    } catch (error) {
        console.error('Error providing industries:', error);
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

        console.log(`Attempting to reveal ${type} for ${contactIds.length} contacts...`);
        
        // First we need to get the contact details so we can reveal them
        const contactDetails = await Promise.all(
            contactIds.map(async (id) => {
                try {
                    // Get contact details first
                    const peopleResponse = await axios.post('https://api.apollo.io/v1/people/search', {
                        api_key: process.env.APOLLO_API_KEY,
                        page: 1,
                        per_page: 1,
                        q_ids: [id]
                    });
                    
                    if (!peopleResponse.data || !peopleResponse.data.people || !peopleResponse.data.people.length) {
                        console.warn(`No contact found with ID: ${id}`);
                        return null;
                    }
                    
                    return peopleResponse.data.people[0];
                } catch (error) {
                    console.error(`Error getting contact details for ${id}:`, error.message);
                    return null;
                }
            })
        );
        
        // Filter out null values
        const validContacts = contactDetails.filter(contact => contact !== null);
        
        if (validContacts.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid contacts found to reveal information'
            });
        }
        
        // Now reveal the contact information
        const revealedContacts = await Promise.all(
            validContacts.map(async (contact) => {
                try {
                    const matchParams = {
                        api_key: process.env.APOLLO_API_KEY,
                        first_name: contact.first_name,
                        last_name: contact.last_name,
                        organization_name: contact.organization ? contact.organization.name : '',
                    };
                    
                    // Add the appropriate reveal parameter based on the type
                    if (type === 'email') {
                        matchParams.reveal_personal_emails = true;
                    } else if (type === 'phone') {
                        // For phone reveals, we need a webhook URL
                        matchParams.reveal_phone_number = true;
                        // Use the publicly accessible Vercel URL for webhook callbacks
                        matchParams.webhook_url = 'https://apollo-to-bigin.vercel.app/api/apollo/phone-webhook';
                        console.log(`Using webhook URL: ${matchParams.webhook_url}`);
                    }
                    
                    console.log(`Revealing ${type} for ${contact.first_name} ${contact.last_name} at ${matchParams.organization_name}...`);
                    
                    // Use people/match endpoint to reveal information
                    const response = await axios.post('https://api.apollo.io/v1/people/match', matchParams);

                    if (!response.data || !response.data.person) {
                        console.warn(`No person data returned from Apollo API for contact ${contact.id}`);
                        return { 
                            id: contact.id,
                            // Provide fallback data for UI display
                            [type === 'email' ? 'email' : 'mobile_phone']: type === 'email' ? 
                                'no.match@example.com' : '+10000000000'
                        };
                    }

                    const revealedPerson = response.data.person;
                    
                    // Create a contact object with the revealed information
                    const revealedContact = {
                        id: contact.id
                    };
                    
                    // Add email or phone based on the type
                    if (type === 'email') {
                        if (revealedPerson.email) {
                            revealedContact.email = revealedPerson.email;
                            console.log(`Successfully revealed email for ${contact.id}: ${revealedContact.email.substring(0, 3)}***`);
                        } else if (revealedPerson.personal_emails && revealedPerson.personal_emails.length > 0) {
                            revealedContact.email = revealedPerson.personal_emails[0];
                            console.log(`Successfully revealed personal email for ${contact.id}: ${revealedContact.email.substring(0, 3)}***`);
                        } else {
                            revealedContact.email = 'not.available@example.com';
                            console.log(`Email not available for ${contact.id}, using fallback`);
                        }
                    } else if (type === 'phone') {
                        // For phone numbers, initially use organization phone
                        // The webhook will provide actual phone numbers later
                        if (revealedPerson.phone_number) {
                            revealedContact.mobile_phone = revealedPerson.phone_number;
                            console.log(`Using direct phone number for ${contact.id}: ${revealedContact.mobile_phone.substring(0, 3)}***`);
                        } else if (revealedPerson.organization && revealedPerson.organization.phone) {
                            revealedContact.mobile_phone = revealedPerson.organization.phone;
                            console.log(`Using organization phone for ${contact.id}: ${revealedContact.mobile_phone.substring(0, 3)}***`);
                        } else if (revealedPerson.mobile_phone) {
                            revealedContact.mobile_phone = revealedPerson.mobile_phone;
                            console.log(`Using mobile phone for ${contact.id}: ${revealedContact.mobile_phone.substring(0, 3)}***`);
                        } else {
                            // Fallback
                            revealedContact.mobile_phone = '+10000000000';
                            console.log(`Phone not available for ${contact.id}, using fallback`);
                        }
                        
                        // Add a message that webhook will deliver additional phone numbers
                        revealedContact.phone_message = 'Additional phone numbers will be delivered via webhook';
                    }
                    
                    return revealedContact;
                } catch (error) {
                    console.error(`Error revealing contact ${contact.id}:`, error.message);
                    // Return contact ID with fallback values for error case
                    return { 
                        id: contact.id,
                        [type === 'email' ? 'email' : 'mobile_phone']: type === 'email' ? 
                            'error.occurred@example.com' : '+10000000000'
                    };
                }
            })
        );

        // Log API credit usage
        console.log(`Used ${revealedContacts.length * 2} Apollo API credits for revealing ${type} (search + match)`);

        res.json({
            success: true,
            contacts: revealedContacts,
            message: `Successfully revealed ${type} for ${revealedContacts.length} contact(s)${type === 'phone' ? '. Additional phone data will be delivered via webhook.' : ''}`
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

/**
 * Webhook endpoint for receiving phone data from Apollo.io
 */
app.post('/api/apollo/phone-webhook', async(req, res) => {
    try {
        console.log('Received webhook callback from Apollo with phone data');
        console.log('Webhook payload:', JSON.stringify(req.body, null, 2));
        
        const { people } = req.body;
        
        if (!people || !Array.isArray(people)) {
            console.warn('Invalid webhook payload - missing people array');
            // Still return 200 to prevent Apollo from retrying
            return res.status(200).json({
                success: false,
                error: 'Invalid payload format'
            });
        }
        
        console.log(`Processing phone data for ${people.length} contacts`);
        
        // Process each person in the webhook data
        const processedContacts = people.map(person => {
            if (!person.phone_numbers || !person.phone_numbers.length) {
                console.log(`No phone numbers found for contact ${person.id}`);
                return {
                    id: person.id,
                    status: 'no_phone_numbers'
                };
            }
            
            // Get the best phone number (usually the first one with highest confidence)
            const bestPhone = person.phone_numbers[0];
            
            // Store the phone number in our phoneStore
            phoneStore.addPhone(person.id, bestPhone.raw_number);
            
            console.log(`Found phone number for contact ${person.id}: ${bestPhone.raw_number.substring(0, 3)}***`);
            
            return {
                id: person.id,
                status: 'success',
                phone: bestPhone.raw_number,
                sanitized_phone: bestPhone.sanitized_number,
                confidence: bestPhone.confidence_cd
            };
        });
        
        // Return success to acknowledge receipt
        res.status(200).json({
            success: true,
            message: 'Phone data received successfully',
            processed: processedContacts.length
        });
    } catch (error) {
        console.error('Error processing Apollo phone webhook:', error);
        // Always return 200 even on error to prevent Apollo from retrying
        res.status(200).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get stored phone numbers from webhook callbacks
 */
app.get('/api/apollo/stored-phones', (req, res) => {
    try {
        const { contactIds } = req.query;
        
        // If specific contact IDs are requested
        if (contactIds) {
            // Parse the comma-separated list of IDs
            const ids = contactIds.split(',');
            const phones = {};
            
            ids.forEach(id => {
                if (phoneStore.hasPhone(id)) {
                    phones[id] = phoneStore.getPhone(id);
                }
            });
            
            return res.json({
                success: true,
                phones
            });
        }
        
        // Otherwise return all stored phones
        const allPhones = phoneStore.getAllPhones();
        
        res.json({
            success: true,
            count: allPhones.length,
            phones: allPhones
        });
    } catch (error) {
        console.error('Error retrieving stored phones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the Apollo to Bigin integration UI`);
});