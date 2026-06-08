# CampusEvents - "Stay Connected to Your Campus"

CampusEvents is a premium, college-specific full-stack web application designed for students to discover campus events, analyze placement history, participate in academic Q&A forums, and keep up with administration announcements. Content access is strictly isolated by college. The platform uses a local Scikit-Learn content-based recommendation system to deliver custom event feeds and includes separate dashboards for students, college administrators, and a global Super Admin.

---

## Folder Structure

```text
CampusEvents/
├── backend/
│   ├── config/             # DB connection, nodemailer mailer configurations
│   ├── controllers/        # Express route controllers (auth, events, QA, etc.)
│   ├── middleware/         # Token validations & role restriction gates
│   ├── models/             # Mongoose schemas (User, College, Event, Question, etc.)
│   ├── routes/             # Express route mappings
│   ├── recommendation/     # Python Scikit-Learn recommendations and tag scripts
│   │   ├── recommend.py
│   │   ├── generate_tags.py
│   │   └── recommendService.js
│   ├── scripts/            # Database initialization seed script
│   ├── .env                # App configuration environments
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # Navbar header & responsive containers
│   │   ├── context/        # React AuthState & SelectedCollegeContext
│   │   ├── pages/          # Landing, Login, Onboarding, Home, Profile, Dashboards
│   │   ├── styles/         # Global styles
│   │   ├── App.jsx         # Router path declarations & route guards
│   │   └── main.jsx        # App entry point
│   ├── tailwind.config.js  # Theme variables (glass, colors, glows)
│   ├── postcss.config.js
│   ├── App.css
│   └── package.json
└── README.md               # Setup & deployment guides
```

---

## MongoDB Schemas

1. **College**: Name, State, Website, Description, Logo, Status (`Pending`, `Approved`, `Suspended`).
2. **User**: Name, Email, Password, GoogleId, Role (`SuperAdmin`, `Admin`, `Student`), College (Ref), Interests (Array of Strings), Branch, Year, EventsJoined (Array of Refs), Badges (Array of Strings), Status (`Active`, `Banned`).
3. **Event**: Name, Description, Banner, Date, Time, Venue, Category, Tags (Array of Strings), RegistrationLink, College (Ref), CreatedBy (Ref), Status (`Pending`, `Approved`, `Rejected`), Views, Likes (Array of User Refs), Registrations (Array of User Refs).
4. **Question**: Title, Content, User (Ref), College (Ref), Upvotes (Array of User Refs), Comments (Embedded array of Comment Objects containing user, name, content, date), AnswersCount.
5. **Answer**: Question (Ref), Content, User (Ref), Upvotes (Array of User Refs).
6. **Placement**: College (Ref), HighestPackage, AveragePackage, PlacementPercentage, CompaniesVisited (Array of Strings), Year.
7. **Announcement**: College (Ref), Title, Content, CreatedBy (Ref).
8. **OTP**: Email, OTP string, CreatedAt (auto self-expires in 10 minutes via MongoDB TTL indexing).

---

## REST APIs

### Authentication & Profiles
*   `POST /api/auth/register` - Registers a student to a college.
*   `POST /api/auth/login` - Signs in standard user/admin.
*   `POST /api/auth/google` - Simulates/executes Google OAuth sign-in.
*   `POST /api/auth/forgotpassword` - Generates reset OTP and prints/sends mail.
*   `POST /api/auth/verifyotp` - Validates reset OTP code.
*   `POST /api/auth/resetpassword` - Resets account password using verified email.
*   `GET /api/auth/me` - Retrieves current logged-in profile metrics.
*   `PUT /api/auth/profile` - Edits student credentials.
*   `PUT /api/auth/profile/onboarding` - Saves onboarding interests, branch, and year.

### Colleges
*   `GET /api/colleges` - Lists all approved colleges for search selectors.
*   `POST /api/colleges/request` - Requests a new college (Pending status).

### Events
*   `GET /api/events` - Lists approved events in the student's college.
*   `GET /api/events/recommended` - Returns interest-based, Scikit-Learn recommended events.
*   `GET /api/events/timeline` - Timeline view of upcoming events.
*   `GET /api/events/trending` - Returns trending events (views + likes*5 + registrations*10).
*   `POST /api/events` - Proposes an event (auto-approved if Admin, pending if Student).
*   `POST /api/events/generate-tags` - Uses Scikit-Learn TF-IDF to generate tags from description.
*   `POST /api/events/:id/register` - Registers/unregisters student for an event.
*   `POST /api/events/:id/like` - Likes/unlikes an event.
*   `POST /api/events/:id/view` - Records viewing stats.

