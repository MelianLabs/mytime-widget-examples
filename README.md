# MyTime Widget Examples

This repository contains HTML example files demonstrating how to integrate with the [MyTime Public API](https://www.mytime.com/api/mkp/v1/docs). The API enables businesses and developers to implement appointment booking functionality directly into their websites or applications using MyTime.com's scheduling platform.

## Purpose

These examples showcase how to use the MyTime Public API to:
- Allow customers to book appointments on MyTime.com
- Integrate MyTime's scheduling capabilities into your own website
- Access MyTime's marketplace functionality

## API Documentation

For detailed API documentation and endpoints, visit:
https://www.mytime.com/api/mkp/v1/docs

## Getting Started

Browse through the HTML examples in this repository to understand how to implement various booking scenarios and API integrations. Each example includes comments and demonstrates best practices for using the MyTime Public API.

## Available Examples

1. `book_services_no_credit_card/` - A React-based example demonstrating a complete appointment booking flow without credit card requirements. Features include:
   - Company and location selection
   - Service and variation browsing
   - Real-time availability checking
   - Date and time slot selection
   - Cart management
   - User authentication
   - Booking confirmation

2. `stripe_add_remove_credit_card/` - Shows how to integrate Stripe payment processing for managing credit cards in the booking process

## Implementation Notes

- The examples use React and modern JavaScript features
- API endpoints are accessed through standard REST calls using Axios
- Authentication is handled via user tokens
- The booking flow follows MyTime's standard workflow:
  1. Select location and service
  2. Choose available time slots
  3. Add to cart
  4. User authentication
  5. Booking confirmation

## Getting Started with the API

To use these examples:

1. You'll need a MyTime company ID and API base URL
2. Load the example HTML files in a web browser
3. Enter your company ID and base URL in the provided form
4. Follow the booking flow to test the integration

For detailed API documentation and endpoint specifications, refer to the [MyTime Public API Documentation](https://www.mytime.com/api/mkp/v1/docs).