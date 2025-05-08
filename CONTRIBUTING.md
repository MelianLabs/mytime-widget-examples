# Contributing to MyTime Widget Examples

This document outlines the guidelines and best practices for developing examples in the MyTime Widget Examples repository. Following these guidelines will ensure consistency across all examples and make it easier for developers to understand and implement the code.

## Technical Requirements

### Frontend Framework and Styling
- Use React for building user interfaces
- Use Tailwind CSS for styling
- Create as little custom CSS as possible
- Ensure responsive design for all components

### JavaScript Compatibility
- Do not use optional chaining (`?.`) since we use Babel in browser
- Avoid using newer JavaScript features that may not be supported by Babel

### API Communication
- Use Axios for all API calls
- Follow MyTime API documentation for all integrations
- Include live-updating curl command examples where applicable

### Payment Processing
- Use Stripe.js for payment processing
- Use Payment Elements from Stripe for credit card forms
- Follow PCI compliance guidelines

## Security Best Practices

### API Key Handling
- **NEVER** expose partner API keys in frontend code
- **NEVER** include partner API keys as URL parameters
- Implement a backend intermediary for sensitive API calls
- Store API keys in environment variables on backend

### Secure Communication
- Use HTTPS for all API communications
- Implement CSRF protection for API endpoints
- Use proper authentication for secure endpoints

## User Experience Guidelines

### Form Handling
- Support URL parameters for pre-filling form fields
- Implement proper validation for all form inputs
- Provide clear user feedback for loading, success, and error states
- Use proper error handling with user-friendly messages

### UI/UX
- Use consistent UI components across examples
- Include clear instructions for users
- Provide feedback for all user actions
- Design for mobile-first experience

## Development Approach

### Code Changes
- Make minimal changes when possible
- Follow existing patterns and conventions
- Document any deviations from standard patterns
- Keep code simple and easy to understand

### Documentation
- Include detailed README.md files for each example
- Document all API endpoints used
- Provide step-by-step instructions for implementation
- Include security considerations and best practices

## Testing

### Manual Testing
- Test all examples in multiple browsers
- Verify mobile responsiveness
- Test with valid and invalid inputs
- Verify error handling works as expected

### API Testing
- Test with real API endpoints
- Verify all API responses are handled correctly
- Test error scenarios and edge cases

## Example Structure

Each example should include:

1. An HTML file with the implementation
2. A README.md file with detailed documentation
3. Clear comments in the code
4. Proper error handling
5. User-friendly UI with Tailwind CSS
6. Responsive design for all screen sizes
