# EasySlots

A multi-vendor event booking marketplace built with vanilla HTML/CSS/JS and Firebase.

## Features

- **Multi-vendor marketplace**: Vendors can create and manage their own events
- **Flexible booking**: Support for time slots, date-based events, and seat selection
- **Ticketing system**: QR code tickets with validation
- **Payment integration**: Stripe Connect for vendor payouts
- **Real-time availability**: Live slot updates using Firestore

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Auth, Firestore, Storage, Functions, Hosting)
- **Payments**: Stripe Connect
- **Email**: SendGrid

## Project Structure

```
easyslots/
├── index.html              # Landing page
├── pages/                  # Application pages
│   ├── events/            # Event browsing & details
│   ├── booking/           # Checkout flow
│   ├── auth/              # Authentication pages
│   ├── buyer/             # Buyer dashboard
│   ├── seller/            # Vendor dashboard
│   └── vendor/            # Public vendor profiles
├── css/                    # Stylesheets
├── js/                     # JavaScript modules
│   ├── config/            # Firebase & app config
│   ├── services/          # Firebase service layers
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page-specific logic
│   └── utils/             # Utility functions
├── assets/                 # Static assets
├── templates/              # HTML templates
└── functions/              # Firebase Cloud Functions
```

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore, Auth, and Storage enabled

### Setup

1. Clone the repository
2. Update `js/config/firebase.js` with your Firebase config
3. Update `.firebaserc` with your project ID
4. Install Cloud Functions dependencies:
   ```bash
   cd functions && npm install
   ```
5. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
6. Start local development:
   ```bash
   firebase serve
   ```

### Environment Variables

Create `functions/.env` with:
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
```

## Development

- **Local server**: `firebase serve`
- **Deploy hosting**: `firebase deploy --only hosting`
- **Deploy functions**: `firebase deploy --only functions`
- **Deploy all**: `firebase deploy`

## License

MIT
