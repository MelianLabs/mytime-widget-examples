# MyTime Stripe Credit Card Management Application

This directory contains an example application demonstrating how to integrate with MyTime's Public API and Stripe to manage credit cards. The application allows users to authenticate, add credit cards using Stripe Elements, view existing cards, and delete cards.

## Overview

The example application in `index.html` demonstrates a complete credit card management flow with the following features:

1. User authentication with MyTime API
2. Secure credit card entry using Stripe Elements
3. Credit card token processing and storage
4. Viewing saved credit cards
5. Deleting credit cards
6. Support for URL parameters to pre-fill login credentials

## Technologies Used

- **React**: For building the user interface
- **Axios**: For making API calls to MyTime's Public API
- **Tailwind CSS**: For styling the application with minimal custom CSS
- **Stripe.js**: For secure payment processing with Stripe Elements

## How to Build a Similar Application

### 1. Set Up Your Project

Start with a basic HTML structure that includes the necessary dependencies:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Cards</title>
    <!-- React and ReactDOM from CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <!-- Babel for JSX -->
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <!-- Axios for API calls -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <!-- Stripe.js -->
    <script src="https://js.stripe.com/v3/"></script>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <!-- Your React code will go here -->
</body>
</html>
```

### 2. Create the React Application Structure

Set up your React application with the necessary state variables to track:

- Authentication data (token, domain, company ID)
- User data
- Company data
- Stripe elements and secrets
- Loading states
- Error messages

```javascript
function App() {
    const [authData, setAuthData] = React.useState(null);
    const [userData, setUserData] = React.useState(null);
    const [companyData, setCompanyData] = React.useState(null);
    const [deleteLoading, setDeleteLoading] = React.useState(null);
    const [stripeSecret, setStripeSecret] = React.useState(null);
    const [addingCard, setAddingCard] = React.useState(false);
    const [stripeInstance, setStripeInstance] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    
    // Rest of your component...
}
```

### 3. Implement URL Parameter Handling

Add functionality to read URL parameters to pre-fill login credentials:

```javascript
// Function to get URL parameters
function getUrlParams() {
    const searchParams = new URLSearchParams(window.location.search);
    return {
        amount: searchParams.get('amount'),
        callback_url: searchParams.get('callback_url'),
        company_id: searchParams.get('company_id'),
        domain: searchParams.get('domain'),
        email: searchParams.get('email'),
        password: searchParams.get('password')
    };
}

// In your LoginForm component
const [formData, setFormData] = React.useState({
    domain: urlParams.domain || '',
    company_id: urlParams.company_id || '',
    email: urlParams.email || '',
    password: urlParams.password || ''
});

