# MyTime ACH Setup Integration

This directory contains an example application demonstrating how to integrate with MyTime's Public API to set up ACH payment processing. The application allows users to authenticate, create client records, generate ACH access tokens, and automatically open the ACH widget for bank account setup.

## Overview

The example application in `index.html` demonstrates a complete ACH setup flow with the following features:

1. User authentication with MyTime API
2. Automatic client record creation
3. ACH access token generation
4. Company data fetching with ACH widget configuration
5. Automatic ACH widget opening in new tab
6. Manual ACH widget access controls
7. URL parameter support for easy integration

## Technologies Used

- **React**: For building the user interface
- **Axios**: For making API calls to MyTime's Public API
- **Tailwind CSS**: For styling the application with minimal custom CSS

## How to Build a Similar Application

### 1. Set Up Your Project

Start with a basic HTML structure that includes the necessary dependencies:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyTime ACH Setup</title>
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

- Form data (base URL, company ID, email, password)
- Authentication token and user data
- Client ID from client record creation
- Company data with ACH widget configuration
- ACH access token
- Error and success messages
- Loading states

```javascript
function App() {
    const [formData, setFormData] = React.useState({
        baseUrl: '',
        companyId: '',
        email: '',
        password: ''
    });
    const [error, setError] = React.useState('');
    const [successMessage, setSuccessMessage] = React.useState('');
    const [authToken, setAuthToken] = React.useState('');
    const [userData, setUserData] = React.useState(null);
    const [clientId, setClientId] = React.useState('');
    const [accessToken, setAccessToken] = React.useState('');
    const [companyData, setCompanyData] = React.useState(null);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isGeneratingToken, setIsGeneratingToken] = React.useState(false);
    
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
    const email = params.get('email');
    const password = params.get('password');
    
    const newFormData = {};
    if (baseUrl) newFormData.baseUrl = baseUrl;
    if (companyId) newFormData.companyId = companyId;
    if (email) newFormData.email = email;
    if (password) newFormData.password = password;
    
    if (Object.keys(newFormData).length > 0) {
        setFormData(prev => ({
            ...prev,
            ...newFormData
        }));
    }
}, []);
```

### 4. Implement User Authentication

Create a function to handle user login:

