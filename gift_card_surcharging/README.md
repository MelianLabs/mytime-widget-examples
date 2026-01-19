# MyTime Gift Card Purchase with Surcharging

## Demo

![Demo](./gift_card_surcharging.gif)

[Download Full Video](./gift_card_surcharging.webm)

## Overview

This directory contains an example application demonstrating how to integrate with MyTime's Public API and Stripe to process gift card purchases **with surcharging** without saving the customer's credit card information.

This example extends the basic gift card purchase flow by adding surcharge calculation. Since we don't know the customer's card type (credit vs debit) until they enter their card details, we:

1. Fetch surcharge rates for **both** credit and debit cards
2. Use the **maximum** surcharge amount to authorize the payment
3. The backend will capture the **correct** amount based on the actual card type used

## Key Differences from Basic Gift Card Example

### Surcharge Calculation

When the user enters an amount, we fetch surcharges for both card types:

```javascript
// Fetch surcharges for both credit and debit
const [creditSurcharge, debitSurcharge] = await Promise.all([
  fetchSurcharge("credit", amount, locationId),
  fetchSurcharge("debit", amount, locationId),
]);

// Get the max surcharge amount
const maxSurchargeAmount = Math.max(
  creditSurcharge.surcharge_amount || 0,
  debitSurcharge.surcharge_amount || 0,
);
```

### Payment Session with Total Amount

When requesting the payment session, we include the surcharge in the amount:

```javascript
const sessionResponse = await axios.get(
  `${baseUrl}/api/mkp/v1/user/payment_methods/session`,
  {
    params: {
      company_id: formData.companyId,
      location_id: selectedLocation.id,
      callback_url: callbackUrl,
      payment_type: "card",
      add_to_client: false,
      guest: false,
      amount: baseAmount + surchargeAmount, // Total with surcharge
      stripe_account_id: selectedLocation.payment_account.stripe_account_id,
    },
    headers: {
      gauthorization: guestToken,
    },
  },
);
```

### Completing with Surcharge Flag

When completing the gift card purchase, we include the `add_surcharge` flag:

```javascript
const completeResponse = await axios.post(
  `${baseUrl}/api/mkp/v1/gift_card_purchases/${giftCardId}/complete`,
  {
    add_surcharge: true, // Enable surcharging
    card_type: "credit", // Card type for surcharge calculation
    payment_intent: paymentIntent,
  },
  {
    headers: {
      gauthorization: guestToken,
    },
  },
);
```

## API Endpoints Used

| Endpoint                                       | Method | Description                                         |
| ---------------------------------------------- | ------ | --------------------------------------------------- |
| `/api/mkp/v1/surcharges`                       | GET    | Fetch surcharge for a specific card type and amount |
| `/api/mkp/v1/companies/:id`                    | GET    | Fetch company data including locations              |
| `/api/mkp/v1/guests`                           | POST   | Register as a guest user                            |
| `/api/mkp/v1/gift_card_purchases`              | POST   | Create a gift card purchase                         |
| `/api/mkp/v1/user/payment_methods/session`     | GET    | Get a payment session for Stripe                    |
| `/api/mkp/v1/gift_card_purchases/:id/complete` | POST   | Complete a gift card purchase with payment intent   |

### Surcharge Endpoint Details

**Request:**

```
GET /api/mkp/v1/surcharges?card_type=credit&amount=30&location_id=1553
```

**Response:**

```json
{
  "surcharge_amount": 0.4,
  "surcharge_configuration_item": {
    "id": 12,
    "card_type": "both",
    "flat_amount": 0.1,
    "percentage_amount": 1
  }
}
```

## Flow Diagram

```
1. User enters gift card details and amount
   ↓
2. Fetch surcharges for credit AND debit cards
   ↓
3. Calculate max surcharge = max(credit_surcharge, debit_surcharge)
   ↓
4. Display total = base_amount + max_surcharge
   ↓
5. Initialize Stripe with total amount
   ↓
6. Create gift card purchase (with base amount)
   ↓
7. Get payment session with TOTAL amount (base + surcharge)
   ↓
8. Confirm payment with Stripe
   ↓
9. Complete gift card with add_surcharge=true
   ↓
10. Backend captures correct amount based on actual card type
```

## Why Max Surcharge?

Since we don't know the customer's card type before they enter their card:

- **Authorization**: We authorize for the maximum possible surcharge
- **Capture**: The backend captures the correct amount based on the actual card type
- This ensures we never under-authorize while still charging the correct surcharge

## Technologies Used

- **React**: For building the user interface
- **Axios**: For making API calls to MyTime's Public API
- **Tailwind CSS**: For styling the application
- **Stripe.js**: For secure payment processing with Payment Elements

## Testing

1. Open `index.html` in a web browser
2. Enter the base URL (e.g., `http://localhost:3000`) and company ID
3. Select a location that has surcharging configured
4. Fill in the gift card form and enter an amount
5. Observe the surcharge calculation displayed
6. Enter test card details (e.g., 4242 4242 4242 4242)
7. Complete the purchase

## URL Parameters

- `base_url`: The base URL for the MyTime API
- `company_id`: The ID of the company
- `gc_id`: The ID of the gift card (used in payment callbacks)
- `payment_status`: The status of the payment (used in payment callbacks)

Example: `index.html?base_url=http://localhost:3000&company_id=751`
