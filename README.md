# RentEase — Electronics Rental Platform (MERN)

A full-stack starter project for renting electronics such as mobiles, laptops, tablets, cameras and accessories.

## Requirements
- Node.js 18+
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- VS Code (recommended)

## 1. Configure the backend
Open a terminal in the `RentEase` folder:

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and edit it if needed. The default local MongoDB URL is:
`mongodb://127.0.0.1:27017/rentease`

Create demo products and a demo account:

```bash
npm run seed
```

Demo login:
- Email: `demo@rentease.com`
- Password: `password123`

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

## 2. Start the React website
Open a second terminal in the `RentEase` folder:

```bash
cd client
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Features
- Responsive home page and product catalogue
- Category filters and keyword search
- Register, login and logout with JWT authentication
- Product detail modal
- Rental booking with start/end dates and automatic day/price calculation
- My Rentals page with booking status
- MongoDB persistence through Express API
- Demo seed data

## Notes
- This is a college-project starter, not a production payment platform.
- Payments are simulated; do not enter real card details.
- For production, add payment gateway integration, image storage, validation/rate limiting, email verification, HTTPS and deployment secrets.