### Forum & Q&A
*   `GET /api/qa/questions` - Lists all discussion threads in college board.
*   `GET /api/qa/questions/:id` - Returns thread details and replies.
*   `POST /api/qa/questions` - Asks a question.
*   `POST /api/qa/questions/:id/upvote` - Upvotes/un-upvotes question.
*   `POST /api/qa/questions/:id/comments` - Adds a comment to a question thread.
*   `POST /api/qa/questions/:id/answers` - Answers a question thread.
*   `POST /api/qa/answers/:id/upvote` - Upvotes/un-upvotes answer.
*   `DELETE /api/qa/questions/:id` - Deletes thread (author or admin moderation).
*   `DELETE /api/qa/answers/:id` - Deletes reply.

### College Admin
*   `GET /api/events/admin/pending` - Lists pending events proposed by students.
*   `PUT /api/events/:id/review` - Approves or rejects event proposal.
*   `PUT /api/events/:id` - Edits event details.
*   `DELETE /api/events/:id` - Deletes active event.
*   `GET /api/placements` - Retrieves recruitment historical stats.
*   `POST /api/placements` - Posts recruitment year statistics.
*   `PUT /api/placements/:id` - Edits statistics.
*   `DELETE /api/placements/:id` - Deletes statistics.
*   `GET /api/announcements` - Lists bulletins.
*   `POST /api/announcements` - Posts broadcast bulletins.
*   `PUT /api/announcements/:id` - Edits bulletins.
*   `DELETE /api/announcements/:id` - Deletes bulletins.
*   `GET /api/qa/users` - Lists all students for moderation.
*   `PUT /api/qa/users/:id/ban` - Bans or unbans a student account.

### Super Admin
*   `GET /api/superadmin/analytics` - System-wide scaling statistics.
*   `GET /api/superadmin/colleges` - Lists all registered colleges.
*   `PUT /api/superadmin/colleges/:id/status` - Approves, rejects, or suspends college.
*   `POST /api/superadmin/admins` - Creates administrative moderators accounts.
*   `DELETE /api/superadmin/colleges/:id` - Deletes college cascade accounts.

---

## AI Recommendation Engine

1.  **Event Recommendations (`backend/recommendation/recommend.py`)**:
    *   Fuses event text metrics (Title, Description, Category, Tags) to build a semantic content document representation.
    *   Generates TF-IDF vector models of all college events, ignoring English stop words.
    *   Projects user selected interests onto the same TF-IDF space to create a target User Profile vector.
    *   Computes Cosine Similarity between user interest vector and all event vectors.
    *   Returns descending similarity ranked event IDs.

2.  **Tag Suggestion Generator (`backend/recommendation/generate_tags.py`)**:
    *   Splits descriptions into tokenized sentences.
    *   Applies a local TF-IDF model against a balanced general-text corpus to evaluate keyword term frequencies.
    *   Extracts the highest scoring words, filters out stop words and generic tokens, and returns 3-5 custom tag recommendations.

---

## Deployment & Setup Guide

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Installed and running locally on `mongodb://localhost:27017`)
*   Python 3 (Available via `python` or `python3` command)

### Installation Steps

1.  **Clone / Navigate to workspace root**:
    ```bash
    cd CampusEvents
    ```

2.  **Install & Setup Backend**:
    ```bash
    cd backend
    npm install
    ```
    *   Configure `.env` file (already initialized with local MongoDB details).
    *   Create the Python virtual environment and download libraries:
    ```bash
    python -m venv venv
    .\venv\Scripts\python.exe -m pip install scikit-learn pandas numpy
    ```

3.  **Seed Database**:
    Initialize the default superadmin account:
    ```bash
    npm run seed
    ```

4.  **Install Frontend**:
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Project Locally

*   **Start the Express Server**:
    In the `backend` folder, execute:
    ```bash
    npm run dev
    ```
    The server will startup on port `5000` and connect to the local MongoDB database.

*   **Start the Vite Frontend**:
    In the `frontend` folder, execute:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:5173`.

---
