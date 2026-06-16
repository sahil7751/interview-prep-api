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
- **AI Career Assistant** (powered by Google Gemini 2.0 Flash):
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
| AI | Google Gemini 2.0 Flash (WebClient + retry) |
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
- Google Gemini API key (for AI features)

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
| `GEMINI_API_KEY` | _required_ | Gemini AI API key |

### Run with Docker (recommended)

```bash
# Set your Gemini API key
set GEMINI_API_KEY=your_key_here

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
