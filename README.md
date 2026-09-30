# RideSathi · Mount Abu pilot

A portrait-first, role-based mobile MVP for the RideSathi verified rental network. The client is intentionally constrained to a mobile app surface (max 480px, bottom navigation, mobile sheets, cards, and thumb-friendly actions) and uses local mock data so the complete rental lifecycle can be demonstrated without a backend.

## Run

```bash
npm install
npm run dev
```

The preview is served on port 5173. The production build is checked with `npm run build`.

## Demo accounts

- Traveler — `traveler@demo.com` / `demo123`
- Operator — `operator@demo.com` / `demo123`
- Admin — `admin@demo.com` / `demo123`

The login screen also has one-tap demo access for each role.

## Included MVP flows

- Role-based login and separate traveler, operator, and admin bottom-tab experiences
- Mount Abu vehicle discovery, filters, verified vehicle detail, booking dates and fee breakdown
- Privacy-first KYC with masked ID display only
- Mock payment with success and failure states, 10% commission line, unique pickup token, and QR view
- Traveler bookings, timeline, active rental, consent-based location sharing, Mount Abu map simulation, SOS confirmation, and feedback
- Operator fleet management, vehicle submission for verification, booking review, manual token / QR-style handover, active rental map, return token verification, closure notes, SOS actions, and reviews
- Admin operator/vehicle approval queue, booking overview, SOS response centre, and metrics
- Local seed data for approved/pending vehicles, upcoming/active/completed bookings, a review, and a live SOS alert

No real payments, government ID APIs, background location, SMS, or WhatsApp integrations are used in the MVP.
