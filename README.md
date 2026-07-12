# 🌍 EcoSphere – ESG Management Platform

EcoSphere is a modern ESG (Environmental, Social & Governance) management platform designed for organizations to measure, monitor, improve, and report sustainability performance through an intuitive dashboard, AI-powered recommendations, and employee engagement.

## Architecture & Tech Stack

### Backend
- **Framework:** FastAPI
- **Database:** SQLAlchemy ORM (PostgreSQL/SQLite)
- **Migrations:** Alembic
- **Authentication:** JWT Token-based with Refresh Tokens
- **AI Integrations:** Google Gemini API

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Radix UI (shadcn)
- **Charts & Motion:** Recharts + Framer Motion
- **Icons:** Lucide React
- **Data Fetching:** TanStack Query + Axios

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
5. Run the dev server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