// Auto-login if all parameters are present
React.useEffect(function() {
    let mounted = true;
    var autoLogin = function() {
        if (urlParams.domain && urlParams.company_id && urlParams.email && urlParams.password) {
            if (mounted) setIsLoggingIn(true);
            performLogin({
                domain: urlParams.domain,
                company_id: urlParams.company_id,
                email: urlParams.email,
                password: urlParams.password
            }).then(function() {
                if (mounted) setIsLoggingIn(false);
            }).catch(function(error) {
                console.error('Auto-login failed:', error);
                if (mounted) {
                    setError('Auto-login failed. Please try logging in manually.');
                    showNotification('Auto-login failed. Please try logging in manually.', 'error');
                    setIsLoggingIn(false);
                }
            });
        }
    };
    autoLogin();
    return function() { mounted = false; };
}, []);
```

### 4. Implement User Authentication

Create a function to handle user authentication:

```javascript
const performLogin = function(loginData) {
    return new Promise(function(resolve, reject) {
        const domain = loginData.domain.trim();
        const url = domain + '/api/mkp/v1/sessions';
    
        axios({
            method: 'post',
            url: url,
            data: {
                email: loginData.email,
                password: loginData.password,
                company_id: parseInt(loginData.company_id),
                recaptcha_token: null
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            const token = response.data.user.authentication_token;
            console.log('Login successful:', response.data);
            setError(null);
            
            setAuthData({
                token: token,
                company_id: loginData.company_id,
                domain: loginData.domain
            });
            
            showNotification('Login successful! Welcome back.');
            resolve(true);
        }).catch(function(error) {
            console.error('Login failed:', error);
            const errorMessage = (error.response && error.response.data && error.response.data.error) || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            reject(error);
        });
    });
};
```

### 5. Fetch User and Company Data

Create a function to fetch user and company data after successful authentication:

```javascript
React.useEffect(() => {
    const fetchUserData = async () => {
        if (!authData || !authData.token || !authData.domain || !authData.company_id) return;
        
        setLoading(true);
        try {
            const [userResponse, companyResponse] = await Promise.all([
                axios({
                    method: 'get',
                    url: `${authData.domain}/api/mkp/v1/user?company_id=${authData.company_id}`,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': authData.token
                    }
                }),
                axios({
                    method: 'get',
                    url: `${authData.domain}/api/mkp/v1/companies/${authData.company_id}`,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': authData.token
                    }
                })
            ]);

            setUserData(userResponse.data.user);
            setCompanyData(companyResponse.data.company);
        } catch (error) {
            console.error('Failed to fetch user/company data:', error);
            showNotification('Failed to load user data. Please try logging in again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    fetchUserData();
}, [authData]);
```

### 6. Implement Stripe Integration

Create functions to handle Stripe integration for adding credit cards:

```javascript
const getStripeSecret = async () => {
    try {
        const callbackUrl = urlParams.callback_url || encodeURIComponent(`${authData.domain}/mkp/${authData.company_id}/profile`);
        const amount = urlParams.amount || '100';
        const url = `${authData.domain}/api/mkp/v1/user/payment_methods/session?company_id=${authData.company_id}&payment_type=card&add_to_client=true&guest=false&amount=${amount}&callback_url=${callbackUrl}`;
        
        const response = await axios({
            method: 'get',
            url: url,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authData.token
            }
        });
        
        setStripeSecret({
            clientSecret: response.data.client_secret
        });
        setAddingCard(true);
    } catch (error) {
        console.error('Failed to get Stripe session:', error);
        showNotification('Failed to initialize credit card form. Please try again.', 'error');
    }
};
```

### 7. Create a Stripe Form Component

Create a component to handle Stripe Elements integration:

```javascript
const StripeForm = () => {
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [stripe, setStripe] = React.useState(null);
    const [elements, setElements] = React.useState(null);
    const [initializing, setInitializing] = React.useState(true);
    const cardRef = React.useRef(null);

    React.useEffect(() => {
        const initStripe = async () => {
            if (!companyData || !companyData.stripe_key) {
                setInitializing(false);
                return;
            }

            try {
                const stripeInstance = Stripe(companyData.stripe_key);
                setStripe(stripeInstance);
                setElements(stripeInstance.elements());
            } catch (err) {
                console.error('Failed to initialize Stripe:', err);
                setError('Failed to initialize payment form. Please try again.');
            } finally {
                setInitializing(false);
            }
        };

        // Reset state when company data changes
        setStripe(null);
        setElements(null);
        setError(null);
        setInitializing(true);
        initStripe();
    }, [companyData]);

    React.useEffect(() => {
        if (!elements) return;

        try {
            const card = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                        iconColor: '#666ee8',
                    },
                    invalid: {
                        color: '#9e2146',
                        iconColor: '#fa755a',
                    },
                },
                hidePostalCode: true,
            });

            card.mount('#card-element');
            const handleChange = (event) => {
                setError(event.error ? event.error.message : '');
            };
            card.addEventListener('change', handleChange);
            cardRef.current = card;

            return () => {
                card.removeEventListener('change', handleChange);
                card.unmount();
                cardRef.current = null;
            };
        } catch (err) {
            console.error('Failed to create card element:', err);
            setError('Failed to initialize card form. Please try again.');
        }
    }, [elements]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || !stripeSecret || !stripeSecret.clientSecret || !companyData || !companyData.stripe_key) {
            setError('Payment system not initialized. Please try again.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await stripe.confirmCardSetup(stripeSecret.clientSecret, {
                payment_method: {
                    card: cardRef.current,
                }
            });

            if (result.error) {
                setError(result.error.message);
            } else {
                setError(null);
                // Refresh user data to get the new card
                const response = await axios({
                    method: 'get',
                    url: `${authData.domain}/api/mkp/v1/user?company_id=${authData.company_id}`,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': authData.token
                    }
                });
                setUserData(response.data.user);
                setAddingCard(false);
                showNotification('Credit card added successfully', 'success');
            }
        } catch (error) {
            const errorMessage = error.response && error.response.data && error.response.data.message ? error.response.data.message : 'An unexpected error occurred. Please try again.';
            setError(errorMessage);
            console.error('Card setup error:', error);
            showNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Render the form...
};
```

### 8. Implement Credit Card Deletion

Create a function to handle credit card deletion:

```javascript
const handleDeleteCard = async (cardId) => {
    if (!authData || !cardId) return;
    
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this credit card?')) {
        return;
    }

    setDeleteLoading(cardId);
    try {
        const url = `${authData.domain}/api/mkp/v1/user/payment_methods/${encodeURIComponent(cardId)}?company_id=${authData.company_id}&payment_type=card&_method=delete`;
        
        await axios({
            method: 'delete',
            url: url,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authData.token,
            }
        });

        // Update user data by removing the deleted card
        setUserData(prevData => ({
            ...prevData,
            credit_cards: prevData.credit_cards.filter(card => card.id !== cardId)
        }));

        showNotification('Credit card deleted successfully');
    } catch (error) {
        console.error('Failed to delete card:', error);
        const errorMessage = error.response && error.response.data && error.response.data.message ? error.response.data.message : 'Failed to delete credit card. Please try again.';
        showNotification(errorMessage, 'error');
    } finally {
        setDeleteLoading(null);
    }
};
```

### 9. Build the User Interface

Create a responsive UI using Tailwind CSS with components for:

1. **Login Form**: For user authentication
2. **User Profile**: To display user information and credit cards
3. **Stripe Form**: For adding new credit cards
4. **Credit Card List**: To display and manage existing cards

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mkp/v1/sessions` | POST | Authenticate user and get token |
| `/api/mkp/v1/user` | GET | Get user information including credit cards |
| `/api/mkp/v1/companies/:id` | GET | Get company information including Stripe key |
| `/api/mkp/v1/user/payment_methods/session` | GET | Get a Stripe setup session |
| `/api/mkp/v1/user/payment_methods/:id` | DELETE | Delete a credit card |

