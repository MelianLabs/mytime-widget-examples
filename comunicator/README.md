# MyTime Communicator Application

This directory contains an example application demonstrating how to integrate with MyTime's Public API to access and manage client-staff communications. The application allows users to view, send, and manage messages across different company locations.

## Overview

The example application in `index.html` demonstrates a messaging interface with the following features:

1. Authentication with MyTime credentials
2. Viewing all company locations
3. Displaying unread message counts per location
4. Loading message history with infinite scrolling
5. Sending new messages to specific locations
6. Automatic marking of messages as read
7. Real-time message updates with 30-second polling

## Technologies Used

- **React**: For building the user interface
- **Axios**: For making API calls to MyTime's Public API
- **Tailwind CSS**: For styling the application with minimal custom CSS
- **Babel**: For JSX transpilation

## How to Build a Similar Application

### 1. Set Up Your Project

Start with a basic HTML structure that includes the necessary dependencies:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyTime Communicator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-gray-100 p-6">
    <div id="root"></div>
    <!-- Your React code will go here -->
</body>
</html>
```

### 2. Create the React Application Structure

Set up your React application with the necessary state variables to track:

- Authentication state (login status, auth token)
- User data
- Company locations
- Messages per location
- Loading states
- Error states

### 3. Implement URL Parameter Handling

Add functionality to read URL parameters to pre-fill form fields:

```javascript
React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const baseUrl = urlParams.get('base_url');
    const companyId = urlParams.get('company_id');
    const email = urlParams.get('email');
    const password = urlParams.get('password');
    
    if (baseUrl) {
        setFormData(prev => ({ ...prev, baseUrl }));
    }
    
    if (companyId) {
        setFormData(prev => ({ ...prev, companyId }));
    }
    
    if (email) {
        setFormData(prev => ({ ...prev, email }));
    }
    
    if (password) {
        setFormData(prev => ({ ...prev, password }));
    }
}, []);
```

### 4. Implement Authentication

Create a function to handle login and retrieve the authentication token:

```javascript
const handleLogin = async (baseUrl, email, password, companyId) => {
    setIsLoading(true);
    setError('');
    
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
            
            // After successful login, fetch locations and messages
            // ...
            
            return token;
        } else {
            throw new Error('Invalid login response');
        }
    } catch (err) {
        // Handle errors
        setError('Login failed');
        return null;
    } finally {
        setIsLoading(false);
    }
};
```

### 5. Fetch Locations and Messages

After authentication, fetch all company locations and unread messages:

```javascript
const fetchAllLocations = async (baseUrl, companyId, token) => {
    const baseUrlWithoutTrailingSlash = baseUrl.replace(/\/$/, '');
    const response = await axios.get(
        `${baseUrlWithoutTrailingSlash}/api/mkp/v1/companies/${companyId}/locations`,
        {
            params: {
                auth_token: token
            },
            headers: {
                'Accept': 'application/json'
            }
        }
    );
    return response.data.locations || [];
};

