# Job Tracker

A full-stack job application tracking system with AI-powered features. Built with **Spring Boot 3.5 + Java 21** (backend) and **React 19 + Tailwind CSS** (frontend).

## Architecture

```
job-tracker-backend/           # Spring Boot REST API (port 8081)
├── src/main/java/com/jobtracker/
│   ├── config/               # Security (JWT), Swagger config
│   ├── controller/           # REST controllers (8 controllers)
│   ├── dto/                  # Request/Response DTOs
│   ├── entity/               # JPA entities (User, Application, Interview, Resume, Notification)
│   ├── exception/            # Global exception handler
│   ├── repository/           # Spring Data JPA repositories
│   ├── scheduler/            # Notification scheduler
│   ├── security/             # JWT provider, filter, UserDetailsService
│   ├── service/              # Business logic (8 services)
│   └── util/                 # Mappers, auth utilities
├── src/main/resources/
│   ├── application.yml       # Default config
│   └── application-prod.yml  # Production overrides
└── pom.xml

job-tracker-frontend/          # React SPA (port 3000 / 80)
├── src/
│   ├── api/                  # Axios client + 7 API modules
│   ├── components/           # Layout, forms, common components
│   ├── context/              # AuthContext (JWT-based)
│   ├── pages/                # 7 pages (Dashboard, Applications, Interviews, Resume, AI, Login, Register)
│   └── routes/               # PrivateRoute, AdminRoute guards
└── package.json
```

## Features

- **Job Application Tracking** -- Full CRUD with status pipeline (Applied -> Assessment -> Technical -> HR -> Selected/Rejected/Offer)
- **Interview Management** -- Log interview experiences with types, questions, results
- **Resume Management** -- Upload multiple PDF versions, set active, versioning
- **Dashboard & Analytics** -- Monthly trends, status breakdown charts (Recharts), success/rejection rates
- **Notifications** -- Scheduled reminders for upcoming interviews, assessments, follow-ups
- **AI Career Assistant** (powered by Groq Chat Completions):
  - Resume ATS analysis with scoring
  - Interview question generation per role
  - Skill gap analysis with learning path
  - Placement preparation guide
- **JWT Authentication** -- Register, login, role-based access (STUDENT / ADMIN)
- **Paginated, Filterable APIs** -- All list endpoints support pagination, sorting, keyword search, status filtering
- **Dockerized** -- Multi-stage Docker builds, docker-compose orchestration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.5.14, Java 21, Maven |
| Security | Spring Security, JWT (jjwt 0.11.5) |
| Database | MySQL 8 (HikariCP), JPA / Hibernate |
| AI | Groq Chat Completions (`llama-3.3-70b-versatile` default) |
| API Docs | SpringDoc OpenAPI 2.8.9 (`/swagger-ui.html`) |
| Frontend | React 19, React Router 7, Axios |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 3 |
| Toasts | React Hot Toast |
| DevOps | Docker, GitHub Actions CI/CD |

## Quick Start

### Prerequisites

- Java 21, Maven 3.9+, Node.js 20+
- MySQL 8 running locally (or use Docker)
- Groq API key (for AI features)

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `8081` | Backend port |
| `MYSQL_HOST` | `localhost` | MySQL host |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_DB` | `job_tracker_db` | Database name |
| `MYSQL_USER` | `jobtracker` | DB user |
| `MYSQL_PASSWORD` | `jobtracker123` | DB password |
| `JWT_SECRET` | (256-bit key) | JWT signing secret |
| `JWT_EXPIRATION` | `86400000` | Token TTL (ms, 24h) |
| `GROQ_API_KEY` | _required_ | Groq API key |
| `GROQ_API_URL` | `https://api.groq.com/openai/v1/chat/completions` | Groq Chat Completions endpoint |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model name |
| `GROQ_CONNECT_TIMEOUT_MS` | `10000` | Groq connect timeout |
| `GROQ_READ_TIMEOUT_MS` | `30000` | Groq read timeout |

### Run with Docker (recommended)

```bash
# Set your Groq API key
set GROQ_API_KEY=your_key_here

# Start all services
docker-compose up --build
```

This starts MySQL (port 3307), backend (port 8081), and frontend (port 80).

### Run locally

**Backend:**
```bash
# Ensure MySQL is running on localhost:3306 with database job_tracker_db
mvn spring-boot:run
```

**Frontend:**
```bash
cd job-tracker-frontend
npm install
npm start   # Starts on port 3000, proxies API calls to localhost:8081
```

## API Overview

All endpoints prefixed with `/api/v1`.

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /auth/register` | Public | Register |
| `POST /auth/login` | Public | Login (returns JWT) |
| `GET /auth/me` | User | Current user info |
| `GET /applications` | User | List (paginated, filterable) |
| `POST /applications` | User | Create |
| `PUT /applications/{id}` | User | Update |
| `PATCH /applications/{id}/status` | User | Quick status change |
| `DELETE /applications/{id}` | User | Delete |
| `GET /interviews` | User | List (paginated) |
| `POST /interviews` | User | Create |
| `PUT /interviews/{id}` | User | Update |
| `DELETE /interviews/{id}` | User | Delete |
| `POST /resumes/upload` | User | Upload PDF |
| `GET /resumes` | User | List |
| `GET /resumes/{id}/download` | User | Download file |
| `PATCH /resumes/{id}/activate` | User | Set active |
| `DELETE /resumes/{id}` | User | Delete |
| `GET /notifications` | User | List |
| `PATCH /notifications/{id}/read` | User | Mark read |
| `PATCH /notifications/read-all` | User | Mark all read |
| `GET /dashboard` | User | Aggregated stats |
| `POST /ai/analyze-resume` | User | AI resume analysis |
| `POST /ai/generate-questions` | User | Interview questions |
| `POST /ai/skill-gap` | User | Skill gap analysis |
| `POST /ai/placement-prep` | User | Placement guide |
| `GET /health` | Public | Health check |

Swagger UI available at `http://localhost:8081/swagger-ui.html`.

