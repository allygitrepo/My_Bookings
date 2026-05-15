# MyBookings - Multi-Tenant SaaS Appointment Management

**MyBookings** is a professional, production-grade SaaS platform designed for businesses to manage appointments, locations, staff schedules, and payments. It features a robust multi-tenant architecture, a dynamic website generator, an embeddable booking widget, and advanced financial reporting.

---

## 🚀 Key Features

- **Multi-Tenant Architecture**: Complete data isolation with multi-business management support.
- **Dynamic Website Generator**: Businesses can launch a professional storefront in seconds with 3 curated themes (Minimal, Premium, Modern).
- **Embeddable Booking Widget**: A lightweight, API-key protected widget that can be integrated into any external website.
- **Staff & Availability Engine**: Complex scheduling logic with conflict detection and bulk schedule management.
- **Seamless Payments**: Integrated with **Razorpay** for secure transaction processing and tracking.
- **Advanced Reporting**: 
    - **Bookings Reports**: Real-time tracking of appointments and status.
    - **Payment Analytics**: Transaction history and revenue tracking.
    - **Customer Ledger**: Financial statements and pending balance tracking.
    - **PDF Export**: Professional PDF generation with company branding.
- **Google Integration**: Support for Google Login and Calendar Synchronization (ready for activation).

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **UI Architecture**: Material UI (MUI)
- **State & Logic**: Context API, React Hook Form, TanStack Table (v8)
- **Animations**: Framer Motion
- **Reports**: jsPDF & jspdf-autotable
- **Communication**: Axios with centralized interceptors

### Backend
- **Runtime**: Node.js & Express
- **ORM**: Sequelize (MySQL 8.x)
- **Security**: JWT Authentication, Bcryptjs password hashing, and Request De-duplication middleware.
- **Payment Gateway**: Razorpay Node SDK
- **Calendar API**: Google APIs (googleapis)

---

## 📂 Project Structure

```bash
My_Bookings/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── api/            # API Service Layer (Centralized Axios)
│   │   ├── components/     # Reusable UI Components
│   │   ├── context/        # Global State (Auth, Business, Search)
│   │   ├── layout/         # Dashboard & Public Layouts
│   │   ├── pages/          # Core Feature Pages (Dashboard, Reports, etc.)
│   │   ├── templates/      # Storefront Themes (Minimal, Premium, Modern)
│   │   ├── widgets/        # Embeddable Widget Logic
│   │   └── App.jsx         # Main Routing (Auth & Public)
├── server/                 # Node.js Backend (Express)
│   ├── config/             # Database & Environment configuration
│   ├── controllers/        # Business Logic (Booking, Payment, Staff)
│   ├── middleware/         # Auth, Multi-tenancy, and Duplicate Prevention
│   ├── models/             # Sequelize Schemas (Associations defined in associations.js)
│   ├── routes/             # API Endpoints (Prefix: /mybookings)
│   ├── services/           # Third-party integrations (Google Calendar, SMS)
│   └── index.js            # Entry Point
└── README.md
```

---

## 🧩 Module Breakdown

### 1. Booking Engine (`server/controllers/booking.controller.js`)
Handles the lifecycle of an appointment. Implements `business_id` scoping to ensure customers only see bookings for the specific tenant they are interacting with. Supports background Google Calendar synchronization.

### 2. Availability & Scheduling (`server/controllers/staffAvailability.controller.js`)
Manages complex staff shifts. Includes a sophisticated **Clash Detection Logic** that prevents overlapping schedules on a per-day basis, ensuring resource integrity.

### 3. Website Generator (`client/src/pages/WebsiteGenerator.jsx`)
A "No-Code" builder for businesses. Allows users to:
- Customize a unique URL slug.
- Choose from multiple high-fidelity templates.
- Preview in Desktop and Mobile modes in real-time.
- Toggle visibility (Draft/Published).

### 4. Reporting & Analytics (`client/src/pages/Reports.jsx`)
A data-driven module providing:
- **Revenue Insights**: Total earnings from confirmed bookings.
- **Ledger System**: Tracks "Total Due" vs "Paid" per customer.
- **Branded Exports**: Generates professional PDF reports with custom headers and transaction tables.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MySQL (v8.x)

### 1. Database Setup
Create a MySQL database and update the environment variables.

### 2. Backend Setup
```bash
cd server
npm install
# Configure .env (see below)
npm start
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 🔑 Environment Variables

### Server (`server/.env`)
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=my_bookings
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_id
RAZORPAY_KEY_SECRET=your_secret
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:3000/mybookings
```

---

## 🛡️ Security
- **Multi-Tenancy**: All database queries are filtered by `business_id` at the repository/middleware level.
- **Duplicate Prevention**: Custom middleware prevents accidental double-bookings or duplicate payments within a 2-second window.
- **JWT Protection**: Secured routes with token validation for all administration actions.

---

© 2025 Allysoft - Professional Booking SaaS Platform