const fetchUnreadMessages = async (baseUrl, companyId, token) => {
    const baseUrlWithoutTrailingSlash = baseUrl.replace(/\/$/, '');
    const response = await axios.get(
        `${baseUrlWithoutTrailingSlash}/my_client/users/messages/unread.json`,
        {
            params: {
                auth_token: token,
                company_id: companyId,
                with_location_ids: true
            },
            headers: {
                'Accept': 'application/json'
            }
        }
    );
    return response.data.unread || [];
};
```

### 6. Implement Message Loading with Infinite Scroll

Create a function to fetch messages for a specific location with pagination support:

```javascript
const fetchLocationMessages = async (locationId, createdBefore = null) => {
    if (!locationId || !formData.baseUrl || !authToken) return;
    
    if (!createdBefore) {
        setIsLoadingLocationMessages(prev => ({ ...prev, [locationId]: true }));
    } else {
        setLoadingMoreMessages(prev => ({ ...prev, [locationId]: true }));
    }
    
    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        const params = { auth_token: authToken, location_ids: locationId };
        if (createdBefore) params.created_before = createdBefore;
        
        const response = await axios.get(
            `${baseUrlWithoutTrailingSlash}/my_client/users/messages`,
            { params, headers: { 'Accept': 'application/json' } }
        );
        
        const messages = response.data.messages || [];
        setHasMoreMessages(prev => ({ ...prev, [locationId]: messages.length === 6 }));
        
        if (createdBefore) {
            setLocationMessages(prev => ({ ...prev, [locationId]: [...(prev[locationId] || []), ...messages] }));
        } else {
            setLocationMessages(prev => ({ ...prev, [locationId]: messages }));
        }
        
        return messages;
    } catch (err) {
        console.error('Error fetching location messages:', err);
        setMessagesError('Failed to load messages for this location. Please try again.');
        return [];
    } finally {
        if (!createdBefore) {
            setIsLoadingLocationMessages(prev => ({ ...prev, [locationId]: false }));
        } else {
            setLoadingMoreMessages(prev => ({ ...prev, [locationId]: false }));
        }
    }
};
```

### 7. Implement Message Sending

Add functionality to send new messages:

```javascript
const sendMessage = async (locationId) => {
    if (!locationId || !newMessage[locationId] || !newMessage[locationId].trim() || sendingMessage[locationId]) {
        return;
    }
    
    setSendingMessage(prev => ({ ...prev, [locationId]: true }));
    
    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        await axios.post(
            `${baseUrlWithoutTrailingSlash}/my_client/users/messages.json`,
            {
                message: {
                    content: newMessage[locationId]
                },
                auth_token: authToken,
                location_id: locationId
            },
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Clear the message input
        setNewMessage(prev => ({ ...prev, [locationId]: '' }));
        
        // Refresh messages for this location
        await fetchLocationMessages(locationId);
        
    } catch (err) {
        console.error('Error sending message:', err);
        setMessagesError('Failed to send message. Please try again.');
    } finally {
        setSendingMessage(prev => ({ ...prev, [locationId]: false }));
    }
};
```

### 8. Implement Message Read Status Updates

Add functionality to mark messages as read:

```javascript
const markMessagesAsRead = async (messages) => {
    if (!messages || messages.length === 0 || !authToken) return;
    
    // Filter for unread outgoing messages
    const unreadMessageIds = messages
        .filter(msg => msg.outgoing && !msg.read_at)
        .map(msg => msg.id);
    
    if (unreadMessageIds.length === 0) return;
    
    try {
        const baseUrlWithoutTrailingSlash = formData.baseUrl.replace(/\/$/, '');
        await axios.put(
            `${baseUrlWithoutTrailingSlash}/my_client/users/messages/mark_messages_read.json`,
            {
                messages: unreadMessageIds,
                auth_token: authToken,
                company_id: formData.companyId
            },
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Update the read_at property for these messages in our state
        setLocationMessages(prev => {
            const updatedMessages = { ...prev };
            
            Object.keys(updatedMessages).forEach(locationId => {
                if (updatedMessages[locationId]) {
                    updatedMessages[locationId] = updatedMessages[locationId].map(msg => {
                        if (unreadMessageIds.includes(msg.id)) {
                            return { ...msg, read_at: new Date().toISOString() };
                        }
                        return msg;
                    });
                }
            });
            
            return updatedMessages;
        });
        
    } catch (err) {
        console.error('Error marking messages as read:', err);
    }
};
```

### 9. Implement Real-time Updates with Polling

Set up a polling mechanism to check for new messages periodically:

```javascript
React.useEffect(() => {
    // Only set up polling if user is logged in
    if (isLoggedIn && authToken) {
        // Clear any existing interval first
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        
        // Function to refresh messages
        const refreshMessages = async () => {
            try {
                // Fetch unread messages
                const unreadMsgs = await fetchUnreadMessages(formData.baseUrl, formData.companyId, authToken);
                
                // Update unread counts for locations
                setLocations(prev => prev.map(location => ({
                    ...location,
                    unread: unreadMap[location.id] || 0
                })));
                
                // If a location is selected, refresh its messages
                if (selectedLocation) {
                    await fetchLocationMessages(selectedLocation);
                }
            } catch (err) {
                console.error('Error polling for new messages:', err);
            }
        };
        
        // Set up the interval (30 seconds = 30000 ms)
        const interval = setInterval(refreshMessages, 30000);
        setPollingInterval(interval);
        
        // Clean up function
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }
}, [isLoggedIn, authToken, formData.baseUrl, formData.companyId, selectedLocation]);
```

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mkp/v1/sessions` | POST | Authenticate user and get token |
| `/api/mkp/v1/companies/{company_id}/locations` | GET | Get all company locations |
| `/my_client/users/messages/unread.json` | GET | Get unread messages with location info |
| `/my_client/users/messages` | GET | Get messages for specific locations with pagination |
| `/my_client/users/messages.json` | POST | Send a new message |
| `/my_client/users/messages/mark_messages_read.json` | PUT | Mark messages as read |

## Query Parameters

### Authentication
- `auth_token`: The authentication token received after login
- `company_id`: The ID of the company

### Message Fetching
- `location_ids`: ID of the location to fetch messages for
- `created_before`: Timestamp for pagination (milliseconds since epoch)

### Message Sending
- `location_id`: ID of the location to send the message to
- `message.content`: Content of the message to send

## URL Parameters for Easy Testing

The application supports the following URL parameters for quick testing:

- `base_url`: The base URL of the MyTime API
- `company_id`: The ID of the company
- `email`: User email for authentication
- `password`: User password for authentication

Example URL:
```
index.html?base_url=https://www.mytime.com&company_id=123&email=user@example.com&password=yourpassword
```

## Security Considerations

- Passing passwords via URL parameters is not secure for production use
- Consider implementing token refresh mechanisms for longer sessions
- Implement proper error handling for API failures
- Use HTTPS for all API communications
