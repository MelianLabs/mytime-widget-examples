# MyTime Gift Card Purchase Application

This directory contains an example application demonstrating how to integrate with MyTime's Public API and Stripe to process gift card purchases without saving the customer's credit card information. The application allows users to purchase gift cards as a guest with a one-time payment.

## Overview

The example application in `index.html` demonstrates a complete gift card purchase flow with the following features:

1. Company and location selection
2. Gift card form with sender and recipient information
3. Amount selection with dynamic Stripe payment element initialization
4. Secure payment processing with Stripe Payment Elements
5. Guest checkout (no account required)
6. Confirmation with gift card details

## Technologies Used

- **React**: For building the user interface
- **Axios**: For making API calls to MyTime's Public API
- **Tailwind CSS**: For styling the application with minimal custom CSS
- **Stripe.js**: For secure payment processing with Payment Elements

## How to Build a Similar Application

### 1. Set Up Your Project

Start with a basic HTML structure that includes the necessary dependencies:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gift Card Purchase</title>
    <!-- React and ReactDOM from CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <!-- Babel for JSX -->
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <!-- Axios for API calls -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Stripe.js -->
    <script src="https://js.stripe.com/v3/"></script>
    <style>
        .StripeElement {
            background-color: white;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .StripeElement--focus {
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        .StripeElement--invalid {
            border-color: #ef4444;
        }
    </style>
</head>
<body class="bg-gray-100 p-6">
    <div id="root"></div>
    <!-- Your React code will go here -->
</body>
</html>
```

### 2. Create the React Application Structure

Set up your React application with the necessary state variables to track:

- Form data (base URL, company ID)
- Company and location data
- Gift card form data
- Stripe elements
- Payment processing state
- Error and success messages

```javascript
function App() {
    const [formData, setFormData] = React.useState({
        baseUrl: '',
        companyId: ''
    });
    const [companyData, setCompanyData] = React.useState(null);
    const [locations, setLocations] = React.useState([]);
    const [selectedLocation, setSelectedLocation] = React.useState(null);
    const [error, setError] = React.useState('');
    const [giftCardPurchase, setGiftCardPurchase] = React.useState(null);
    const [guestData, setGuestData] = React.useState(null);
    const [stripeElements, setStripeElements] = React.useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
    const [giftCardForm, setGiftCardForm] = React.useState({
        from: '',
        to_first_name: '',
        to_last_name: '',
        sender_email: '',
        recipient_email: '',
        amount: '',
        recipient_note: ''
    });
    
    // Rest of your component...
}
```

### 3. Implement URL Parameter Handling

Add functionality to read URL parameters to pre-fill form fields and handle payment status callbacks:

```javascript
React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const baseUrl = params.get('base_url');
    const companyId = params.get('company_id');
    const gcId = params.get('gc_id');
    const paymentStatus = params.get('payment_status');
    
    if (baseUrl && companyId) {
        setFormData({
            baseUrl,
            companyId
        });
    }

    // Handle payment status from URL parameters
    if (paymentStatus === 'success' && gcId) {
        alert('Payment completed successfully! Your gift card has been purchased.');
        // Keep only base_url and company_id parameters
        const newUrl = new URL(window.location.href);
        const newParams = new URLSearchParams();
        if (baseUrl) newParams.set('base_url', baseUrl);
        if (companyId) newParams.set('company_id', companyId);
        newUrl.search = newParams.toString();
        window.history.replaceState({}, '', newUrl);
    } else if (paymentStatus === 'failed') {
        setError('Payment failed. Please try again.');
        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        const newParams = new URLSearchParams();
        if (baseUrl) newParams.set('base_url', baseUrl);
        if (companyId) newParams.set('company_id', companyId);
        newUrl.search = newParams.toString();
        window.history.replaceState({}, '', newUrl);
    }
}, []);
```

### 4. Implement Company and Location Fetching

Create a function to fetch company data and locations:

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset all state
    setError('');
    setCompanyData(null);
    setLocations([]);
    setSelectedLocation(null);
    setGiftCardPurchase(null);
    setGuestData(null);
    
    // Reset Stripe elements if they exist
    if (stripeElements && stripeElements.paymentElement) {
        stripeElements.paymentElement.unmount();
        setStripeElements(null);
    }

    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        const response = await axios.get(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/companies/${formData.companyId}`
        );
        
        setCompanyData(response.data.company);
        setLocations(response.data.company.locations || []);
    } catch (err) {
        setError('Error fetching company data. Please check your inputs and try again.');
        console.error('API Error:', err);
    }
};
```

### 5. Initialize Stripe Payment Elements

Create a function to initialize Stripe Payment Elements when the amount changes:

```javascript
const initializeStripe = (stripeKey, amount) => {
    try {
        if (!selectedLocation || !selectedLocation.payment_account || !selectedLocation.payment_account.stripe_account_id) {
            throw new Error('This location is not configured for payments.');
        }
        if (!stripeKey) {
            throw new Error('Stripe key is required.');
        }
        if (!amount || amount <= 0) {
            throw new Error('Valid amount is required.');
        }

        const stripe = Stripe(stripeKey);
        const elements = stripe.elements({
            mode: 'payment',
            amount: Math.round(amount * 100),
            captureMethod: 'manual',
            onBehalfOf: selectedLocation.payment_account.stripe_account_id,
            currency: companyData.currency || 'usd',
            paymentMethodTypes: ['card'],
            appearance: {
                // Customize the appearance as needed
            },
        });
        
        const paymentElement = elements.create('payment');
        paymentElement.mount('#card-element');
        setStripeElements({ stripe, elements, paymentElement });
    } catch (error) {
        console.error('Stripe initialization error:', error);
        setError(error.message);
        if (stripeElements && stripeElements.paymentElement) {
            stripeElements.paymentElement.unmount();
        }
        setStripeElements(null);
    }
};

