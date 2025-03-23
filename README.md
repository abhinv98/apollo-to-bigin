# Apollo.io and Bigin Integration Project

This project integrates Apollo.io and Bigin CRM platforms to enhance sales and customer relationship management capabilities.

## About the Platforms

### Apollo.io
Apollo.io is a B2B sales intelligence and engagement platform that provides access to a database of over 210 million contacts and 35 million companies. Key features include:

- **Contact & Account Search**: Find prospects with accurate business data
- **Sales Engagement**: Automate outbound communication across multiple channels
- **Data Enrichment**: Access detailed contact information and company insights
- **Pipeline Building**: Identify and engage with qualified leads
- **Analytics**: Track performance and optimize sales processes

Apollo.io's API allows you to programmatically access its database, enrich contact information, and integrate with your existing sales tools.

### Bigin by Zoho
Bigin is a simple CRM solution designed specifically for small businesses. It offers:

- **Pipeline Management**: Track deals and visualize sales processes
- **Customer Management**: Organize contact information and interactions
- **Multichannel Communication**: Connect with customers through various channels
- **Automation**: Streamline repetitive tasks with workflow automation
- **Integrations**: Connect with other business applications

Bigin provides REST APIs, Metadata APIs, Bulk APIs, and Notification APIs for integration with other platforms.

## Project Purpose

This project aims to leverage the strengths of both platforms by:

1. Retrieving contact and company data from Apollo.io
2. Enriching lead information with Apollo.io's extensive database
3. Managing customer relationships through Bigin's intuitive CRM
4. Automating workflows between the two platforms

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone this repository
```
git clone <repository-url>
cd apollo-bigin-integration
```

2. Install dependencies
```
npm install
```

3. Configure environment variables in `.env` file
```
# Apollo.io credentials
APOLLO_API_KEY=your_apollo_api_key_here

# Bigin/Zoho credentials
BIGIN_ACCESS_TOKEN=your_bigin_access_token_here
BIGIN_REFRESH_TOKEN=your_bigin_refresh_token_here
BIGIN_CLIENT_ID=your_bigin_client_id_here
BIGIN_CLIENT_SECRET=your_bigin_client_secret_here
```

### Apollo.io Configuration
- [Apollo.io API Documentation](https://docs.apollo.io/docs/api-overview)
- API scopes supported: contact search, contact enrichment, organization search

### Bigin Configuration
- Client ID: `1000.8ZOFG7GREQEJ90WPATJ7WAV5PJM5FI`
- Client Secret: `a26717f1e0ed89c01de5b382da831517453f9930bb`
- API Domain: `https://www.zohoapis.com/bigin/v1`
- API scopes supported: ZohoBigin.modules.ALL, ZohoBigin.settings.ALL

## Available Functions

The integration provides the following functionality:

### Apollo.io
- `searchApolloContacts(searchParams)`: Search for contacts in Apollo.io
- `enrichContactWithApollo(contactInfo)`: Enrich contact data with Apollo.io

### Bigin
- `refreshBiginToken()`: Refresh Bigin access token
- `getBiginContacts()`: Get contacts from Bigin
- `createBiginContact(contactData)`: Create contact in Bigin
- `getBiginAccounts()`: Get accounts/companies from Bigin
- `createBiginAccount(accountData)`: Create account/company in Bigin

### Integration
- `syncApolloContactToBigin(apolloContact)`: Sync Apollo contact to Bigin

## Running the Application

To run the sample integration demo:

```
npm start
```

This will execute the app.js file, which demonstrates the integration between Apollo.io and Bigin.

## Security Notice

⚠️ **Important**: Configure your .env file with your API keys and tokens. Never commit sensitive credentials to version control. This project is for development purposes only.

## License

[MIT License](LICENSE)

## Contact

[Your contact information] 