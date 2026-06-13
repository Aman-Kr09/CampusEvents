# 🎓 CampusEvents - Stay Connected to Your Campus

**CampusEvents** is a college-specific full-stack web application that enables students to discover campus events, participate in academic discussions, track placement statistics, and stay informed through official college announcements.

The platform enforces **strict college-based content isolation**, ensuring students only access content relevant to their institution. It also features a **Scikit-Learn powered recommendation engine** that delivers personalized event suggestions based on user interests.

## 🌐 Live Demo

🔗 **Live Website:** https://campus-events-phi.vercel.app/
<p align="center">
  <a href="https://campus-events-phi.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20CampusEvents-blue?style=for-the-badge" alt="Live Demo">
  </a>
</p>

<p align="center">
  <a href="https://campus-events-phi.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Open%20Website-CampusEvents-success?style=for-the-badge&logo=vercel" />
  </a>
</p>

## ✨ Features

### 👨‍🎓 Student Features

* Secure Email/Password Authentication
* Google Sign-In Support
* Personalized Onboarding
* AI-Powered Event Recommendations
* Browse Upcoming & Trending Events
* Beautiful, Custom **Event Details Modal** (supports direct registration/join actions, clickable external links, bookmarks, views/likes counters, and description text)
* Interactive **Training & Placement Cell** portal:
  * View active recruiters and placement metrics (highest/average packages, placement rate)
  * View detailed company listings (CGPA requirements, job types, eligible branches, application deadlines)
  * Directly apply using integrated external **Google Forms** links
  * Recommend/suggest new recruiter profiles to the T&P Cell
* Academic Q&A Discussion Forum (upvoting, commenting, and answering)
* College-Specific Announcements
* Profile Management

### 🏫 College Admin Features

* Create, Edit, and Delete Events
* Review Student Event Proposals
* Approve or Reject Events
* **Training & Placement (TnP) Cell Management**:
  * Create, edit, and delete detailed placement records
  * Allow multiple placement records to be registered under the same academic year
  * Manage active recruiters with detailed profiles: CGPA cutoff, job type (Internship, FTE, FTE+PPO), blocking status, package details, form links, eligible branches, and deadlines
  * **Moderation queue** to review (Approve/Reject) recruiter entries suggested by students
  * Display dedicated contact details for the Training & Placement Cell Head
* Publish Announcements
* Moderate Q&A Discussions
* Ban/Unban Student Accounts

### 🌍 Super Admin Features

* Platform-Wide Analytics
* College Approval Workflow
* Create College Admin Accounts
* Approve, Suspend, or Remove Colleges
* System Monitoring & Governance

---

## 🤖 AI Recommendation System

### Event Recommendation Engine

The recommendation engine uses **Scikit-Learn** to generate personalized event suggestions.

#### Workflow

1. Combine:
   * Event Title
   * Description
   * Category
   * Tags
2. Generate TF-IDF vectors for all events.
3. Convert user interests into a profile vector.
4. Compute Cosine Similarity between user interests and event vectors.
5. Return ranked event recommendations.

### Automatic Tag Generation

* Extracts important keywords from event descriptions.
* Uses TF-IDF analysis.
* Generates 3–5 relevant tags automatically.
* Improves discoverability and recommendation quality.

---

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* Lucide React Icons
* Framer Motion Animations
* Recharts (Data Visualization)
* React Router DOM
* Context API

### Backend

* Node.js
* Express.js
* MongoDB & Mongoose
* JWT Authentication
* Nodemailer

### Machine Learning

* Python
* Scikit-Learn
* NumPy
* Pandas
* TF-IDF Vectorization
* Cosine Similarity

---

## 📂 Project Structure

```text
CampusEvents/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── recommendation/
│   ├── scripts/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── App.css
│   ├── vercel.json
│   └── package.json
│
├── vercel.json
└── README.md
```

---

## 🗄️ Database Models

### College

* Name
* State
* Website
* Description
* Logo
* Status

### User

* Name
* Email
* Password
* GoogleId
* Role (Student, Admin, SuperAdmin)
* College (Ref College)
* Interests
* Branch
* Year
* EventsJoined
* Badges
* Status

### Event

* Name
* Description
* Banner
* Date
* Time
* Venue
* Category
* Tags
* RegistrationLink
* College (Ref College)
* CreatedBy (Ref User)
* Status (Pending, Approved, Rejected)
* Views
* Likes
* Registrations

### Question & Answer

* Questions
* Answers
* Comments
* Upvotes

### Placement

