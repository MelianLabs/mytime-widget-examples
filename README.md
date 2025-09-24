# MyTime Widget Examples

This repository contains example applications demonstrating how to integrate with the [MyTime Public API](https://www.mytime.com/api/mkp/v1/docs). The API enables businesses and developers to implement appointment booking functionality directly into their websites or applications using MyTime.com's scheduling platform.

## Purpose

These examples showcase how to use the MyTime Public API to:
- Allow customers to book appointments on MyTime.com
- Integrate MyTime's scheduling capabilities into your own website
- Access MyTime's marketplace functionality
- Process payments and manage credit cards
- Create users, clients, and leads
- Purchase and manage gift cards

## API Documentation

For detailed API documentation and endpoints, visit:
https://www.mytime.com/api/mkp/v1/docs

## Common Technologies

All examples in this repository use:
- **React**: For building the user interface
- **Axios**: For making API calls to MyTime's Public API
- **Tailwind CSS**: For styling with minimal custom CSS
- **Modern JavaScript**: ES6+ features with Babel for compatibility

## Available Examples

Each example includes its own detailed README.md with step-by-step instructions on how to build a similar application.

1. [**Book Services**](./book_services/README.md) - A complete appointment booking flow with user authentication
   - Demonstrates the standard booking workflow from location selection to confirmation

2. [**Book Services Guest**](./book_services_guest/README.md) - Appointment booking as a guest user
   - Similar to the standard booking flow but uses guest authentication
   - Optional employee selection

3. [**Client/Lead Creation**](./client_lead_creation/README.md) - Create clients or leads through the API
   - Client type selection (Client or Lead)
   - Comprehensive error handling

4. [**Sign Up**](./sign_up/README.md) - User registration flow
   - Form fields for user information
   - Success state showing user details

5. [**Purchase Memberships**](./purchase_memberships/README.md) - Purchase memberships through the API
   - Browse and select memberships by location
   - Complete purchases with payment method tokens
   - View purchase confirmation and details

6. [**Stripe Add/Remove Credit Card**](./stripe_add_remove_credit_card/README.md) - Manage credit cards with Stripe
   - Secure credit card entry with Stripe Elements
   - View and delete existing cards

6. [**Gift Card Without Saving Credit Card**](./gift_card_without_saving_credit_card/README.md) - Gift card purchases with Stripe
   - One-time payment processing
   - Email-based gift card delivery

7. [**Cloud9 Credit Cards**](./cloud9_credit_cards/README.md) - Credit card management with Cloud9
   - Cloud9 iframe integration for secure credit card entry
   - Add and remove credit cards

8. [**Purchase Packages**](./purchase_packages/README.md) - Complete package purchase flow with authentication
   - User login and client record creation
   - Browse and select packages (bundles)
   - Add packages to cart and complete purchase with card ID

9. [**Communicator**](./comunicator/README.md) - Client-staff messaging interface
   - View and send messages across company locations
   - Infinite scrolling for message history
   - Real-time message updates with automatic polling
   - Mark messages as read automatically

10. [**ACH Setup**](./ach_setup/README.md) - ACH payment setup integration
    - User authentication and client record creation
    - ACH access token generation
    - Automatic ACH widget opening with company configuration
    - Manual token regeneration and widget access controls
   
   **IMPORTANT SECURITY NOTE:** Please do not store the partner API key required for the webseed API call in your frontend code, as this poses a serious security risk. You'll need to implement a backend service that handles the API calls to webseed using the partner API key securely stored on your backend, and then pass the necessary data to your frontend.

## Getting Started

To use these examples:

1. Clone this repository
2. Open the example HTML files in a web browser
3. You'll need a MyTime company ID and API base URL
4. Enter your credentials in the provided form
5. Follow the flow to test the integration

For detailed implementation instructions, refer to the README.md file in each example directory.

## Security Considerations

- Never store API keys or sensitive credentials in client-side code
- Use HTTPS for all API calls
- Follow best practices for handling user authentication tokens
- Consider implementing a backend service for sensitive operations

For detailed API documentation and endpoint specifications, refer to the [MyTime Public API Documentation](https://www.mytime.com/api/mkp/v1/docs).