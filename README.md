# 🎓 CampusEvents - Stay Connected to Your Campus

**CampusEvents** is a college-specific full-stack web application that enables students to discover campus events, participate in academic discussions, track placement statistics, and stay informed through official college announcements.

The platform enforces **strict college-based content isolation**, ensuring students only access content relevant to their institution. It also features a **Scikit-Learn powered recommendation engine** that delivers personalized event suggestions based on user interests.

## 🌐 Live Demo

🔗 **Live Website:** https://campus-events-phi.vercel.app/

---

## ✨ Features

### 👨‍🎓 Student Features

* Secure Email/Password Authentication
* Google Sign-In Support
* Personalized Onboarding
* AI-Powered Event Recommendations
* Browse Upcoming & Trending Events
* Event Registration & Participation Tracking
* Like and Save Events
* Academic Q&A Discussion Forum
* Placement Statistics Dashboard
* College-Specific Announcements
* Profile Management

### 🏫 College Admin Features

* Create, Edit, and Delete Events
* Review Student Event Proposals
* Approve or Reject Events
* Manage Placement Records
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
* React Router DOM
* Context API

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
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
│   └── package.json
│
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
* Role
* College
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
* College
* CreatedBy
* Status
* Views
* Likes
* Registrations

### Question & Answer

* Questions
* Answers
* Comments
* Upvotes

### Placement

* Highest Package
* Average Package
* Placement Percentage
* Companies Visited
* Year

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
* College-Level Data Isolation
* OTP-Based Password Reset
* Protected API Routes
* User Moderation Controls

---

## 🚀 Installation & Setup

### Prerequisites

* Node.js (v18+)
* MongoDB
* Python 3

### Backend Setup

```bash
cd backend
npm install
```

Create Python environment and install dependencies:

```bash
python -m venv venv
./venv/Scripts/python.exe -m pip install scikit-learn pandas numpy
```

Seed database:

```bash
npm run seed
```

Start backend server:

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

Backend runs at:

```text
http://localhost:5000
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

* Full-Stack MERN Application
* AI-Powered Event Recommendation Engine
* College-Specific Content Isolation
* Multi-Role Dashboard System
* Scalable MongoDB Architecture
* Responsive Modern UI
* Automated Tag Generation
* Placement Analytics Module
* Academic Q&A Forum
* Production Deployment on Vercel

---

## 📬 Live Application

**Website:** https://campus-events-phi.vercel.app/

CampusEvents bridges the gap between students, administrators, and campus opportunities through a secure, intelligent, and personalized campus engagement platform.
