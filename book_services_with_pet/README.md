# MyTime Pet Service Booking Application

This directory contains an example application demonstrating how to integrate with MyTime's Public API to create a service booking flow for pet services. The application requires user authentication before booking to manage pet information.

## Demo

![Demo](./book_services_with_pet.gif)

[Download Full Video](./book_services_with_pet.webm)

## Overview

The example application in `index.html` demonstrates a complete pet booking flow with the following steps:

1. Company selection
2. User authentication (required before booking)
3. Location selection
4. Pet selection
5. Service browsing
6. Availability checking
7. Cart management
8. Booking confirmation

## Key Difference from Standard Booking

This flow **requires login before selecting services** because:
- Pet information is tied to the user's account
- The `child_id` (pet ID) must be included in availability checks and cart items
- Pet custom fields (name, breed) are fetched from the user's children endpoint

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
    <title>Book Service with Pet</title>
    <!-- React and ReactDOM from CDN -->
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>
    <!-- Babel for JSX -->
    <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
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
- User authentication data
- Pets list and selected pet
- Services and variations
- Availability (dates and times)
- Cart data
- Booking confirmation

### 3. Implement the API Integration Flow

#### Step 1: Fetch Company Data

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    
    const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
    
    const [companyResponse, locationsResponse] = await Promise.all([
        axios.get(`${baseUrlWithoutTrailingSlash}/api/mkp/v1/companies/${formData.companyId}?include_custom_fields=true`),
        axios.get(`${baseUrlWithoutTrailingSlash}/api/mkp/v1/companies/${formData.companyId}/locations`)
    ]);
    
    setCompanyData(companyResponse.data.company);
    setLocations(locationsResponse.data.locations || []);
};
```

#### Step 2: User Authentication (Required Before Booking)

```javascript
const handleLogin = async (e) => {
    e.preventDefault();
    
    const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
    
    const sessionResponse = await axios.post(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/sessions`,
        {
            email: loginData.email,
            password: loginData.password,
            company_id: parseInt(formData.companyId),
            recaptcha_token: null
        }
    );

    const user = sessionResponse.data.user;
    setUserData(user);
    setIsLoggedIn(true);
};
```

#### Step 3: Fetch User's Pets

```javascript
const fetchPets = async (authToken, companyId) => {
    const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
    const response = await axios.get(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/user/children?company_id=${companyId}`,
        {
            headers: {
                'Authorization': authToken
            }
        }
    );

    const children = response.data.children || [];
    
    // Find pet name and breed field IDs from company custom_fields
    let petNameFieldId = null;
    let petBreedFieldId = null;
    if (companyData && companyData.custom_fields) {
        const petNameField = companyData.custom_fields.find(cf => 
            cf.uuid === 'pet_name' || (cf.is_label === true && cf.resource_type === 'MyClient::Child')
        );
        if (petNameField) petNameFieldId = petNameField.id;
        
        const petBreedField = companyData.custom_fields.find(cf => 
            cf.uuid === 'pet_breed' || (cf.is_secondary_label === true && cf.resource_type === 'MyClient::Child')
        );
        if (petBreedField) petBreedFieldId = petBreedField.id;
    }

    // Extract pet names and breeds from custom fields
    const petsWithNames = children.map(pet => {
        let petName = null;
        let petBreed = null;
        
        if (pet.custom_field_values && Array.isArray(pet.custom_field_values)) {
            if (petNameFieldId) {
                const nameField = pet.custom_field_values.find(cf => cf.custom_field_id === petNameFieldId);
                if (nameField) petName = nameField.value;
            }
            if (petBreedFieldId) {
                const breedField = pet.custom_field_values.find(cf => cf.custom_field_id === petBreedFieldId);
                if (breedField) petBreed = breedField.value;
            }
        }
        
        if (!petName) petName = `Pet #${pet.id}`;
        const displayName = petBreed ? `${petName} (${petBreed})` : petName;
        
        return { ...pet, displayName };
    });
    
    setPets(petsWithNames);
};
```

#### Step 4: Check Availability with Pet ID

```javascript
const handlePetSelect = async (pet) => {
    setSelectedPet(pet);
    
    const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
    const response = await axios.get(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/open_dates?location_id=${selectedLocation.id}&employee_ids=&variation_ids=${selectedVariation.id}&is_existing_customer=${isLoggedIn}&child_id=${pet.id}`
    );
    
    setAvailableDates(response.data.open_dates || []);
};
```

#### Step 5: Add to Cart with Pet ID

```javascript
const handleTimeSelect = async (time) => {
    const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
    
    // Create cart
    const cartResponse = await axios.post(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/carts`,
        { user_id: userData ? userData.id : null }
    );
    
    const cartId = cartResponse.data.cart.id;

    // Add item to cart with pet/child ID
    const cartItemResponse = await axios.post(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/carts/${cartId}/cart_items`,
        {
            location_id: selectedLocation.id,
            variation_ids: selectedVariation.id.toString(),
            deal_id: time.deal_id,
            employee_ids: '',
            begin_at: time.begin_at,
            end_at: time.end_at,
            is_existing_customer: isLoggedIn,
            travel_to_customer: false,
            has_specific_employee: false,
            child_id: selectedPet ? selectedPet.id : null  // Important: include pet ID
        }
    );

    setCartData(cartItemResponse.data.cart);
};
```

#### Step 6: Complete Purchase with Pet ID

```javascript
const handleCompletePurchase = async () => {
    const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');

    // Update cart with user ID
    await axios.put(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/carts/${cartData.id}`,
        { user_id: userData.id },
        { headers: { 'Authorization': userData.authentication_token } }
    );

    // Create purchase with child_id
    const purchaseResponse = await axios.post(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/purchases`,
        {
            note: '',
            referrer: 'express_checkout',
            cart_id: cartData.id,
            is_embedded: true,
            no_pay: true,
            is_mobile_consumer_app: false,
            child_id: selectedPet ? selectedPet.id : null  // Important: include pet ID
        },
        { headers: { 'Authorization': userData.authentication_token } }
    );

    setPurchaseData(purchaseResponse.data.purchase);
};
```

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mkp/v1/companies/:id` | GET | Fetch company data including custom fields |
| `/api/mkp/v1/companies/:id/locations` | GET | Fetch locations for a company |
| `/api/mkp/v1/companies/:id/employees` | GET | Fetch employees for a location |
| `/api/mkp/v1/companies/:id/deals` | GET | Fetch services for a location |
| `/api/mkp/v1/companies/:id/pricings` | GET | Fetch pricing information |
| `/api/mkp/v1/sessions` | POST | Authenticate a user |
| `/api/mkp/v1/user/children` | GET | Fetch user's pets/children |
| `/api/mkp/v1/open_dates` | GET | Fetch available dates (with child_id) |
| `/api/mkp/v1/open_times` | GET | Fetch available time slots (with child_id) |
| `/api/mkp/v1/carts` | POST | Create a new cart |
| `/api/mkp/v1/carts/:id/cart_items` | POST | Add an item to cart (with child_id) |
| `/api/mkp/v1/carts/:id` | PUT | Update a cart |
| `/api/mkp/v1/purchases` | POST | Create a purchase (with child_id) |

## Pet Custom Fields

Pet information is stored in custom fields. The key fields are identified by:

- **Pet Name**: `uuid === 'pet_name'` or `is_label === true` with `resource_type === 'MyClient::Child'`
- **Pet Breed**: `uuid === 'pet_breed'` or `is_secondary_label === true` with `resource_type === 'MyClient::Child'`

## Testing the Application

To test the application:

1. Start a local HTTP server (required for proper functionality):
   ```bash
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000/book_services_with_pet/index.html` in a web browser
3. Provide the base URL and company ID (or pass them as URL parameters)
4. Log in with valid credentials
5. Select a location, pet, and service to complete the booking

## URL Parameters

The application supports the following URL parameters:

- `base_url`: The base URL for the MyTime API
- `company_id`: The ID of the company to book with
- `email`: Pre-fill the login email field

Example: `index.html?base_url=http://localhost:5050&company_id=748&email=user@example.com`

## Error Handling

The application handles API errors including:
- 422 errors with detailed error messages (e.g., "time is no longer available")
- Network errors
- Authentication failures

Errors are displayed in a red alert box with user-friendly messages.

## Important: child_id Requirement

**The `child_id` parameter must be included in BOTH API calls for pet bookings to work correctly:**

1. **Cart Items** (`POST /api/mkp/v1/carts/:id/cart_items`): Include `child_id` when adding items to the cart
2. **Purchases** (`POST /api/mkp/v1/purchases`): Include `child_id` when creating the purchase

If `child_id` is missing from either endpoint, the pet will not be associated with the appointment.

## Best Practices

1. **Always include `child_id` in both cart_items and purchases API calls** for pet bookings
2. Fetch company custom fields to properly identify pet name and breed fields
3. Handle API errors gracefully and display user-friendly error messages
4. Require authentication before showing pet selection
5. Use the `is_existing_customer` flag appropriately based on login status