```javascript
const handleLogin = async (baseUrl, email, password, companyId) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
        const baseUrlWithoutTrailingSlash = baseUrl.replace(/\/$/, '');
        
        const loginResponse = await axios.post(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/sessions`,
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
        
        if (loginResponse.data && loginResponse.data.user && loginResponse.data.user.authentication_token) {
            const token = loginResponse.data.user.authentication_token;
            setAuthToken(token);
            setUserData(loginResponse.data.user);
            setIsLoggedIn(true);
            
            // Continue with company data fetching and client record creation
            return token;
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
        console.error('Login Error:', err);
        return null;
    } finally {
        setIsLoading(false);
    }
};
```

### 5. Fetch Company Data

After successful login, fetch company data to get ACH widget configuration:

```javascript
// Fetch company data
try {
    const companyResponse = await axios.get(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/companies/${companyId}?include_external_locations=false&include_gc_templates=true&include_env_fees=true&include_parent_settings=false&include_scripts=true&include_subscription=true&include_custom_fields=false&include_intake_forms=false&include_consumer_app=false`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': token
            }
        }
    );

    if (companyResponse.data && companyResponse.data.company) {
        setCompanyData(companyResponse.data.company);
        console.log('Company data fetched:', companyResponse.data.company);
    }
} catch (companyErr) {
    console.error('Error fetching company data:', companyErr);
    // Don't fail the login process if company data fetch fails
}
```

### 6. Create Client Record

Implement client record creation to get a client ID:

```javascript
const createClientRecord = async (token, companyId, baseUrl) => {
    try {
        const baseUrlWithoutTrailingSlash = baseUrl.replace(/\/$/, '');
        const response = await axios.put(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/user/client`,
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
        console.log('Client record created successfully:', response.data);
        
        // Extract client ID from response
        if (response.data && response.data.client && response.data.client.id) {
            setClientId(response.data.client.id);
            return response.data.client.id;
        }
        return null;
    } catch (err) {
        console.error('Error creating client record:', err);
        throw err;
    }
};
```

### 7. Generate ACH Access Token

Create a function to generate the ACH access token:

```javascript
const generateACHAccessToken = async (baseUrl, companyId, clientId, token) => {
    setIsGeneratingToken(true);
    setError('');
    
    try {
        const baseUrlWithoutTrailingSlash = baseUrl.replace(/\/$/, '');
        const response = await axios.get(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/ach/generate_access_token`,
            {
                params: {
                    company_id: companyId,
                    client_id: clientId
                },
                headers: {
                    'Accept': 'application/json',
                    'Authorization': token
                }
            }
        );
        
        console.log('ACH Access Token Response:', response.data);
        
        if (response.data && response.data.access_token) {
            setAccessToken(response.data.access_token);
            setSuccessMessage('ACH access token generated successfully!');
            
            // If company data has ach_widget_base_url, open the widget
            if (companyData && companyData.ach_widget_base_url) {
                const widgetUrl = `${companyData.ach_widget_base_url}?access_token=${response.data.access_token}`;
                window.open(widgetUrl, '_blank');
            }
            
            return response.data.access_token;
        } else {
            throw new Error('No access token in response');
        }
    } catch (err) {
        console.error('Error generating ACH access token:', err);
        let errorMessage = 'Failed to generate ACH access token';
        if (err.response && err.response.data) {
            errorMessage = JSON.stringify(err.response.data, null, 2);
        } else if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        throw err;
    } finally {
        setIsGeneratingToken(false);
    }
};
```

### 8. Implement ACH Widget Opening

Create a function to manually open the ACH widget:

```javascript
const handleOpenACHWidget = () => {
    if (companyData && companyData.ach_widget_base_url && accessToken) {
        const widgetUrl = `${companyData.ach_widget_base_url}?access_token=${accessToken}`;
        window.open(widgetUrl, '_blank');
    } else {
        setError('Missing ACH widget URL or access token. Please ensure company data is loaded and token is generated.');
    }
};
```

### 9. Complete Integration Flow

Put it all together in the login handler:

```javascript
// After successful login
try {
    // Fetch company data first
    const companyData = await fetchCompanyData(token, companyId, baseUrl);
    
    // Create client record
    const clientId = await createClientRecord(token, companyId, baseUrl);
    
    if (clientId) {
        setSuccessMessage('Login successful! Client record created.');
        // Automatically generate ACH access token
        await generateACHAccessToken(baseUrl, companyId, clientId, token);
    } else {
        setSuccessMessage('Login successful! Warning: Could not extract client ID.');
    }
} catch (clientErr) {
    console.error('Client record creation failed:', clientErr);
    setError('Login successful but client record creation failed: ' + clientErr.message);
}
```

### 10. Build the User Interface

Create a responsive UI using Tailwind CSS with components for:

- Login form with URL parameter hints
- User information display after login
- Company information with ACH widget URL
- ACH access token display with copy functionality
- Manual ACH widget opening button
- Error and success message displays
- Instructions for usage

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mkp/v1/sessions` | POST | Authenticate user and get authentication token |
| `/api/mkp/v1/companies/{company_id}` | GET | Fetch company data including ACH widget configuration |
| `/api/mkp/v1/user/client` | PUT | Create or update client record to get client ID |
| `/api/mkp/v1/ach/generate_access_token` | GET | Generate ACH access token for widget authentication |

## ACH Integration Flow

The complete ACH setup flow works as follows:

1. **User Authentication** - User logs in with email/password to get authentication token
2. **Company Data Fetching** - Retrieve company configuration including `ach_widget_base_url`
3. **Client Record Creation** - Create/update client record to get a `client_id`
4. **Access Token Generation** - Generate ACH access token using company_id and client_id
5. **Widget Opening** - Automatically open ACH widget with access token parameter
6. **Manual Control** - Provide buttons for regenerating tokens and reopening widget

## Testing the Application

To test the application:

1. Open the `index.html` file in a web browser
2. Provide the base URL, company ID, email, and password (or pass them as URL parameters)
3. Click "Sign In & Setup ACH" to authenticate and set up ACH
4. The system will automatically:
   - Log you in
   - Fetch company data
   - Create a client record
   - Generate an ACH access token
   - Open the ACH widget in a new tab (if configured)
5. Use the "Regenerate Token" or "Open ACH Widget" buttons as needed

## URL Parameters

The application supports the following URL parameters:

- `base_url`: The base URL for the MyTime API
- `company_id`: The ID of the company
- `email`: The user's email address
- `password`: The user's password (not recommended for security reasons)

Example: `index.html?base_url=https://www.mytime.com&company_id=12345&email=user@example.com`

## Security Considerations

### Password Handling

**IMPORTANT:** Passing passwords via URL parameters is not recommended for production use as it poses security risks:

1. **URL Logging** - Passwords may be logged in browser history, server logs, or analytics
2. **Referrer Headers** - Passwords may be exposed in HTTP referrer headers
3. **Shoulder Surfing** - Passwords are visible in the address bar

#### Recommended Implementation

For production applications:

1. **Always use HTTPS** to encrypt data in transit
2. **Implement proper authentication flow** with secure password handling
3. **Use environment variables** or secure configuration for sensitive data
4. **Consider OAuth or similar secure authentication methods**
5. **Implement session management** with proper token expiration

### ACH Widget Security

The ACH widget integration provides several security benefits:

1. **Secure Token-Based Access** - Access tokens are time-limited and scope-specific
2. **Isolated Widget Environment** - Bank account entry happens in a secure, isolated widget
3. **No Sensitive Data Storage** - Your application never handles raw bank account details
4. **Audit Trail** - All ACH setup activities are logged and auditable

## Best Practices

1. **Error Handling** - Always handle API errors gracefully and display user-friendly error messages
2. **Loading States** - Use loading indicators during API calls to improve user experience
3. **Input Validation** - Validate user inputs before making API calls
4. **Token Management** - Store authentication tokens securely and handle expiration
5. **Responsive Design** - Use responsive design for better mobile experience
6. **User Feedback** - Provide clear feedback about the success or failure of operations
7. **Security** - Never expose sensitive credentials in client-side code
8. **Accessibility** - Ensure the application is accessible to users with disabilities

## Troubleshooting

### Common Issues

1. **Missing ACH Widget URL** - Ensure the company has `ach_widget_base_url` configured
2. **Authentication Failures** - Verify credentials and company ID are correct
3. **Client Record Creation Fails** - Check that the user has proper permissions
4. **Access Token Generation Fails** - Ensure client_id and company_id are valid
5. **Widget Won't Open** - Check browser popup blockers and CORS settings

### Debug Tips

1. Check browser console for detailed error messages
2. Verify all required parameters are provided
3. Test with different user accounts to isolate permission issues
4. Ensure the company is properly configured for ACH processing
5. Contact MyTime support if integration issues persist

## Integration Examples

### Basic Integration

```javascript
// Minimal integration example
const achSetup = async (baseUrl, companyId, email, password) => {
    // 1. Login
    const token = await login(baseUrl, email, password, companyId);
    
    // 2. Create client record
    const clientId = await createClientRecord(token, companyId, baseUrl);
    
    // 3. Generate access token
    const accessToken = await generateACHAccessToken(baseUrl, companyId, clientId, token);
    
    // 4. Open ACH widget
    const widgetUrl = `${companyData.ach_widget_base_url}?access_token=${accessToken}`;
    window.open(widgetUrl, '_blank');
};
```

### Advanced Integration with Error Handling

```javascript
// Advanced integration with comprehensive error handling
const advancedACHSetup = async (config) => {
    try {
        const { baseUrl, companyId, email, password } = config;
        
        // Validate inputs
        if (!baseUrl || !companyId || !email || !password) {
            throw new Error('Missing required configuration');
        }
        
        // Step 1: Authenticate
        const loginResult = await authenticateUser(baseUrl, email, password, companyId);
        if (!loginResult.success) {
            throw new Error(`Authentication failed: ${loginResult.error}`);
        }
        
        // Step 2: Fetch company data
        const companyResult = await fetchCompanyData(baseUrl, companyId, loginResult.token);
        if (!companyResult.success || !companyResult.data.ach_widget_base_url) {
            throw new Error('Company not configured for ACH processing');
        }
        
        // Step 3: Create client record
        const clientResult = await createClientRecord(loginResult.token, companyId, baseUrl);
        if (!clientResult.success) {
            throw new Error(`Client record creation failed: ${clientResult.error}`);
        }
        
        // Step 4: Generate access token
        const tokenResult = await generateACHAccessToken(
            baseUrl, 
            companyId, 
            clientResult.clientId, 
            loginResult.token
        );
        if (!tokenResult.success) {
            throw new Error(`Access token generation failed: ${tokenResult.error}`);
        }
        
        // Step 5: Open widget
        const widgetUrl = `${companyResult.data.ach_widget_base_url}?access_token=${tokenResult.accessToken}`;
        window.open(widgetUrl, '_blank');
        
        return {
            success: true,
            accessToken: tokenResult.accessToken,
            clientId: clientResult.clientId,
            widgetUrl: widgetUrl
        };
        
    } catch (error) {
        console.error('ACH setup failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
```

This comprehensive guide should help you build a robust ACH setup integration with MyTime's API while following security best practices and providing a great user experience.