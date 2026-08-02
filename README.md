# 🎓 CampusEvents - Stay Connected to Your Campus

**CampusEvents** is a modern, AI-powered, college-specific full-stack platform that enables students to discover campus events, engage in real-time academic discussions, track placement opportunities, share rides, trade items on the campus marketplace, download PYQs, and stay updated with official college announcements—all within a secure, personalized ecosystem.

Built with the **MERN Stack**, **Redis**, **BullMQ**, **Socket.IO**, **Groq AI (Llama 3.3 70B)**, and **Scikit-Learn**, the platform delivers **AI-powered event recommendations**, **location-based cab sharing with Google Maps**, **real-time Q&A discussions**, **India-based live job feeds**, **persistent job application tracking**, and **high-performance caching** for a fast and scalable user experience.

The platform enforces **strict college-based content isolation**, ensuring students can only access content relevant to their institution. Advanced backend optimizations—including **Redis caching**, **bulk write buffering**, **asynchronous email & AI tag generation**, and **real-time WebSocket communication**—provide enterprise-grade performance, scalability, and security.

---

## 🌐 Live Demo

🔗 **Live Website:** https://campus-events-phi.vercel.app/

<p align="center">
  <a href="https://campus-events-phi.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20CampusEvents-blue?style=for-the-badge" alt="Live Demo">
  </a>
</p>

---

## ✨ Features

### 👨‍🎓 Student Features

* **Secure Authentication & Onboarding**:
  * Email/Password & Google Sign-In support
  * OTP-based password reset via Nodemailer / Google SMTP
  * Branch, year, and interest-based onboarding customization
* **AI-Powered Event Hub**:
  * Scikit-Learn TF-IDF Cosine Similarity recommendations based on student interest profiles
  * Browse Upcoming & Trending events with instant category filtering
  * Event Details Modal with registrations counter, view/like metrics, bookmarks, and external links
* **Training & Placement Cell & Job Tracker**:
  * View active campus recruiters and placement statistics (highest/average packages, placement rate)
  * Detailed company listings (CGPA requirements, job types, eligible branches, application deadlines)
  * **Live India Off-Campus Tech Job Feed**: Automated live aggregation from LinkedIn Jobs (India), Arbeitnow, Remotive, & Himalayas
  * **Persistent Job Application Tracker**: Mark On-Campus and Off-Campus jobs as **Applied** (`✓ Applied`). Applied jobs remain saved permanently on student profiles even after live feed updates
  * Suggest recruiter profiles directly to the college T&P Cell
* **🚕 Location-Based Cab Sharing**:
  * Post ride offers or requests with departure time, fare split, seats available, and contact details
  * Interactive **Google Maps** integration displaying origin, destination, and direct navigation directions links
  * Real-time ride chat drawer and passenger join/leave management
* **🛍️ Campus Marketplace**:
  * Buy, sell, and rent textbooks, electronics, dorm essentials, and lab gear within your college campus
  * Filter by price, category, condition, and item status
* **📚 Previous Year Question (PYQ) Repository**:
  * Access subject-wise PYQs organized by branch and semester
  * Fast Cloudinary file preview and download links
* **🤖 Groq AI Assistant (`CampusAI`)**:
  * Powered by `llama-3.3-70b-versatile`
  * Real-time context awareness of live campus events, marketplace listings, cab shares, PYQs, and placement drives
* **Academic Q&A Forum**: Real-time Socket.IO discussion boards (upvoting, commenting, and answering)
* **College-Specific Announcements**: Official notices published directly by college administrators

---

### 🏫 College Admin Features

* **Event Management**: Create, edit, approve student event proposals, or remove events
* **Training & Placement (TnP) Cell Management**:
  * Add, edit, and manage placement records and statistics
  * Manage active recruiters with detailed profiles: CGPA cutoff, job type (Internship, FTE, FTE+PPO), blocking status, package details, form links, eligible branches, and deadlines
  * Recruiter Moderation Queue to review and approve/reject recruiter suggestions submitted by students
* **Announcement Publishing**: Broadcast official notices to all enrolled students
* **Forum Moderation & Account Controls**: Moderate Q&A discussions and ban/unban student accounts

---

### 🌍 Super Admin Features

* Platform-Wide Analytics Dashboard (total colleges, total students, total events, active drives)
* College Approval Workflow (approve, suspend, or onboard new institutions)
* Create College Admin Accounts and assign institution namespaces
* Environment-based credential management (`SUPER_ADMIN_EMAIL` & `SUPER_ADMIN_PASSWORD`)

---

## 🤖 AI Recommendation & Assistant System

### 1. Event Recommendation Engine
The recommendation engine uses **Scikit-Learn** in Python to generate personalized event suggestions.
* Extracts event titles, descriptions, categories, and tags.
* Computes TF-IDF vectors for all events and converts student interest profiles into feature vectors.
* Ranks event recommendations via Cosine Similarity.

