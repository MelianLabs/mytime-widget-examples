# MyTime User Signup Application

This directory contains an example application demonstrating how to integrate with MyTime's Public API to create new user accounts. The application allows users to sign up for a MyTime account with basic information.

## Overview

The example application in `index.html` demonstrates a user signup flow with the following features:

1. Company verification with API credentials
2. User registration form with basic fields
3. Detailed error handling and display
4. Success response display with user information
5. Support for URL parameters to pre-fill API credentials

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
    <title>Sign Up</title>
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
- Company data
- Signup form data
- User data (after successful signup)
- Error state

```javascript
function App() {
    const [formData, setFormData] = React.useState({
        baseUrl: '',
        companyId: ''
    });
    const [userData, setUserData] = React.useState(null);
    const [companyData, setCompanyData] = React.useState(null);
    const [error, setError] = React.useState(null);

    const [signupData, setSignupData] = React.useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone_number: '',
        country: 'PH',
        zip_code: '4310',
        send_welcome_email: true,
        from_mkp: true,
        recaptcha_token: null
    });
    
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
    
    if (baseUrl && companyId) {
        setFormData({
            baseUrl,
            companyId
        });
    }
}, []);
```

### 4. Implement Company Verification

Create a function to verify the company before showing the signup form:

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset all state
    setError('');
    setCompanyData(null);
    
    // Validate form data
    if (!formData.baseUrl || !formData.companyId) {
        setError('Base URL and Company ID are required.');
        return;
    }

    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        console.log('Making API calls to:', baseUrlWithoutTrailingSlash);
        
        const [companyResponse] = await Promise.all([
            axios.get(`${baseUrlWithoutTrailingSlash}/api/mkp/v1/companies/${formData.companyId}?include_external_locations=false&include_gc_templates=false&include_env_fees=false&include_parent_settings=false&include_scripts=false&include_subscription=false&include_custom_fields=true&include_intake_forms=true&blocked=true`),
        ]);

        console.log('Company Response:', companyResponse.data);

        // Validate company data
        if (!companyResponse.data || !companyResponse.data.company) {
            throw new Error('Invalid company data received');
        }

        const company = companyResponse.data.company;
        
        // Validate company has Stripe integration
        if (!company.stripe_key) {
            throw new Error('This company is not configured for gift card payments');
        }
        
        setCompanyData(company);
    } catch (err) {
        const errorMessage = err.response ? 
            'Error loading company data. Please check your Base URL and Company ID.' : 
            err.message;
        setError(errorMessage);
        console.error('API Error:', err);
    }
};
```

### 5. Implement User Signup

Create a function to handle the user signup form submission:

```javascript
const handleSignupSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post(
            `${formData.baseUrl}/api/mkp/v1/users`,
            {
                ...signupData,
                company_id: companyData.id
            }
        );
        
        if (response.status === 201) {
            const responseData = response.data || {};
            const user = responseData.user;
            if (user && !(user.errors || {}).email) {
                setUserData(user);
                setError('');
                setFormData({ baseUrl: '', companyId: '' });
                setSignupData({
                    ...signupData,
                    first_name: '',
                    last_name: '',
                    email: '',
                    password: '',
                    password_confirmation: ''
                });
            } else {
                throw new Error('Invalid user data received');
            }
        } else {
            throw new Error('Unexpected response status: ' + response.status);
        }
    } catch (err) {
        let errorMessage;
        if (err.response && err.response.data) {
            if (err.response.data.user && err.response.data.user.errors) {
                const errors = [];
                Object.entries(err.response.data.user.errors).forEach(([field, fieldErrors]) => {
                    if (Array.isArray(fieldErrors)) {
                        fieldErrors.forEach(error => {
                            errors.push(`${field}: ${error}`);
                        });
                    }
                });
                errorMessage = errors.join('\n');
            } else {
                errorMessage = 'An error occurred while creating the user.';
            }
        } else {
            errorMessage = err.message || 'An error occurred while creating the user.';
        }
        setError(errorMessage);
        console.error('API Error:', err);
    }
};
```

### 6. Build the User Interface

Create a responsive UI using Tailwind CSS with components for:

1. **Initial Form**: For entering base URL and company ID
   ```jsx
   <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
       <div className="mb-4">
           <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="baseUrl">
               Base URL
           </label>
           <input
               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
               id="baseUrl"
               type="text"
               value={formData.baseUrl}
               onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
               placeholder="www.mytime.com"
           />
       </div>
       <div className="mb-6">
           <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companyId">
               Company ID
           </label>
           <input
               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
               id="companyId"
               type="text"
               value={formData.companyId}
               onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
               placeholder="40426"
           />
       </div>
       <div className="flex items-center justify-between">
           <button
               className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
               type="submit">
               Submit
           </button>
       </div>
   </form>
   ```

2. **Company Information Display**: To show verified company details
   ```jsx
   <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
       <h2 className="text-xl font-bold mb-4">Company Information</h2>
       <p><span className="font-bold">ID:</span> {companyData.id}</p>
       <p><span className="font-bold">Name:</span> {companyData.name}</p>
   </div>
   ```

3. **Signup Form**: For collecting user information
   ```jsx
   <form 
       className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
       onSubmit={handleSignupSubmit}>
       <h2 className="text-xl font-bold mb-4">Sign Up</h2>
       
       <div className="grid grid-cols-2 gap-4">
           <div className="mb-4">
               <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="first_name">First Name</label>
               <input
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                   id="first_name"
                   type="text"
                   value={signupData.first_name}
                   onChange={(e) => setSignupData({...signupData, first_name: e.target.value})}
                   required
               />
           </div>
           
           <div className="mb-4">
               <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="last_name">Last Name</label>
               <input
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                   id="last_name"
                   type="text"
                   value={signupData.last_name}
                   onChange={(e) => setSignupData({...signupData, last_name: e.target.value})}
                   required
               />
           </div>
       </div>

       <div className="mb-4">
           <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
           <input
               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
               id="email"
               type="email"
               value={signupData.email}
               onChange={(e) => setSignupData({...signupData, email: e.target.value})}
               required
           />
       </div>

       <div className="mb-4">
           <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
           <input
               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
               id="password"
               type="password"
               value={signupData.password}
               onChange={(e) => setSignupData({...signupData, password: e.target.value, password_confirmation: e.target.value})}
               required
           />
       </div>

       <div className="mb-4">
           <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zip_code">ZIP Code</label>
           <input
               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
               id="zip_code"
               type="text"
               value={signupData.zip_code}
               onChange={(e) => setSignupData({...signupData, zip_code: e.target.value})}
               required
           />
       </div>

       <div className="flex items-center justify-between">
           <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
               Sign Up
           </button>
       </div>
   </form>
   ```

4. **Success Display**: To show user information after successful signup
   ```jsx
   <div className="bg-green-50 border border-green-400 text-green-700 px-8 pt-6 pb-8 mb-4 rounded">
       <h2 className="text-xl font-bold mb-4">User Created Successfully</h2>
       <div className="grid grid-cols-2 gap-4">
           <div>
               <p className="font-bold mb-1">Name</p>
               <p>{userData.first_name} {userData.last_name}</p>
           </div>
           <div>
               <p className="font-bold mb-1">Email</p>
               <p>{userData.email}</p>
           </div>
           <div>
               <p className="font-bold mb-1">User ID</p>
               <p>{userData.id}</p>
           </div>
           <div>
               <p className="font-bold mb-1">Country</p>
               <p>{userData.country}</p>
           </div>
           <div className="col-span-2">
               <p className="font-bold mb-1">Authentication Token</p>
               <p className="font-mono text-sm break-all">{userData.authentication_token}</p>
           </div>
       </div>
   </div>
   ```

## API Endpoint Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mkp/v1/companies/:id` | GET | Verify company exists and get company information |
| `/api/mkp/v1/users` | POST | Create a new user account |

### Request Body for User Creation

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "yourpassword",
  "password_confirmation": "yourpassword",
  "country": "PH",
  "zip_code": "4310",
  "send_welcome_email": true,
  "from_mkp": true,
  "company_id": 12345,
  "recaptcha_token": null
}
```

## Testing the Application

To test the application:

1. Open the `index.html` file in a web browser
2. Provide the base URL and company ID (or pass them as URL parameters)
3. After the company is verified, fill in the signup form with user information
4. Submit the form to create a new user account

## URL Parameters

The application supports the following URL parameters:

- `base_url`: The base URL for the MyTime API
- `company_id`: The ID of the company to associate with the user

Example: `index.html?base_url=https://www.mytime.com&company_id=12345`

## Best Practices

1. Always handle API errors gracefully and display user-friendly error messages
2. Validate user inputs before making API calls
3. Use secure password handling practices
4. Provide clear feedback to users about the success or failure of their actions
5. Implement proper error handling for all API calls
6. Use responsive design for better mobile experience
7. Consider adding password strength requirements and validation
