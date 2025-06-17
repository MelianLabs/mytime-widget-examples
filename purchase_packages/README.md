# MyTime Package Purchase Application

This directory contains an example application demonstrating how to integrate with MyTime's Public API to create a package purchase flow. The application allows users to authenticate, browse available packages (bundles), add them to cart, and complete the purchase with a card ID.

## Overview

The example application in `index.html` demonstrates a complete package purchase flow with the following steps:

1. User authentication (login)
2. Client record creation
3. Company and location selection
4. Package browsing
5. Adding packages to cart
6. Completing purchase with a card ID

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
    <title>Purchase Packages</title>
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

### 2. Implement User Authentication

Create a login form that allows users to authenticate with their email and password:

```jsx
const handleLogin = async (baseUrl, email, password, companyId) => {
    try {
        const loginResponse = await axios.post(
            `${baseUrl}/api/mkp/v1/sessions`,
            {
                email: email,
                password: password,
                company_id: parseInt(companyId),
                recaptcha_token: null
            },
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        // Extract authentication token
        const token = loginResponse.data.user.authentication_token;
        return token;
    } catch (err) {
        console.error('Login error:', err);
        return null;
    }
};
```

### 3. Create Client Record

After successful login, create a client record for the user:

```jsx
const createClientRecord = async (token, companyId, baseUrl) => {
    try {
        await axios.put(
            `${baseUrl}/api/mkp/v1/user/client`,
            {
                company_id: parseInt(companyId),
                client: {
                    preferred_language: "en-US"
                }
            },
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            }
        );
        return true;
    } catch (err) {
        console.error('Error creating client record:', err);
        return false;
    }
};
```

### 4. Fetch Company and Location Data

Retrieve company information and available locations:

```jsx
const fetchCompanyData = async (baseUrl, companyId) => {
    try {
        const companyResponse = await axios.get(
            `${baseUrl}/api/mkp/v1/companies/${companyId}`
        );
        
        const locationsResponse = await axios.get(
            `${baseUrl}/api/mkp/v1/companies/${companyId}/locations`
        );
        
        return {
            company: companyResponse.data,
            locations: locationsResponse.data
        };
    } catch (err) {
        console.error('Error fetching company data:', err);
        return null;
    }
};
```

### 5. Fetch Available Packages

Retrieve available packages (bundles) for the selected company:

```jsx
const fetchPackages = async (baseUrl, companyId) => {
    try {
        const response = await axios.get(
            `${baseUrl}/api/mkp/v1/companies/${companyId}/bundles`
        );
        return response.data;
    } catch (err) {
        console.error('Error fetching packages:', err);
        return [];
    }
};
```

### 6. Add Package to Cart

Implement functionality to add a package to the cart:

```jsx
const handleAddToCart = async (baseUrl, authToken, bundleId, locationId) => {
    try {
        const response = await axios.post(
            `${baseUrl}/api/mkp/v1/bundle_purchases`,
            { bundle_id: bundleId, location_id: locationId },
            { 
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': authToken
                } 
            }
        );
        return response.data;
    } catch (err) {
        console.error('Error adding bundle to cart:', err);
        return null;
    }
};
```

### 7. Complete Purchase

Implement functionality to complete the purchase with a card ID:

```jsx
const completePurchase = async (baseUrl, authToken, bundlePurchaseId, cardId) => {
    try {
        const response = await axios.post(
            `${baseUrl}/api/mkp/v1/bundle_purchases/complete_purchases`,
            {
                bundle_purchase_ids: [bundlePurchaseId],
                card_id: cardId,
                payment_intent: {}
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
    } catch (err) {
        console.error('Error completing purchase:', err);
        return null;
    }
};
```

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mkp/v1/sessions` | POST | Authenticate user and get token |
| `/api/mkp/v1/user/client` | PUT | Create client record |
| `/api/mkp/v1/companies/:companyId` | GET | Fetch company information |
| `/api/mkp/v1/companies/:companyId/locations` | GET | Fetch locations for a company |
| `/api/mkp/v1/companies/:companyId/bundles` | GET | Fetch packages (bundles) for a company |
| `/api/mkp/v1/bundle_purchases` | POST | Add a package to cart |
| `/api/mkp/v1/bundle_purchases/complete_purchases` | POST | Complete purchase with card ID |

## Additional Features

- **URL Parameter Support**: The application supports pre-filling the base URL and company ID via URL parameters (`base_url` and `company_id`).
- **Error Handling**: Comprehensive error handling for API calls with user-friendly messages.
- **Authentication State Management**: Manages user authentication state and token storage.
- **Responsive UI**: Built with Tailwind CSS for a responsive and clean user interface.

## Notes

This example is designed to demonstrate the integration with MyTime's Public API for package purchases. In a production environment, you would want to implement additional security measures and possibly use a more robust state management solution.