## Database Schema

6 entities: `users`, `applications`, `interviews`, `resumes`, `notifications`. Hibernate `ddl-auto: update` manages schema automatically.

### Application Status Pipeline

`APPLIED` -> `ASSESSMENT_SCHEDULED` -> `ASSESSMENT_CLEARED` -> `GD_ROUND` -> `TECHNICAL_ROUND` -> `HR_ROUND` -> `SELECTED` / `REJECTED` / `OFFER_RECEIVED`

## CI/CD

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):
1. **Test Backend** -- Runs Maven tests against MySQL service container
2. **Build Frontend** -- Installs deps, builds React app
3. **Docker Build & Push** -- Builds and pushes images to GHCR (main branch only)
4. **Deploy** -- SSH into production server, pulls images, runs docker-compose


# 🚀 AI-Powered Job Application Tracker

An intelligent full-stack web application that helps students and job seekers efficiently manage their job applications, prepare for interviews, analyze resumes using AI, identify skill gaps, and stay organized with automated notifications.

---

## 📌 Features

### 🔐 Authentication & Security
- JWT-based Authentication
- User Registration & Login
- Password Encryption using BCrypt
- Role-based Authorization
- Spring Security Integration

### 💼 Job Application Management
- Create, Update, Delete Applications
- Track Application Status
- Search & Filter Applications
- Pagination & Sorting
- Application Notes
- Company & Role Details

### 📊 Dashboard Analytics
- Total Applications
- Success Rate
- Rejection Rate
- Status Breakdown
- Monthly Application Trend
- Interactive Dashboard Statistics

### 🎯 Interview Management
- Schedule Interviews
- Track Interview Results
- Store Interview Questions
- Personal Notes
- Link Interviews to Applications

### 🤖 AI Assistant (Powered by Google Gemini)
- Resume Analysis with ATS Score
- Interview Question Generator
- Skill Gap Analysis
- Placement Preparation Guide

### 🔔 Smart Notification System
- Interview Reminders
- Assessment Reminders
- Follow-up Reminders
- Read/Unread Notifications

---

# 🛠 Tech Stack

## Backend
- Java 21
- Spring Boot 3.5
- Spring Security
- Spring Data JPA
- Hibernate
- JWT Authentication
- MySQL
- Maven
- Lombok

## Frontend
- React
- React Router
- Axios
- Tailwind CSS
- React Hook Form
- Chart.js

## AI
- Google Gemini API

## Tools
- IntelliJ IDEA / VS Code
- Postman
- Git & GitHub
- MySQL Workbench

---

# 📂 Project Structure

```
job-tracker-backend
│
├── config
├── controller
├── dto
│   ├── request
│   └── response
├── entity
├── exception
├── repository
├── scheduler
├── security
├── service
└── JobTrackerBackendApplication.java


job-tracker-frontend
│
├── src
│   ├── api
│   ├── components
│   ├── context
│   ├── pages
│   ├── routes
│   └── utils
```

---

# 📊 Database

Main Tables

- Users
- Applications
- Interviews
- Notifications

---

# 🔑 API Modules

### Authentication
- Register
- Login
- JWT Validation

### Applications
- CRUD Operations
- Search
- Filter
- Pagination

### Dashboard
- Statistics
- Monthly Trends
- Status Distribution

### Interviews
- Schedule
- Update
- Delete
- Search

### AI Assistant
- Resume Analysis
- Interview Questions
- Skill Gap Analysis
- Placement Preparation

### Notifications
- Fetch Notifications
- Mark as Read
- Unread Count
- Delete Read Notifications

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/job-tracker.git
```

## Backend

```bash
cd job-tracker-backend
```

Configure `application.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/job_tracker_db
    username: YOUR_USERNAME
    password: YOUR_PASSWORD

jwt:
  secret: YOUR_SECRET_KEY

gemini:
  api:
    key: YOUR_GEMINI_API_KEY
```

Run

```bash
mvn spring-boot:run
```

Backend runs on

```
http://localhost:8081
```

---

## Frontend

```bash
cd job-tracker-frontend
```

Install Dependencies

```bash
npm install
```

Start React

```bash
npm start
```

Frontend runs on

```
http://localhost:3000
```

---

# 📸 Screenshots

Add screenshots here after completing the frontend.

Examples:

- Login Page
- Dashboard
- Applications
- Interview Tracker
- Resume Analyzer
- AI Assistant
- Notifications

---

# 🚀 Future Improvements

- Resume PDF Upload
- Email Notifications
- Calendar Integration
- Company Reviews
- AI Resume Builder
- AI Cover Letter Generator
- Mock Interview Chatbot
- Dark Mode
- Docker Deployment
- CI/CD Pipeline
- Cloud Deployment (AWS / Azure)

---

# 🎯 Learning Outcomes

This project helped me gain hands-on experience with:

- Spring Boot REST API Development
- JWT Authentication & Authorization
- Spring Security
- Hibernate & JPA
- MySQL Database Design
- React Development
- REST API Integration
- AI Integration using Google Gemini
- Scheduling Tasks
- Clean Architecture
- Full Stack Development

---

# 👨‍💻 Author

**Sahil Jirapure**

B.Tech Information Technology  
MIT ADT University

### Skills

Java • Spring Boot • React • MySQL • JWT • REST APIs • Hibernate • Tailwind CSS • Git • GitHub • Google Gemini API

---

# ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub!