* **college**: Reference to College
* **highestPackage**: Highest Package offered (Number in LPA)
* **averagePackage**: Average Package offered (Number in LPA)
* **placementPercentage**: Placement percentage metric (Number)
* **companiesVisited**: Array of recruiter objects:
  * **name**: Company Name (String)
  * **cpaRequired**: CGPA/CPA Cutoff requirement (String, e.g., "7.5" or "nil")
  * **package**: Offered package package (String, e.g., "12 LPA" or "nil")
  * **type**: Placement drive classification (Enum: `Blocking`, `Non-Blocking`)
  * **jobType**: Position availability (Enum: `Internship`, `FTE`, `FTE+PPO`)
  * **googleFormLink**: External application form link (String)
  * **deadline**: Form submission deadline (String)
  * **branchesEligible**: Allowed academic disciplines (String)
  * **status**: Verification status (Enum: `Pending`, `Approved`, `Rejected`)
  * **addedBy**: User ID of the suggestion sender (Ref User)
* **year**: Academic Year (Number)

### Announcement

* College Notices & Updates

### OTP

* Email Verification
* Password Reset
* Auto Expiry (10 Minutes)

---

## 🔐 Security Features

* JWT Authentication
* Role-Based Access Control (RBAC)
* College-Level Data Isolation (strict filters ensuring students only view their own institution's events, discussion forums, placements, and announcements)
* OTP-Based Password Reset
* Protected API Routes
* User Moderation Controls

---

## 🚀 Installation & Setup

### Prerequisites

* Node.js (v18+)
* MongoDB
* Python 3

### Environment Configuration

Create a `.env` file in the `/backend` folder. Below is a reference template:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Email SMTP configuration (Optional, for OTP verification and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
GMAIL_RELAY_URL=optional_gmail_relay_macro_url

# Google OAuth Configuration (Optional, for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:5173

# Super Admin Seeding Credentials (Loaded by npm run seed)
SUPER_ADMIN_EMAIL=superadmin@campusevents.com
SUPER_ADMIN_PASSWORD=SuperAdminSecure123!
```

---

### Backend Setup

1. Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

2. Create a virtual environment and install recommendation system packages:
```bash
python -m venv venv
./venv/Scripts/python.exe -m pip install scikit-learn pandas numpy
```

3. Configure your local environment file (`backend/.env`) with database credentials, setup parameters, and desired Super Admin seeding credentials.

4. Seed the database with colleges, categories, and the initial Super Admin:
```bash
npm run seed
```

5. Run the backend server:
```bash
npm run dev
```

---

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
npm install
```

2. Run the React development server:
```bash
npm run dev
```

Frontend runs at:
```text
http://localhost:5173
```

Backend API runs at:
```text
http://localhost:5000
```

---

## 🌐 Production Deployment & SPA Routing

The React frontend handles routing via React Router DOM. To prevent `404 Not Found` errors when refreshing routes in production on Vercel, the project uses `vercel.json` configurations at the root and frontend directories:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 📌 REST API Modules

### Authentication

* Register
* Login
* Google OAuth
* Forgot Password
* OTP Verification
* Reset Password
* Profile Management

### Events

* Create Events
* Recommended Events
* Trending Events
* Event Registration
* Likes & Views
* Auto Tag Generation

### Forum & Q&A

* Questions
* Answers
* Comments
* Upvotes
* Moderation

### Placement Management

* Add Statistics
* Edit Statistics
* Delete Statistics
* Suggest Company Recruiter (Student / Admin)
* Approve / Reject Suggested Recruiter (Admin Only)

### Announcements

* Create
* Update
* Delete
* View

### Administration

* College Management
* User Moderation
* Analytics Dashboard

---

## 🌟 Key Highlights

* **Full-Stack MERN Application** with clean, modern glassmorphism UI.
* **AI-Powered Event Recommendation Engine** utilizing TF-IDF and Cosine Similarity.
* **T&P Cell Portal & Recruiter Moderation Queue** to suggest, approve, track, and apply for placement drives.
* **Beautiful Event Details Modal** with rich metadata, bookmarks, registration buttons, and external hyperlinks.
* **Strict College-Specific Content Isolation** to shield and filter events/forum/placement records per college domain.
* **Multi-Role Dashboards** (Students, College Admins, and Super Admins).
* **Robust Security Suite** containing JWT, protected API routes, RBAC, and SMTP OTP verification.
* **Production Deployment Ready** featuring favicon branding, customized page titles, and Vercel routing configs.

---

## 📬 Live Application

**Website:** https://campus-events-phi.vercel.app/

CampusEvents bridges the gap between students, administrators, and campus opportunities through a secure, intelligent, and personalized campus engagement platform.
