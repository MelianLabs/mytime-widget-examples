# MyTime Cloud9 Credit Card Integration

This directory contains an example application demonstrating how to integrate with MyTime's Public API and Cloud9 to manage credit cards. The application allows users to authenticate, add credit cards using Cloud9's secure iframe, view existing cards, and delete cards.

## Overview

The example application in `index.html` demonstrates a complete credit card management flow with the following features:

1. User authentication with MyTime API
2. Secure credit card entry using Cloud9 iframe
3. Credit card token processing and storage
4. Viewing saved credit cards
5. Deleting credit cards
6. Live-updating curl command examples

## Technologies Used

- **React**: For building the user interface
- **Axios**: For making API calls to MyTime's Public API
- **Tailwind CSS**: For styling the application with minimal custom CSS
- **Cloud9**: For secure credit card processing via iframe

## Cloud9 Environment Configuration

This example uses Cloud9's test environment by default. For production deployments, you must change the URL:

- **Test Environment**: `https://testvterm.c9pg.com/CreateCardToken`
- **Production Environment**: `https://vterm.c9pg.com/CreateCardToken`

To switch to the production environment, modify the `getIframeUrl` function in your code by setting `isProduction` to `true` or directly replacing the URL.

## How to Build a Similar Application

### 1. Set Up Your Project

Start with a basic HTML structure that includes the necessary dependencies:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Credit Card with Cloud9</title>
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

### 2. Create the React Application Structure

Set up your React application with the necessary state variables to track:

- Form data (base URL, company ID, email, password, partner API key)
- Authentication token
- User data
- Company data
- Cloud9 webseed data
- Credit cards
- Error and success messages
- Loading state
- curl command examples

```javascript
function App() {
    const [formData, setFormData] = React.useState({
        baseUrl: '',
        companyId: '',
        email: '',
        password: '',
        partnerApiKey: ''
    });
    const [authToken, setAuthToken] = React.useState('');
    const [userData, setUserData] = React.useState(null);
    const [companyData, setCompanyData] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [webseedData, setWebseedData] = React.useState(null);
    const [creditCards, setCreditCards] = React.useState([]);
    const [curlCommand, setCurlCommand] = React.useState('');
    const iframeRef = React.useRef(null);
    
    // Rest of your component...
}
```

### 3. Implement URL Parameter Handling

Add functionality to read URL parameters to pre-fill form fields:

```javascript
React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const baseUrl = params.get('base_url');
    const companyId = params.get('company_id');
    const partnerApiKey = params.get('partner_api_key');
    const email = params.get('email');
    const password = params.get('password');
    
    if (baseUrl || companyId || partnerApiKey || email || password) {
        setFormData(prev => ({
            ...prev,
            baseUrl: formatBaseUrl(baseUrl) || prev.baseUrl,
            companyId: companyId || prev.companyId,
            partnerApiKey: partnerApiKey || prev.partnerApiKey,
            email: email || prev.email,
            password: password || prev.password
        }));
        
        // If all required fields are present, auto-login
        if (baseUrl && companyId && email && password) {
            console.log('Auto-login with URL parameters');
            // Trigger login in the next render cycle
            setTimeout(() => {
                document.querySelector('button[type="submit"]').click();
            }, 500);
        }
    }
}, []);
```

### 4. Implement User Authentication

Create a function to handle user login and fetch necessary data:

