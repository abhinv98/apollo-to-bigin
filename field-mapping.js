/**
 * Field mapping module for Apollo.io to Bigin integration
 * 
 * This module handles mapping between Apollo.io and Bigin fields
 */

// Industry mapping from Apollo to Bigin industry dropdown
const INDUSTRY_MAPPING = {
    // Direct matches
    'Software': 'Software',
    'Technology': 'Technology',
    'Healthcare': 'Healthcare',
    'Financial Services': 'Financial Services',
    'Retail': 'Retail',
    'Manufacturing': 'Manufacturing',
    'Education': 'Education',
    'Telecommunications': 'Telecommunications',
    'Media': 'Media',
    'Real Estate': 'Real Estate',
    'Transportation': 'Transportation',
    'Agriculture': 'Agriculture',

    // Mappings that need transformation
    'Information Technology': 'Technology',
    'IT Services': 'Technology',
    'Computer Software': 'Software',
    'SaaS': 'Software',
    'Internet': 'Technology',
    'Finance': 'Financial Services',
    'Banking': 'Financial Services',
    'Insurance': 'Financial Services',
    'Hospital & Health Care': 'Healthcare',
    'Pharmaceuticals': 'Healthcare',
    'Medical Devices': 'Healthcare',
    'E-Commerce': 'Retail',
    'Wholesale': 'Retail',
    'Construction': 'Construction',
    'Marketing & Advertising': 'Advertising',
    'Public Relations': 'Advertising',
    'Entertainment': 'Media',
    'Publishing': 'Media',
    'Hospitality': 'Hospitality',
    'Food & Beverages': 'Hospitality',
    'Automotive': 'Automotive',
    'Consumer Goods': 'Consumer Goods',
    'Non-Profit': 'Non-Profit',
    'Government': 'Government',
    'Legal Services': 'Legal',
    'Professional Services': 'Professional Services',
    'Consulting': 'Consulting',
    'Energy': 'Energy & Utilities',
    'Utilities': 'Energy & Utilities',
    'D2C': 'Consumer Goods'
};

/**
 * Map an Apollo.io contact to Bigin contact format
 * @param {Object} apolloContact - Apollo.io contact data
 * @returns {Object} - Bigin formatted contact data
 */
function mapApolloContactToBigin(apolloContact) {
    // Create a new contact object in Bigin format
    const biginContact = {
        // Required fields
        Last_Name: getLastName(apolloContact),

        // Other important fields
        First_Name: apolloContact.first_name || '',
        Email: apolloContact.email || '',
        Phone: apolloContact.phone_number || apolloContact.corporate_phone || apolloContact.work_direct_phone || '',
        Title: apolloContact.title || '',
        Industry_Drop: mapIndustry(apolloContact.industry),
        Lead_Source: 'Apollo.io',
        Description: generateDescription(apolloContact)
    };

    // Add account/company if available
    if (apolloContact.organization_name) {
        biginContact.Account_Name = {
            name: apolloContact.organization_name
        };
    }

    // Add additional fields if they exist
    if (apolloContact.city || apolloContact.state || apolloContact.country) {
        biginContact.Mailing_City = apolloContact.city || '';
        biginContact.Mailing_State = apolloContact.state || '';
        biginContact.Mailing_Country = apolloContact.country || '';
    }

    // Social media fields
    if (apolloContact.linkedin_url) {
        biginContact.LinkedIn = apolloContact.linkedin_url;
    }
    if (apolloContact.twitter_url) {
        biginContact.Twitter = apolloContact.twitter_url;
    }

    return biginContact;
}

/**
 * Map an Apollo.io organization to Bigin account format
 * @param {Object} apolloOrg - Apollo.io organization data
 * @returns {Object} - Bigin formatted account data
 */