const handleAmountChange = (e) => {
    const newAmount = e.target.value;
    setGiftCardForm(prev => ({ ...prev, amount: newAmount }));
    
    // Only initialize Stripe if we have all required data
    if (companyData && companyData.stripe_key && 
        selectedLocation && selectedLocation.payment_account && selectedLocation.payment_account.stripe_account_id && 
        newAmount && 
        parseFloat(newAmount) > 0) {
        initializeStripe(companyData.stripe_key, parseFloat(newAmount));
    } else if (stripeElements && stripeElements.paymentElement) {
        // Reset Stripe elements if amount is invalid
        stripeElements.paymentElement.unmount();
        setStripeElements(null);
    }
};
```

### 6. Implement Gift Card Purchase and Payment Processing

Create a function to handle the gift card purchase and payment processing:

```javascript
const handleGiftCardSubmit = async (e) => {
    e.preventDefault();
    if (!stripeElements) {
        setError('Payment not initialized properly. Please try again.');
        return;
    }

    const validationError = validateForm();
    if (validationError) {
        setError(validationError);
        return;
    }

    setIsProcessingPayment(true);
    setError('');

    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        
        // Step 1: Register guest
        const guestResponse = await axios.post(`${baseUrlWithoutTrailingSlash}/api/mkp/v1/guests`, {
            email: giftCardForm.sender_email,
            associate_clients: false,
            company_id: formData.companyId,
            time_zone: selectedLocation.time_zone,
            recaptcha_token: null
        });
        
        setGuestData(guestResponse.data);

        // Step 2: Create gift card purchase
        const giftCardResponse = await axios.post(`${baseUrlWithoutTrailingSlash}/api/mkp/v1/gift_card_purchases`, {
            amount: parseFloat(giftCardForm.amount),
            sender_name: giftCardForm.from,
            recipient_email: giftCardForm.recipient_email,
            recipient_first_name: giftCardForm.to_first_name,
            recipient_last_name: giftCardForm.to_last_name,
            recipient_note: giftCardForm.recipient_note,
            location_id: selectedLocation.id,
            company_id: formData.companyId,
            expiration_end_date: null,
            email_to_be_sent_at: null
        });

        setGiftCardPurchase(giftCardResponse.data);

        // Step 3: Get payment session
        const callbackUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}?base_url=${encodeURIComponent(formData.baseUrl)}&company_id=${formData.companyId}&gc_id=${giftCardResponse.data.id}`);
        const sessionResponse = await axios.get(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/user/payment_methods/session`,
            {
                params: {
                    company_id: formData.companyId,
                    callback_url: callbackUrl,
                    payment_type: 'card',
                    add_to_client: false,
                    guest: false,
                    amount: giftCardForm.amount,
                    stripe_account_id: selectedLocation.payment_account.stripe_account_id
                },
                headers: {
                    'gauthorization': guestResponse.data.user.guest_token,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!sessionResponse.data || !sessionResponse.data.client_secret) {
            throw new Error('Invalid payment session response');
        }

        // Step 4: Submit payment form
        const { error: submitError } = await stripeElements.elements.submit();
        if (submitError) {
            throw submitError;
        }

        // Step 5: Confirm payment with Stripe
        const { error: paymentError, paymentIntent } = await stripeElements.stripe.confirmPayment({
            elements: stripeElements.elements,
            clientSecret: sessionResponse.data.client_secret,
            confirmParams: {
                return_url: location.href,
                expand: ['payment_method'],
            },
            redirect: 'if_required'
        });
        
        if (paymentError) {
            throw new Error(paymentError.message || 'Payment failed. Please try again.');
        }

        if (!paymentIntent) {
            throw new Error('No payment intent returned from Stripe');
        }

        // Step 6: Complete gift card purchase with payment intent
        const completeResponse = await axios.post(
            baseUrlWithoutTrailingSlash + '/api/mkp/v1/gift_card_purchases/' + giftCardResponse.data.id + '/complete',
            {
                payment_intent: paymentIntent
            },
            {
                headers: {
                    'gauthorization': guestResponse.data.user.guest_token,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!completeResponse || !completeResponse.data) {
            throw new Error('Failed to complete gift card purchase');
        }

        const giftCard = completeResponse.data;
        const tickets = giftCard.tickets;
        if (!tickets || tickets.length === 0) {
            throw new Error('No ticket information found');
        }

        // Display success message
        const successMessage = 'Payment processed successfully!\n\n' +
            'Gift Card Details:\n' +
            '- Code: ' + giftCard.code + '\n' +
            '- Amount: $' + giftCard.total_price + '\n' +
            '- Status: ' + giftCard.status + '\n' +
            '- Recipient: ' + giftCard.recipient_first_name + ' ' + giftCard.recipient_last_name + '\n' +
            '- Email: ' + giftCard.recipient_email + '\n' +
            '- Purchase ID: ' + giftCard.id + '\n' +
            '- Ticket UUID: ' + tickets[0].uuid + '\n\n' +
            'A confirmation email will be sent to ' + giftCard.recipient_email;
        alert(successMessage);
    
        // Reset form after successful purchase
        setGiftCardForm({
            from: '',
            to_first_name: '',
            to_last_name: '',
            sender_email: '',
            recipient_email: '',
            amount: '',
            recipient_note: ''
        });
        
        if (stripeElements && stripeElements.paymentElement) {
            stripeElements.paymentElement.clear();
        }
    } catch (err) {
        // Handle errors
        console.error('Payment/Purchase error:', err);
        let errorMessage = 'An error occurred during the payment process.';
        
        if (err.response && err.response.data) {
            errorMessage = err.response.data.message || err.response.data.error || errorMessage;
        } else if (err.message) {
            errorMessage = err.message;
        }

        setError(errorMessage);
    } finally {
        setIsProcessingPayment(false);
    }
};
```

### 7. Build the User Interface

Create a responsive UI using Tailwind CSS with components for:

- Initial form for base URL and company ID
- Location selection
- Gift card form with sender and recipient information
- Amount input with dynamic Stripe initialization
- Stripe Payment Element container
- Submit button with loading state
- Error display

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mkp/v1/companies/:id` | GET | Fetch company data including locations |
| `/api/mkp/v1/guests` | POST | Register as a guest user |
| `/api/mkp/v1/gift_card_purchases` | POST | Create a gift card purchase |
| `/api/mkp/v1/user/payment_methods/session` | GET | Get a payment session for Stripe |
| `/api/mkp/v1/gift_card_purchases/:id/complete` | POST | Complete a gift card purchase with payment intent |

## Stripe Integration

The application integrates with Stripe's Payment Elements for secure payment processing. This provides several benefits:

1. PCI compliance - credit card data is entered directly into Stripe's secure elements
2. Modern payment UI - supports various payment methods based on location
3. One-time payments - processes payments without saving card information
4. Connect integration - supports payments directly to the merchant's Stripe account

The integration flow works as follows:

1. Initialize Stripe with the company's Stripe key when an amount is entered
2. Create a gift card purchase in the MyTime system
3. Get a payment session with client secret from the MyTime API
4. Use Stripe's confirmPayment method to process the payment
5. Complete the gift card purchase with the payment intent

## Testing the Application

To test the application:

1. Open the `index.html` file in a web browser
2. Provide the base URL and company ID (or pass them as URL parameters)
3. Select a location that is configured for payments
4. Fill in the gift card form with sender and recipient information
5. Enter an amount to initialize the Stripe Payment Element
6. Enter test card details (e.g., 4242 4242 4242 4242 for success)
7. Submit the form to process the payment

## URL Parameters

The application supports the following URL parameters:

- `base_url`: The base URL for the MyTime API
- `company_id`: The ID of the company
- `gc_id`: The ID of the gift card (used in payment callbacks)
- `payment_status`: The status of the payment (used in payment callbacks)

Example: `index.html?base_url=https://www.mytime.com&company_id=12345`

## Best Practices

1. Always handle API errors gracefully and display user-friendly error messages
2. Use Stripe's Payment Elements for secure payment processing
3. Validate form inputs before submitting to the API
4. Provide clear feedback during the payment process
5. Implement proper error handling for all API calls
6. Use responsive design for better mobile experience
7. Reset the form after successful payment to prevent duplicate submissions