```javascript
const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    setAuthToken('');
    setUserData(null);
    setCompanyData(null);
    setWebseedData(null);
    setCreditCards([]);

    // Validate form data
    if (!formData.baseUrl || !formData.companyId || !formData.email || !formData.password) {
        setError('All fields are required.');
        setLoading(false);
        return;
    }

    try {
        const baseUrl = formatBaseUrl(formData.baseUrl);
        
        // Login to get authentication token
        const loginResponse = await axios.post(
            `${baseUrl}/api/mkp/v1/sessions`,
            {
                email: formData.email,
                password: formData.password,
                company_id: parseInt(formData.companyId),
                recaptcha_token: null
            },
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (loginResponse.data && loginResponse.data.user && loginResponse.data.user.authentication_token) {
            const token = loginResponse.data.user.authentication_token;
            setAuthToken(token);
            setUserData(loginResponse.data.user);
            setCreditCards(loginResponse.data.user.credit_cards || []);
            setSuccess('Login successful!');
            
            // Fetch company data
            const companyResponse = await axios.get(
                `${baseUrl}/api/mkp/v1/companies/${formData.companyId}?include_external_locations=false&include_gc_templates=true&include_env_fees=true&include_parent_settings=false&include_scripts=true&include_subscription=true&include_custom_fields=false&include_intake_forms=false&include_consumer_app=false`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': token
                    }
                }
            );

            if (companyResponse.data && companyResponse.data.company) {
                setCompanyData(companyResponse.data.company);
                
                // Get webseed for Cloud9 iframe
                if (formData.partnerApiKey) {
                    const stripeAccountId = companyResponse.data.company.payment_account.id;
                    if (stripeAccountId) {
                        const webseedResponse = await axios.post(
                            `${baseUrl}/stripe_accounts/${stripeAccountId}/webseed?key=${formData.partnerApiKey}`
                        );
                        
                        if (webseedResponse.data) {
                            setWebseedData(webseedResponse.data);
                        }
                    } else {
                        setError('Company does not have a Stripe account configured');
                    }
                } else {
                    setError('Partner API Key is required to get webseed data');
                }
            }
        } else {
            throw new Error('Invalid login response');
        }
    } catch (err) {
        let errorMessage = 'Login failed';
        if (err.response && err.response.data) {
            errorMessage = JSON.stringify(err.response.data, null, 2);
        } else if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        console.error('API Error:', err);
    } finally {
        setLoading(false);
    }
};
```

### 5. Set Up Cloud9 Iframe Integration

Create functions to handle the Cloud9 iframe integration and message handling:

```javascript
// Store important values on window for access in the iframe message handler
React.useEffect(() => {
    // Create a namespace to avoid conflicts
    window.cloud9CreditCardApp = {
        getBaseUrl: () => formatBaseUrl(formData.baseUrl),
        getCompanyId: () => formData.companyId,
        getAuthToken: () => authToken
    };
    
    return () => {
        // Clean up when component unmounts
        delete window.cloud9CreditCardApp;
    };
}, [formData.baseUrl, formData.companyId, authToken]);

// Listen for messages from the iframe
React.useEffect(() => {
    window.addEventListener('message', handleIframeMessageEvent);
    return () => {
        window.removeEventListener('message', handleIframeMessageEvent);
    };
}, []);

const handleIframeMessageEvent = (event) => {
    const returnData = event.data;

    if (!returnData.Status && !returnData.ResponseText) {
        return null;
    }

    if (returnData.Status === 'success') {
        const creditCardParams = parseCloud9SuccessResponse({
            response: returnData,
            companyId: window.cloud9CreditCardApp.getCompanyId()
        });

        submitCreditCardHandler(creditCardParams);
    } else {
        setError(`Error from Cloud9: ${returnData.ResponseText || 'Unknown error'}`);
        setLoading(false);
    }
};

const parseCloud9SuccessResponse = ({ response, companyId }) => {
    const parsedData = {
        company_id: companyId,
        location_id: null,
        stripe_credit_card_token: response.CardToken,
        token_data: {
            funding: (response.Medium || '').toLowerCase(),
            brand: response.Brand,
            last4: (response.AccountNum || '').slice(-4),
            expDate: response.ExpDate,
            month: (response.ExpDate || '').substring(0, 2),
            year: '20' + (response.ExpDate || '').substring(2),
        },
        token2: response.CardToken,
        address_country: 'US', // Cloud9 forms are only for US clients
        add_to_client: true,
    };

    return parsedData;
};

const getIframeUrl = () => {
    if (!webseedData) return '';
    
    const stylingTemplate = "MyTime_SaveCard";
    
    // IMPORTANT: Environment Configuration
    // For test/development environments, use testvterm.c9pg.com
    // For production environments, use vterm.c9pg.com
    const isProduction = false; // Set to true for production environment
    const vtermURL = isProduction 
        ? "https://vterm.c9pg.com/CreateCardToken"
        : "https://testvterm.c9pg.com/CreateCardToken";
    
    return `${vtermURL}?Template=${stylingTemplate}&WebGMID=${webseedData.merchant_id}&SeedTime=${webseedData.timestamp}&Seed=${webseedData.seed}&GTID=${webseedData.terminal_id}&KeyIndex=${webseedData.key_index}&CallbackVersion=2.0`;
};
```

