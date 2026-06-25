# RepoInsight

# 🔮 RepoInsight — AI-Driven GitHub Repository Health Intelligence Platform

RepoInsight is a web-based full-stack diagnostics platform designed to parse, analyze, and visualize codebase analytics from public GitHub repositories. By combining asynchronous data streams from the GitHub REST API with custom heuristic metrics and semantic processing via the Google Gemini AI API, RepoInsight transforms raw metadata into intuitive, actionable repository health dashboards.

---

## 🗺️ System Architecture

The platform follows a decoupled, modular architecture split into a high-performance backend routing engine and a lightweight, responsive Single Page Application (SPA) client interface.

```text
                                [ USER INPUT: owner/repository ]
                                               │
                                               ▼
         ┌──────────────────────────────────────────────────────────────────────────┐
         │              FRONTEND LAYER (index.html, style.css, app.js)             │
         │  ┌────────────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │
         │  │  DOM State Coordinator │ │     UI Views      │ │   Chart Render    │  │
         │  │        (app.js)        │ │  (vLand, vLoad)   │ │    (Chart.js)     │  │
         │  └────────────────────────┘ └───────────────────┘ └───────────────────┘  │
         └─────────────────────────────────────┬────────────────────────────────────┘
                                               │ Async Fetch Stream (JSON)
                                               ▼
         ┌──────────────────────────────────────────────────────────────────────────┐
         │                 BACKEND LAYER (FastAPI - requirements/app)               │
         │                             ┌───────────────┐                            │
         │                             │    Routing    │                            │
         │                             │   (main.py)   │                            │
         │                             └───────┬───────┘                            │
         │            ┌────────────────────────┼────────────────────────┐           │
         │            ▼                        ▼                        ▼           │
         │   ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐│
         │   │ Database Pipeline │    │Health Score Serv. │    │Gemini AI Service  ││
         │   │(SQLite, database) │    │ (heuristic logic) │    │(prompt engineer)  ││
         │   └─────────┬─────────┘    └───────────────────┘    └─────────┬─────────┘│
         └─────────────┼─────────────────────────────────────────────────┼──────────┘
                       │ Fetch metadata, commits                         │ Generate summaries
                       ▼                                                 ▼
             ┌───────────────────┐                             ┌───────────────────┐
             │  GitHub REST API  │                             │ Google Gemini API │
             └───────────────────┘                             └───────────────────┘

```

---

## 🚀 Key Features

* **Composite Health Scoring:** Evaluates repositories across 5 core development vectors—Commit Velocity, Issue Resolution, PR Activity, Documentation Completeness, and Update Recency.
* **Semantic Code Summaries:** Leverages the Gemini AI engine to contextually wrap raw metadata into high-level architecture insights, outlining project strengths, vulnerabilities, and improvement blueprints.
* **Interactive Telemetry Visualizations:** Powered by modular `Chart.js` integrations rendering historical weekly/monthly commit cadence patterns and repository language byte distributions.
* **Single-Page Navigation Framework:** Built natively using vanilla JavaScript state utilities (`app.js`) to handle fluid transition views (`vLand`, `vLoad`, `vErr`, `vDash`) without refreshing the client browser.
* **Local Session History Tracking:** Caches previous repository runs via an integrated `SQLite` abstraction and browser local storage with real-time state purging capabilities (`goHome()` routine).

---

## 🖼️ Feature Previews & Dashboard Walkthrough

### 1. Main Landing Gate & Repository Search

The entry portal designed with clean search indexing variables and single-page routing states.


### 2. Multi-Dimensional Health Matrix & Overview

Renders core data cards (Stars, Forks, Watchers) along with rolling graphs and our automated health assessment grid.


### 3. Language Composition & Telemetry Charts

High-parity dynamic doughnut and bar charts powered by Chart.js showcasing codebase byte distributions.


### 4. Contributor Impact Grid

Displays contributor commit frequencies, share percentages, and custom reactive impact bars.


### 5. AI Summary & Architecture Prophecy

The semantic processing module powered by Gemini AI, outputting structured strengths, vulnerabilities, and engineering recommendations.


---

## 📂 Project Directory Structure

```text
RepoInsight/
│
├── index.html              # Core SPA layout and interface shells
├── style.css               # Cyberpunk dark/light responsive layout parameters
├── app.js                  # Frontend state coordinator, DOM updater, and fetch router
├── .gitignore              # Secure credential isolation configuration
│
└── requirements/
    └── app/
        ├── main.py         # FastAPI framework application root & CORS rules
        ├── database.py     # SQLite persistence pipeline & audit history management
        └── services/
            ├── github_service.py   # Asynchronous GitHub upstream aggregation 
            └── health_service.py   # Heuristic metric scoring logic matrix

```

---

## 🛠️ Local Installation & Technical Configuration

### Prerequisites

* Python 3.12 or newer
* A modern web browser supporting Canvas-driven graphic frameworks

### 1. Secure Environment Provisioning

Clone the repository to your local workstation, locate the backend root, and isolate your deployment parameters:

```bash
cd requirements/app
cp .env.example .env

```

Open the freshly instantiated `.env` configuration scope and supply your private infrastructure credentials:

```env
GEMINI_API_KEY=your_private_gemini_api_key_string
GITHUB_TOKEN=your_secure_personal_access_token_scope

```

### 2. Backend Instance Activation

Instantiate dependencies and trigger your local Uvicorn development server:

```bash
python -m uvicorn main: app --reload

```

*The asynchronous request gateway initializes monitoring networks at `http://127.0.0.1:8000`.*

### 3. Frontend Client Ingestion

Deploy the root user interface shell directly through your native operating system file executor paths or double-click to load:

```text
C:/Users/dev/RepoInsight/index.html

```

---

## 🔒 Security Operations

* **Credential Isolation:** The local variables vault (`.env`) is strictly monitored by `.gitignore` rules. API orchestration tokens never leak or expose themselves in client bundle structures.
* **State Resets:** The `goHome()` routine strips existing query strings out of active volatile memory variables whenever a user returns to the landing screen, preventing data cross-contamination.
Employment instructions.
