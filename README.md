<div align="center">

# 🚀 CareerPilot AI

### AI-Powered Career Management & Placement Preparation Platform

CareerPilot AI is an intelligent full-stack platform that helps students and job seekers manage their placement journey from job applications to interview preparation using Artificial Intelligence.

Built with **Spring Boot**, **React**, **MySQL**, **JWT Authentication**, and **Groq Llama AI**.

![Java](https://img.shields.io/badge/Java-21-red)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1)
![JWT](https://img.shields.io/badge/JWT-Security-purple)
![Groq](https://img.shields.io/badge/AI-Groq_Llama-orange)
![License](https://img.shields.io/badge/License-MIT-success)

</div>

---

# 📖 Overview

CareerPilot AI is an end-to-end AI-powered career management platform designed to simplify the placement journey for students and professionals.

Instead of using multiple tools for tracking applications, preparing for interviews, managing resumes, and planning careers, CareerPilot AI brings everything together into one intelligent platform.

Users can:

- 📌 Track job applications
- 🎤 Manage interview schedules
- 🤖 Practice AI-powered mock interviews
- 📄 Analyze resumes with AI
- 🎯 Identify skill gaps
- 🗺️ Generate personalized learning roadmaps
- 👤 Build a professional career profile
- 💬 Chat with an AI Career Coach
- 🏆 Earn XP through gamified learning
- 🔔 Receive smart reminders and notifications

---
 
# 🎥 Project Demonstration

## 📺 Demo Video

> **Google Drive Video Link**
>
> https://drive.google.com/file/d/1ASxY4ND6PmFl2d5H_WeeS0UA4Z28SzeB/view?usp=drive_link

---

# ✨ Core Features

## 📊 Smart Dashboard

A centralized dashboard providing real-time career insights.

- Application analytics
- Monthly trends
- Success & rejection rates
- Profile completion
- Interview performance
- XP & Level progress
- Recent activity timeline

---

## 💼 Job Application Tracker

Manage the complete job application lifecycle.

Features:

- Add/Edit/Delete applications
- Search & Filter
- Status tracking
- Company-wise organization
- Package & location tracking
- Interview linkage

Supported Statuses

- Applied
- Assessment
- HR Round
- Technical Round
- Final Round
- Selected
- Rejected
- Offer Received

---

## 🎤 Interview Tracker

Organize every interview in one place.

- Schedule interviews
- Track interview stages
- Save interview experiences
- Store interview questions
- Add notes
- Record results
- Company-wise search

---

## 🤖 AI Career Assistant

Powered by **Groq Llama AI**

### 📄 Resume Analysis

- ATS Score
- Resume strengths
- Weakness detection
- Missing keywords
- Improvement suggestions
- Overall resume feedback

### 🎯 Interview Question Generator

Generate customized interview questions based on:

- Job role
- Experience level
- Job description

Includes:

- Technical Questions
- HR Questions
- Behavioral Questions

### 📈 Skill Gap Analysis

Analyze current skills against target roles.

Provides:

- Skill match percentage
- Missing technologies
- Recommended learning path
- Personalized suggestions

### 🚀 Placement Preparation

Generate AI-powered preparation plans including:

- Weekly roadmap
- DSA topics
- Recommended projects
- Learning resources
- Study strategy

---

## 🧠 AI Interview Practice

Practice realistic mock interviews with AI.

Features:

- AI-generated interview sessions
- Dynamic questions
- AI answer evaluation
- Performance scoring
- Personalized feedback
- Practice history
- Progress tracking

---

## 💬 AI Career Coach

A personalized AI mentor trained to help users throughout their placement journey.

Capabilities:

- Placement guidance
- DSA planning
- Resume optimization
- Company-specific preparation
- Career planning
- Personalized coaching
- Daily career insights
- Weekly progress reviews

---

## 📄 Resume Studio

Professional resume management.

- Upload multiple resumes
- Resume versioning
- Active resume selection
- ATS scoring
- Resume metadata
- Target role management

---

## 👤 Career Profile

Create a complete professional profile.

Includes:

- Personal information
- Education
- Skills
- Career goals
- Social profiles
- Resume information
- XP & Level
- Profile completion
- AI profile review

---

## 🎮 Gamification

Stay motivated throughout your placement journey.

Features:

- XP System
- Career Levels
- Daily streaks
- Achievement tracking
- Activity rewards
- Progress monitoring

---

## 🔔 Smart Notification System

Never miss important events.

Notifications for:

- Upcoming interviews
- Application reminders
- Placement activities
- AI recommendations

Actions:

- Mark as read
- Mark all as read
- Delete notifications
- Unread count

---

# 🔐 Security

- JWT Authentication
- Spring Security
- Password Encryption (BCrypt)
- Role-based Authorization
- Secure REST APIs
- Protected Routes
- Authentication Filters
- CORS restricted to an explicit, environment-configurable origin allow-list (no wildcard origins)
- All secrets (DB credentials, JWT secret, AI API key) provided via environment variables — none are committed to the repository

---

# 🛠️ Technology Stack

## Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- JWT Authentication
- MySQL
- Maven
- Lombok

---

## Frontend

- React
- React Router
- Axios
- Tailwind CSS
- HTML5
- CSS3
- JavaScript (ES6)

---

## Artificial Intelligence

- Groq API
- Llama 3.3 70B Versatile

---

## Development Tools

- Git
- GitHub
- Postman
- IntelliJ IDEA
- VS Code
- Maven

---

# 📁 Project Structure

```text
CareerPilot-AI
│
├── job-tracker-backend
│   ├── config
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── scheduler
│   ├── security
│   ├── service
│   └── util
│
├── job-tracker-frontend
│   ├── api
│   ├── components
│   ├── context
│   ├── pages
│   ├── routes
│   └── utils
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/CareerPilot-AI.git
```

## Configure Environment Variables

Copy the example env file and fill in your own local values:

```bash
cp .env.example .env
```

`.env` is git-ignored and must never be committed. See the
[Environment Variables](#-environment-variables) section below for what
each value means.

Backend

```bash
cd job-tracker-backend

mvn clean install

mvn spring-boot:run
```

The backend reads configuration from environment variables (see below) —
export them in your shell, or use `docker-compose up`, which loads `.env`
automatically.

Frontend

```bash
cd job-tracker-frontend

npm install

npm start
```

Backend runs on:

```
http://localhost:8081
```

Frontend runs on:

```
http://localhost:3000
```

---

# 🔑 Environment Variables

The backend requires the following environment variables. None of them
have real default values committed to the repo — you must provide your
own (see `.env.example` for a ready-to-copy template).

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | API key for the Groq AI API (used for all AI features: resume analysis, interview practice, career coach, etc.). Get one at [console.groq.com](https://console.groq.com). |
| `GROQ_API_URL` | No (has default) | Groq chat-completions endpoint. Defaults to `https://api.groq.com/openai/v1/chat/completions`. |
| `GROQ_MODEL` | No (has default) | Groq model name. Defaults to `llama-3.3-70b-versatile`. |
| `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_DB` | No (has defaults) | Database connection target. Defaults to `localhost:3306/job_tracker_db`. |
| `MYSQL_USER` | ✅ Yes | Database username. No default — must be set. |
| `MYSQL_PASSWORD` | ✅ Yes | Database password. No default — must be set. |
| `MYSQL_ROOT_PASSWORD` | ✅ Yes (Docker only) | Root password for the MySQL container in `docker-compose.yml`. Not used by the backend directly. |
| `JWT_SECRET` | ✅ Yes | Secret key used to sign JWTs. Must be a long, random, unpredictable string. No default — the app will not start without it. |
| `JWT_EXPIRATION` | No (has default) | Token lifetime in milliseconds. Defaults to `86400000` (24h). |
| `CORS_ALLOWED_ORIGINS` | No (has default) | Comma-separated list of frontend origins allowed to call the API with credentials. Defaults to `http://localhost:3000` for local dev — **must** be set to your real frontend URL(s) in production. |
| `SERVER_PORT` | No (has default) | Backend port. Defaults to `8081`. |

⚠️ **Never commit `.env` or real secret values.** Only `.env.example`
(with placeholder values) belongs in the repository.

---

# 📸 Screenshots

Add screenshots of:

- Dashboard
- AI Career Coach
- AI Career Assistant
- Interview Practice
- Resume Studio
- Profile
- Application Tracker

---

# 🚀 Future Enhancements

- Resume PDF Parsing
- AI Resume Builder
- Email Notifications
- Calendar Integration
- Company-wise Analytics
- AI Voice Interview
- Mobile Application
- Docker Support
- AWS Deployment
- Dark Mode
- Real-time Notifications

---

# 📚 Learning Outcomes

This project helped me gain hands-on experience with:

- Full Stack Development
- Spring Boot Architecture
- REST API Design
- JWT Authentication
- Spring Security
- React Development
- State Management
- Database Design
- AI Integration
- Prompt Engineering
- Secure Authentication
- Software Architecture
- Clean Code Practices
- Git & Version Control

---

# 👨‍💻 Developer

**Sahil Jirapure**

B.Tech Information Technology

MIT ADT University

📧 Email

sahiljirapure8@gmail.com

🔗 GitHub

https://github.com/sahil7751

🔗 LinkedIn

https://www.linkedin.com/in/sahil-jirapure

---

# ⭐ Show Your Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

It motivates me to continue building and improving open-source projects.

---

<div align="center">

**CareerPilot AI — Your Intelligent Placement Companion 🚀**

</div>