### 6. Implement Credit Card Submission

Create a function to handle credit card submission after receiving data from the Cloud9 iframe:

```javascript
const submitCreditCardHandler = async (creditCardParams) => {
    try {
        setLoading(true);
        
        // Get values from window object to ensure they're available in the iframe context
        const baseUrl = window.cloud9CreditCardApp.getBaseUrl();
        const authToken = window.cloud9CreditCardApp.getAuthToken();
        
        // Generate curl command for reference
        const curlCmd = `curl '${baseUrl}/api/mkp/v1/user/credit_cards' \\
  -H 'Accept: application/json' \\
  -H 'Authorization: ${authToken}' \\
  --data-raw '${JSON.stringify(creditCardParams)}'`;
        
        setCurlCommand(curlCmd);

        const response = await axios.post(
            `${baseUrl}/api/mkp/v1/user/credit_cards`,
            creditCardParams,
            {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': authToken
                }
            }
        );

        if (response.status === 201 || response.status === 200) {
            setSuccess('Credit card added successfully!');
            // Refresh user data to show the new card
            fetchUserData();
        } else {
            throw new Error('Unexpected response status: ' + response.status);
        }
    } catch (err) {
        let errorMessage = 'Failed to add credit card';
        if (err.response && err.response.data) {
            errorMessage = JSON.stringify(err.response.data, null, 2);
        } else if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        console.error('API Error:', err);
    } finally {
        setLoading(false);
    }
};
```

### 7. Implement Credit Card Deletion

Create a function to handle credit card deletion:

```javascript
const handleDeleteCard = async (cardId) => {
    try {
        setLoading(true);
        setError(null);
        
        // Get values from window object
        const baseUrl = window.cloud9CreditCardApp.getBaseUrl();
        const companyId = window.cloud9CreditCardApp.getCompanyId();
        const authToken = window.cloud9CreditCardApp.getAuthToken();
        
        // Generate curl command for reference
        const curlCmd = `curl '${baseUrl}/api/mkp/v1/user/payment_methods/${cardId}?company_id=${companyId}&payment_type=card&_method=delete' \\
  -X 'DELETE' \\
  -H 'Accept: application/json' \\
  -H 'Authorization: ${authToken}' \\
  -H 'Content-Type: application/json'`;
        
        setCurlCommand(curlCmd);
        
        const response = await axios.delete(
            `${baseUrl}/api/mkp/v1/user/payment_methods/${cardId}?company_id=${companyId}&payment_type=card`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.status === 200 || response.status === 204) {
            // Find the card without using optional chaining
            const card = creditCards.find(card => card.id === cardId);
            const last4 = card && card.last4 ? card.last4 : 'xxxx';
            setSuccess(`Card ending in ${last4} was successfully removed`);
            // Refresh user data to update the cards list
            fetchUserData();
        } else {
            throw new Error('Unexpected response status: ' + response.status);
        }
    } catch (err) {
        let errorMessage = 'Failed to remove credit card';
        if (err.response && err.response.data) {
            errorMessage = JSON.stringify(err.response.data, null, 2);
        } else if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        console.error('API Error:', err);
    } finally {
        setLoading(false);
    }
};
```

### 8. Build the User Interface

Create a responsive UI using Tailwind CSS with components for:

- Login form with API credentials
- Cloud9 iframe for credit card entry
- Credit card listing with delete functionality
- User information display
- Error and success messages
- API request examples (curl commands)

## API Endpoints Used

1. **User Authentication**
   - `POST /api/mkp/v1/sessions` - Authenticate user and get token

2. **Company Data**
   - `GET /api/mkp/v1/companies/{company_id}` - Get company information

