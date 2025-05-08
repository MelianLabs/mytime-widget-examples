# MyTime Service Booking Application

This directory contains an example application demonstrating how to integrate with MyTime's Public API to create a service booking flow. The application allows users to select a company, browse services, check availability, add services to cart, authenticate, and complete a booking.

## Overview

The example application in `index.html` demonstrates a complete booking flow with the following steps:

1. Company selection
2. Location selection
3. Service browsing
4. Availability checking
5. Cart management
6. User authentication
7. Booking confirmation

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
    <title>Book Service</title>
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

- Form data (base URL, company ID)
- Company and location data
- Services and variations
- Availability (dates and times)
- Cart data
- User authentication
- Booking confirmation

### 3. Implement the API Integration Flow

#### Step 1: Fetch Company Data

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

#### Step 2: Select a Location and Fetch Services

```javascript
const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    
    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        
        // Fetch employees
        const employeesResponse = await axios.get(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/employees?location_id=${location.id}`
        );
        setEmployees(employeesResponse.data.employees || []);
        
        // Fetch services
        const servicesResponse = await axios.get(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/deals?location_id=${location.id}&include_variations=true`
        );
        setServices(servicesResponse.data.deals || []);
        
        // Fetch pricings
        const pricingsResponse = await axios.get(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/pricings?location_id=${location.id}`
        );
        setPricings(pricingsResponse.data.pricings || []);
    } catch (err) {
        setError('Error fetching location data. Please try again.');
        console.error('API Error:', err);
    }
};
```

#### Step 3: Select a Service Variation and Check Availability

```javascript
const handleVariationSelect = async (variation) => {
    setSelectedVariation(variation);
    setAvailableDates([]);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
    setError('');

    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        const response = await axios.get(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/available_dates?location_id=${selectedLocation.id}&employee_ids=&variation_ids=${variation.id}&is_existing_customer=false&include_tax=false&include_fulfillments=false&child_id=`
        );
        
        setAvailableDates(response.data.dates || []);
    } catch (err) {
        setError('Error fetching available dates. Please try again.');
        console.error('API Error:', err);
    }
};
```

#### Step 4: Select a Date and Fetch Available Times

```javascript
const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setAvailableTimes([]);
    setError('');

    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        const response = await axios.get(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/open_times?date=${date}&location_id=${selectedLocation.id}&employee_ids=&variation_ids=${selectedVariation.id}&is_existing_customer=false&include_tax=false&include_fulfillments=false&child_id=`
        );
        
        setAvailableTimes(response.data.open_times || []);
    } catch (err) {
        setError('Error fetching available times. Please try again.');
        console.error('API Error:', err);
    }
};
```

#### Step 5: Select a Time and Add to Cart

```javascript
const handleTimeSelect = async (time) => {
    setSelectedTime(time);
    setError('');

    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        
        // Create cart
        const cartResponse = await axios.post(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/carts`,
            { user_id: null }
        );
        
        const cartId = cartResponse.data.cart.id;

        // Add item to cart
        const cartItemResponse = await axios.post(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/carts/${cartId}/cart_items`,
            {
                location_id: selectedLocation.id,
                variation_ids: selectedVariation.id.toString(),
                deal_id: time.deal_id,
                employee_ids: '',
                begin_at: time.begin_at,
                end_at: time.end_at,
                is_existing_customer: false,
                travel_to_customer: false,
                has_specific_employee: false,
                child_id: ''
            }
        );

        setCartData(cartItemResponse.data.cart);
    } catch (err) {
        setError('Error adding time slot to cart. Please try again.');
        console.error('API Error:', err);
    }
};
```

#### Step 6: User Authentication and Booking Completion

```javascript
const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        
        // Create session
        const sessionResponse = await axios.post(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/sessions`,
            {
                email: loginData.email,
                password: loginData.password,
                company_id: parseInt(selectedLocation.company_id),
                recaptcha_token: null
            }
        );

        const user = sessionResponse.data.user;
        setUserData(user);

        // Update client preferences
        await axios.put(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/user/client`,
            {
                company_id: parseInt(selectedLocation.company_id),
                client: {
                    preferred_language: 'en-US'
                }
            },
            {
                headers: {
                    'Authorization': user.authentication_token
                }
            }
        );

        // Update cart with user ID
        const cartUpdateResponse = await axios.put(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/carts/${cartData.id}`,
            { user_id: user.id },
            {
                headers: {
                    'Authorization': user.authentication_token
                }
            }
        );

        setCartData(cartUpdateResponse.data.cart);

        // Create purchase
        const purchaseResponse = await axios.post(
            `${baseUrlWithoutTrailingSlash}/api/mkp/v1/purchases`,
            {
                note: '',
                referrer: 'express_checkout',
                cart_id: cartData.id,
                is_embedded: true,
                no_pay: true,
                is_mobile_consumer_app: false,
                card_id: loginData.cardId || undefined
            },
            {
                headers: {
                    'Authorization': user.authentication_token
                }
            }
        );

        setPurchaseData(purchaseResponse.data.purchase);
    } catch (err) {
        setError('Login failed. Please check your credentials and try again.');
        console.error('API Error:', err);
    }
};
```

### 4. Build the User Interface

Create a responsive UI using Tailwind CSS with components for:

- Initial form for base URL and company ID
- Company and location selection
- Service browsing with variation options
- Date and time selection
- Cart summary
- Login form
- Booking confirmation

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mkp/v1/companies/:id` | GET | Fetch company data including locations |
| `/api/mkp/v1/employees` | GET | Fetch employees for a location |
| `/api/mkp/v1/deals` | GET | Fetch services for a location |
| `/api/mkp/v1/pricings` | GET | Fetch pricing information |
| `/api/mkp/v1/available_dates` | GET | Fetch available dates for booking |
| `/api/mkp/v1/open_times` | GET | Fetch available time slots for a date |
| `/api/mkp/v1/carts` | POST | Create a new cart |
| `/api/mkp/v1/carts/:id/cart_items` | POST | Add an item to a cart |
| `/api/mkp/v1/sessions` | POST | Authenticate a user |
| `/api/mkp/v1/user/client` | PUT | Update client preferences |
| `/api/mkp/v1/carts/:id` | PUT | Update a cart |
| `/api/mkp/v1/purchases` | POST | Create a purchase/booking |

## Testing the Application

To test the application:

1. Open the `index.html` file in a web browser
2. Provide the base URL and company ID (or pass them as URL parameters)
3. Follow the booking flow to select a service, time, and complete the booking

## URL Parameters

The application supports the following URL parameters:

- `base_url`: The base URL for the MyTime API
- `company_id`: The ID of the company to book with

Example: `index.html?base_url=https://api.mytime.com&company_id=12345`

## Best Practices

1. Always handle API errors gracefully and display user-friendly error messages
2. Use loading indicators during API calls to improve user experience
3. Validate user inputs before making API calls
4. Store authentication tokens securely
5. Implement proper error handling for all API calls
6. Use responsive design for better mobile experience
