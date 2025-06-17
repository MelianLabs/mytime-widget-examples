# MyTime Membership Purchase Application

This directory contains an example application demonstrating how to integrate with MyTime's Public API to create a membership purchase flow. The application allows users to authenticate, browse available memberships, add them to cart, and complete the purchase with a payment method token.

## Overview

The example application in `index.html` demonstrates a complete membership purchase flow with the following steps:

1. User authentication (login)
2. Company and location selection
3. Membership browsing
4. Adding memberships to cart
5. Completing purchase with a payment method token

## Technologies Used

- **React**: For building the user interface
- **Axios**: For making API calls to MyTime's Public API
- **Tailwind CSS**: For styling the application

## How to Build a Similar Application

### 1. Set Up Your Project

Start with a basic HTML structure that includes the necessary dependencies:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Memberships</title>
    <!-- React and ReactDOM from CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <!-- Babel for JSX -->
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <!-- Axios for API calls -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-6">
    <div id="root"></div>
    <!-- Your React code will go here -->
</body>
</html>
```

### 2. API Endpoints Used

The application interacts with the following MyTime Public API endpoints:

- **Get Company Data**: `GET /api/mkp/v1/companies/{company_id}`
- **Get Locations**: `GET /api/mkp/v1/companies/{company_id}/locations`
- **Get Memberships**: `GET /api/mkp/v1/companies/{company_id}/memberships?location_id={location_id}&only_clients=false`
- **Create Membership Purchase**: `POST /api/mkp/v1/membership_purchases`
- **Complete Membership Purchase**: `POST /api/mkp/v1/membership_purchases/{membership_purchase_id}/complete`

### 3. Key Implementation Details

#### Authentication

Users can authenticate by providing their email and password. The application handles the login process and stores the authentication token for subsequent API calls.

#### Membership Purchase Flow

1. **Location Selection**: Users select a location to view available memberships
2. **Membership Selection**: Users can view membership details and add them to cart
3. **Checkout**: Users complete the purchase by providing a payment method token

#### Error Handling

The application includes error handling for API calls and displays user-friendly error messages.

## Running the Example

1. Open `index.html` in a web browser
2. Enter your MyTime API base URL and company ID
3. Log in with your credentials (or skip if not required)
4. Select a location to view available memberships
5. Click "Purchase Membership" to add a membership to your cart
6. Enter a payment method token and complete the purchase

## Required Environment Variables

You can set the following URL parameters to pre-fill the form:

- `base_url`: The base URL of the MyTime API (e.g., `http://localhost:3000`)
- `company_id`: The ID of the company
- `email`: Pre-fills the email field
- `password`: Pre-fills the password field

## Example API Calls

### Create a Membership Purchase

```javascript
const handleAddToCart = async (baseUrl, authToken, membershipTemplateId, locationId) => {
    try {
        const response = await axios.post(
            `${baseUrl}/api/mkp/v1/membership_purchases`,
            { 
                membership_template_id: membershipTemplateId, 
                location_id: locationId 
            },
            { 
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': authToken
                } 
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error adding membership to cart:', error);
        throw error;
    }
};
```

### Complete a Membership Purchase

```javascript
const completePurchase = async (baseUrl, authToken, membershipPurchaseId, cardId, locationId) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.post(
            `${baseUrl}/api/mkp/v1/membership_purchases/${membershipPurchaseId}/complete`,
            {
                token: cardId,
                payment_method: 'card',
                location_id: locationId,
                start_date: today
            },
            { 
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': authToken
                } 
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error completing purchase:', error);
        throw error;
    }
};
```

## Troubleshooting

- **Authentication Errors**: Ensure you have valid credentials and the correct base URL
- **CORS Issues**: Make sure the API server is configured to accept requests from your domain
- **Invalid Data**: Verify that all required fields are provided in the correct format

## License

This example is provided as-is under the MIT License.