### 2. Automatic Tag Generation
* Extracts key topics from event descriptions using TF-IDF analysis.
* Automatically generates 3–5 relevant tags to improve search discoverability.

### 3. Groq AI Campus Assistant
* Integrated with Groq (`llama-3.3-70b-versatile`).
* Dynamically fetches live database context (Marketplace items, Cab rides, PYQs, Placements, Events) to answer student queries contextually.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React.js (Vite), React Router DOM, Context API
* **Styling & Motion**: Tailwind CSS, Framer Motion
* **Icons & Maps**: Lucide React Icons, Google Maps API (`CabGoogleMap.jsx`)
* **Data Visualization**: Recharts

### Backend
* **Runtime & Framework**: Node.js, Express.js
* **Database & ORM**: MongoDB, Mongoose
* **Caching & Queues**: Upstash Redis, BullMQ
* **Real-time WebSockets**: Socket.IO
* **AI & LLM Integration**: Groq SDK (`llama-3.3-70b-versatile`), Python Scikit-Learn
* **File Storage & Auth**: Cloudinary (PYQs), JWT, bcryptjs, Nodemailer (Gmail SMTP / Relay)

---

## 📂 Project Structure

```text
CampusEvents/
├── backend/
│   ├── config/             # DB connection, Redis setup, SMTP config
│   ├── controllers/        # Auth, Event, Placement, RideShare, Marketplace, Assistant controllers
│   ├── middleware/         # JWT Auth, Role Authorization, Rate Limiting
│   ├── models/             # Mongoose schemas (User, Event, Placement, RideShare, Marketplace, etc.)
│   ├── routes/             # REST API endpoints
│   ├── recommendation/     # Python TF-IDF recommendation scripts
│   ├── services/           # Live Job Feed aggregator (LinkedIn India, Arbeitnow, Remotive)
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # CampusAssistant, CabGoogleMap, EventModal, Navbar, Footer
│   │   ├── context/        # AuthContext, CollegeContext
│   │   ├── pages/          # Home, Profile, CampusConnect, PYQ, Marketplace, Admin, SuperAdmin
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── package.json
│
├── vercel.json
└── README.md
```

---

## 🗄️ Database Models Summary

* **User**: Name, Email, Password, Role (`Student`, `Admin`, `SuperAdmin`), College (Ref), Interests, Branch, Year, `eventsJoined`, `appliedJobs`, Badges, Status.
* **College**: Name, State, Website, Description, Logo, Status.
* **Event**: Name, Description, Banner, Date, Time, Venue, Category, Tags, RegistrationLink, College (Ref), CreatedBy (Ref), Status (`Pending`, `Approved`, `Rejected`), Views, Likes, Registrations.
* **Placement**: College (Ref), HighestPackage, AveragePackage, PlacementPercentage, CompaniesVisited (CGPA cutoff, package, type, jobType, googleFormLink, deadline, branchesEligible, status), Year.
* **RideShare (Cab Sharing)**: College (Ref), Host (Ref User), Origin, Destination, DepartureTime, SeatsAvailable, Passengers, FareSplit, ContactPhone, Notes, MapUrl, Status.
* **MarketplaceItem**: College (Ref), Seller (Ref User), Title, Description, Price, Category, Condition, Images, ContactInfo, Status (`Available`, `Sold`).
* **Question & Answer**: College (Ref), Author (Ref User), Title, Body, Category, Upvotes, Answers, Comments.
* **Announcement**: College (Ref), Title, Content, Priority, CreatedBy (Ref User).

---

## 🔐 Security & Data Isolation Features

* **Strict College Data Isolation**: Every resource (Events, Discussions, Placements, Marketplace, Cab Rides) is filtered by college namespace to prevent cross-institution data leakage.
* **JWT & Role-Based Access Control (RBAC)**: Enforces access bounds across `Student`, `College Admin`, and `SuperAdmin`.
* **Rate Limiting & Password Hashing**: Upstash Redis rate limiting protection and single-hash bcrypt security.
* **Environment Credentials**: SuperAdmin and secret keys configured entirely through untracked environment variables (`.env`).

---

## 🚀 Installation & Setup

### Prerequisites
* Node.js (v18+)
* MongoDB (Local or MongoDB Atlas)
* Python 3 (for TF-IDF recommendations)

### Environment Setup (`backend/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# SMTP Configuration (for OTP verification and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Groq AI Key (for Campus AI Assistant)
GROQ_API_KEY=your_groq_api_key

# Super Admin Credentials
SUPER_ADMIN_EMAIL=your_super_admin_email@gmail.com
SUPER_ADMIN_PASSWORD=your_super_admin_password
```

### Running the Application

1. **Install Backend Dependencies & Start Server**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Install Frontend Dependencies & Start App**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Frontend runs at `http://localhost:5173` and Backend runs at `http://localhost:5000`.

---

## 📬 Live Application

🔗 **Website:** https://campus-events-phi.vercel.app/

CampusEvents bridges the gap between students, administrators, and campus opportunities through a secure, intelligent, and unified campus ecosystem.