function mapApolloOrgToBigin(apolloOrg) {
    // Create a new account object in Bigin format
    const biginAccount = {
        // Required fields
        Account_Name: apolloOrg.name || '',

        // Other important fields
        Website: apolloOrg.website_url || '',
        Industry: mapIndustry(apolloOrg.industry),
        Phone: apolloOrg.phone || '',
        Description: generateOrgDescription(apolloOrg)
    };

    // Add address if available
    if (apolloOrg.city || apolloOrg.state || apolloOrg.country) {
        biginAccount.Billing_City = apolloOrg.city || '';
        biginAccount.Billing_State = apolloOrg.state || '';
        biginAccount.Billing_Country = apolloOrg.country || '';
    }

    // Add other fields if they exist
    if (apolloOrg.estimated_num_employees) {
        biginAccount.Employees = apolloOrg.estimated_num_employees;
    }
    if (apolloOrg.annual_revenue) {
        // Convert to number and format appropriately
        const revenue = parseInt(apolloOrg.annual_revenue.replace(/[^0-9]/g, ''));
        if (!isNaN(revenue)) {
            biginAccount.Annual_Revenue = revenue;
        }
    }

    return biginAccount;
}

/**
 * Map Apollo industry to Bigin industry dropdown
 * @param {string} apolloIndustry - Industry from Apollo.io
 * @returns {string} - Industry for Bigin dropdown
 */
function mapIndustry(apolloIndustry) {
    if (!apolloIndustry) return '';

    // Check for direct match first
    if (INDUSTRY_MAPPING[apolloIndustry]) {
        return INDUSTRY_MAPPING[apolloIndustry];
    }

    // Try to find a partial match
    const industry = apolloIndustry.toLowerCase();

    // Check for partial matches in the keys
    for (const [key, value] of Object.entries(INDUSTRY_MAPPING)) {
        if (industry.includes(key.toLowerCase()) || key.toLowerCase().includes(industry)) {
            return value;
        }
    }

    // Default fallback
    return apolloIndustry;
}

/**
 * Extract last name from Apollo contact
 * @param {Object} apolloContact - Apollo.io contact data
 * @returns {string} - Last name
 */
function getLastName(apolloContact) {
    // Last name is required in Bigin, so we need to handle cases where it might be missing
    if (apolloContact.last_name) {
        return apolloContact.last_name;
    } else if (apolloContact.first_name) {
        // If no last name but first name exists, use first name as last name
        return apolloContact.first_name;
    } else if (apolloContact.email) {
        // If no names at all but email exists, extract name part from email
        const emailParts = apolloContact.email.split('@');
        return emailParts[0] || 'Unknown';
    } else {
        // Last resort
        return 'Unknown';
    }
}

/**
 * Generate a detailed description for the contact
 * @param {Object} apolloContact - Apollo.io contact data
 * @returns {string} - Formatted description
 */
function generateDescription(apolloContact) {
    let description = `Contact imported from Apollo.io on ${new Date().toISOString().split('T')[0]}.\n\n`;

    if (apolloContact.organization_name) {
        description += `Company: ${apolloContact.organization_name}\n`;
    }

    if (apolloContact.title) {
        description += `Title: ${apolloContact.title}\n`;
    }

    if (apolloContact.seniority) {
        description += `Seniority: ${apolloContact.seniority}\n`;
    }

    if (apolloContact.linkedin_url) {
        description += `LinkedIn: ${apolloContact.linkedin_url}\n`;
    }

    return description;
}

/**
 * Generate a detailed description for the organization
 * @param {Object} apolloOrg - Apollo.io organization data
 * @returns {string} - Formatted description
 */
function generateOrgDescription(apolloOrg) {
    let description = `Organization imported from Apollo.io on ${new Date().toISOString().split('T')[0]}.\n\n`;

    if (apolloOrg.website_url) {
        description += `Website: ${apolloOrg.website_url}\n`;
    }

    if (apolloOrg.industry) {
        description += `Industry: ${apolloOrg.industry}\n`;
    }

    if (apolloOrg.estimated_num_employees) {
        description += `Estimated Employees: ${apolloOrg.estimated_num_employees}\n`;
    }

    if (apolloOrg.linkedin_url) {
        description += `LinkedIn: ${apolloOrg.linkedin_url}\n`;
    }

    return description;
}

module.exports = {
    mapApolloContactToBigin,
    mapApolloOrgToBigin,
    mapIndustry
};