## Stripe Integration

The application integrates with Stripe's Elements for secure credit card management. This provides several benefits:

1. PCI compliance - credit card data is entered directly into Stripe's secure elements
2. Tokenization - credit card details are converted to a secure token
3. Secure transmission - sensitive data is never exposed to your application
4. Validation - built-in card validation and error handling

The integration flow works as follows:

1. Authenticate with MyTime API to get an authentication token
2. Fetch company data to get the Stripe public key
3. Get a Stripe setup session from the MyTime API
4. Initialize Stripe Elements with the company's Stripe key
5. User enters credit card details in the Stripe Elements form
6. Submit the form to create a payment method using Stripe's confirmCardSetup
7. Refresh user data to get the updated list of credit cards

## Testing the Application

To test the application:

1. Open the `index.html` file in a web browser
2. Log in with your MyTime credentials (or pass them as URL parameters)
3. View your existing credit cards
4. Add a new credit card using the Stripe form
5. Delete credit cards as needed

## URL Parameters

The application supports the following URL parameters:

- `domain`: The domain for the MyTime API (e.g., https://www.mytime.com)
- `company_id`: The ID of the company
- `email`: The user's email address
- `password`: The user's password
- `amount`: The amount to authorize (in cents)
- `callback_url`: The URL to redirect to after adding a card

Example: `index.html?domain=https://www.mytime.com&company_id=12345&email=user@example.com&password=yourpassword`

## Best Practices

1. Always handle API errors gracefully and display user-friendly error messages
2. Use Stripe Elements for secure credit card handling
3. Implement proper loading states and feedback for user actions
4. Use confirmation dialogs for destructive actions like deleting cards
5. Implement retry logic for fetching user data after adding a card
6. Use responsive design for better mobile experience
7. Store authentication tokens securely
8. Provide clear feedback to users about the success or failure of their actions