3. **Cloud9 Integration**
   - `POST /stripe_accounts/{stripe_account_id}/webseed?key={partner_api_key}` - Get Cloud9 webseed data

4. **Credit Card Management**
   - `POST /api/mkp/v1/users/{user_id}/credit_cards` - Add a credit card
   - `DELETE /api/mkp/v1/users/{user_id}/credit_cards/{card_id}` - Delete a credit card

## Cloud9 Integration Benefits

1. **PCI Compliance** - Credit card data is entered directly into Cloud9's secure iframe
2. **Tokenization** - Credit card details are converted to a secure token
3. **Secure Transmission** - Sensitive data is never exposed to your application

The integration flow works as follows:

1. Authenticate with MyTime API to get an authentication token
2. Fetch company data to get the Stripe account ID
3. Get Cloud9 webseed data using the Stripe account ID and partner API key
4. Load the Cloud9 iframe with the webseed data
5. User enters credit card details in the iframe
6. Cloud9 returns a token via postMessage
7. Submit the token to MyTime API to save the credit card

## Testing the Application

To test the application:

1. Open the `index.html` file in a web browser
2. Provide the base URL, company ID, partner API key, email, and password (or pass them as URL parameters)
3. Log in to authenticate with the MyTime API
4. Use the Cloud9 iframe to enter credit card details
5. View and manage saved credit cards

## URL Parameters

The application supports the following URL parameters:

- `base_url`: The base URL for the MyTime API
- `company_id`: The ID of the company
- `partner_api_key`: The partner API key for authentication (see security note below)
- `email`: The user's email address
- `password`: The user's password

Example: `index.html?base_url=https://api.mytime.com&company_id=12345&email=user@example.com&password=yourpassword`

## Security Considerations

### Protecting the Partner API Key

**IMPORTANT:** The partner API key should never be exposed in your frontend code. Including it directly in your JavaScript or as a URL parameter poses a serious security risk as it could be extracted and misused by malicious actors.

#### Recommended Implementation

1. **Create a Backend API Endpoint**
   - Develop a secure backend service/API that will act as an intermediary between your frontend and the MyTime API
   - Store your partner API key securely on your backend (e.g., in environment variables or a secure key management system)

2. **Backend Implementation**
   - Your backend should receive requests from your frontend application
   - Use the securely stored partner API key to make the webseed API call to MyTime
   - Return only the necessary data to your frontend

   ```javascript
   // Example backend code (Node.js/Express)
   app.post('/api/get-webseed', authenticate, async (req, res) => {
     try {
       const { baseUrl, stripeAccountId } = req.body;
       
       // Partner API key stored securely in environment variables
       const partnerApiKey = process.env.MYTIME_PARTNER_API_KEY;
       
       const response = await axios.post(
         `${baseUrl}/stripe_accounts/${stripeAccountId}/webseed?key=${partnerApiKey}`
       );
       
       // Return only the necessary data to the frontend
       res.json(response.data);
     } catch (error) {
       res.status(500).json({ error: 'Failed to get webseed data' });
     }
   });
   ```

3. **Frontend Implementation**
   - Your frontend should call your secure backend API instead of directly calling the MyTime API with the partner API key
   
   ```javascript
   // Instead of this (insecure):
   const webseedResponse = await axios.post(
     `${baseUrl}/stripe_accounts/${stripeAccountId}/webseed?key=${partnerApiKey}`
   );
   
   // Do this (secure):
   const webseedResponse = await axios.post(
     '/api/get-webseed',
     { baseUrl, stripeAccountId }
   );
   ```

4. **Additional Security Measures**
   - Implement proper authentication on your backend API to prevent unauthorized access
   - Consider using CSRF protection for your API endpoints
   - Implement rate limiting to prevent abuse
   - Consider using reCAPTCHA or similar services to prevent automated attacks
   - Use HTTPS for all communications

## Best Practices

1. Always handle API errors gracefully and display user-friendly error messages
2. Use secure methods for handling credit card data (like Cloud9's iframe)
3. Validate user inputs before making API calls
4. Store authentication tokens securely
5. Implement proper error handling for all API calls
6. Use responsive design for better mobile experience
7. Provide clear feedback to users about the success or failure of their actions
