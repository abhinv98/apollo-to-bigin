# Apollo.io to Bigin Field Mapping Reference

This document provides a reference for mapping fields between Apollo.io and Bigin based on the API responses.

## Apollo.io Contact Fields

Based on the API response, these are the key fields in Apollo.io contacts:

| Apollo.io Field | Description | Example Value |
|-----------------|-------------|---------------|
| id | Unique identifier | 638619d1a0e38f0001291a5c |
| first_name | First name | Brady |
| last_name | Last name | Wentlandt |
| email | Email address | email@example.com |
| title | Job title | Vice President of Business Development |
| organization_name | Company name | Viderity Inc. |
| phone_number | Primary phone | +1 123-456-7890 |
| city | City location | Huddleston |
| state | State location | Virginia |
| country | Country location | United States |
| linkedin_url | LinkedIn profile URL | http://www.linkedin.com/in/profile |
| twitter_url | Twitter profile URL | https://twitter.com/username |
| seniority | Seniority level | vp |
| functions | Job functions | ["business_development"] |
| departments | Departments | ["master_sales"] |
| subdepartments | Sub-departments | ["business_development"] |

## Bigin Contact Fields

Based on the field mapping code, these are the key fields in Bigin contacts:

| Bigin Field | Description | Mapped from Apollo |
|-------------|-------------|-------------------|
| Last_Name | Last name (required) | apollo.last_name |
| First_Name | First name | apollo.first_name |
| Email | Email address | apollo.email |
| Phone | Phone number | apollo.phone_number or apollo.corporate_phone |
| Title | Job title | apollo.title |
| Industry_Drop | Industry dropdown | Mapped via INDUSTRY_MAPPING |
| Lead_Source | Source of lead | "Apollo.io" (hardcoded) |
| Description | Contact description | Generated from apollo fields |
| Account_Name | Company name reference | { name: apollo.organization_name } |
| Mailing_City | City for mailing | apollo.city |
| Mailing_State | State for mailing | apollo.state |
| Mailing_Country | Country for mailing | apollo.country |
| LinkedIn | LinkedIn URL | apollo.linkedin_url |
| Twitter | Twitter URL | apollo.twitter_url |

## Bigin Account Fields

Based on the field mapping code, these are the key fields in Bigin accounts:

| Bigin Field | Description | Mapped from Apollo |
|-------------|-------------|-------------------|
| Account_Name | Account/company name | apollo.organization_name |
| Website | Website URL | apollo.organization.website_url |
| Industry | Industry category | Mapped via INDUSTRY_MAPPING |
| Phone | Phone number | apollo.organization.phone |
| Description | Organization description | Generated from apollo fields |
| Billing_City | City for billing | apollo.organization.city |
| Billing_State | State for billing | apollo.organization.state |
| Billing_Country | Country for billing | apollo.organization.country |
| Employees | Employee count | apollo.organization.estimated_num_employees |
| Annual_Revenue | Annual revenue | Converted from apollo.organization.annual_revenue |

## Industry Mapping

The integration maps Apollo.io industry values to Bigin's dropdown values with the following logic:

1. Check for direct match in the INDUSTRY_MAPPING object
2. If not found, try to find a partial match by comparing lowercased strings
3. If no match is found, use the original Apollo industry value

Examples of direct mappings:
- "Software" → "Software"
- "Information Technology" → "Technology" 
- "SaaS" → "Software"
- "Finance" → "Financial Services" 