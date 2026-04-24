# InfraDB Monitoring (Asset Management)

Full-stack monitoring platform for database and host assets, with:
- FastAPI backend (`monitoring-server`)
- React + Vite frontend (`front-end`)
- MySQL-backed monitoring and grouping workflows

This project tracks DB instance health, alerts, schema history, and static device groups that can be used to filter the dashboard.

---

## Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Run Locally](#run-locally)
- [Frontend Configuration Notes](#frontend-configuration-notes)
- [API Overview](#api-overview)
- [Groups Feature (Current Behavior)](#groups-feature-current-behavior)
- [Database Overview](#database-overview)
- [Troubleshooting](#troubleshooting)
- [Production Notes](#production-notes)

---

## Architecture

1. Agents/NMS data flow into backend API endpoints.
2. Backend stores and computes monitoring data in MySQL.
3. Frontend polls backend endpoints for dashboard/alerts/groups UI.
4. Groups are static device collections (by ID/IP/hostname resolution) used to filter dashboard results.

---

## Tech Stack

### Backend (`monitoring-server`)
- Python 3.10+
- FastAPI
- SQLAlchemy (async)
- aiomysql
- Pydantic v2
- Uvicorn
- NumPy (forecasting)

### Frontend (`front-end`)
- React 19
- Vite 8
- React Router
- Axios
- Recharts

---

## Project Structure

```text
asset_management/
├─ monitoring-server/
│  ├─ app.py
│  ├─ config.py
│  ├─ database.py
│  ├─ requirements.txt
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  └─ utils/
├─ front-end/
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ public/
│  └─ src/
└─ README.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- MySQL server access
- Network access between frontend/browser and backend host

---

## Environment Configuration

Backend reads environment from `monitoring-server/.env` (or `ENV_FILE` override).

Example variables:

```env
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=port_monitoring_2
NMS_DB_NAME=nms
MASTER_KEY=...
SERVER_HOST=localhost
SERVER_PORT=9000
```

Frontend production API base is set via:

```env
# front-end/.env.production
VITE_API_URL=http://<backend-or-gateway-host>:<port>
```

> Do not commit real credentials or secrets.

---

## Run Locally

## 1) Backend

From `monitoring-server`:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Backend default:
- `http://localhost:9000`
- Health: `GET /health`
- Docs: `http://localhost:9000/docs`

## 2) Frontend

From `front-end`:

```bash
npm install
npm run dev
```

Frontend default:
- `http://localhost:3001`

Run on a different port:

```bash
npm run dev -- --host 0.0.0.0 --port 3002
```

---

## Frontend Configuration Notes

`front-end/vite.config.js` dev proxy should point to active backend:

- `/api` -> `http://localhost:9000`

If backend is on another host, set `VITE_API_URL` for production builds or adjust dev proxy accordingly.

---

## API Overview

Base prefix: `/api/v1`

Key route groups:
- Agent/auth: `routes/agent.py`
- Device monitoring: `routes/monitor.py`, `routes/linux_monitor.py`, `routes/unified_monitor.py`
- DB monitoring: `routes/db_monitor.py`
- Alerts thresholds: `routes/alert_thresholds.py`
- Service definitions/packs: `routes/service_definitions.py`, `routes/service_packs.py`
- Groups: `routes/groups.py`

Important DB monitoring endpoints:
- `GET /api/v1/db/overview`
  - Supports `group_id` query param for group-based dashboard filtering
- `GET /api/v1/db/monitor/{ip}`
- `GET /api/v1/db/monitor/{ip}/{instance_name}`
- `GET /api/v1/db/alerts`

Groups endpoints:
- `POST /api/v1/groups/`
- `GET /api/v1/groups/`
- `PUT /api/v1/groups/{group_id}`
- `DELETE /api/v1/groups/{group_id}`
- `GET /api/v1/groups/{group_id}/members`

---

## Groups Feature (Current Behavior)

Current design is static-group focused:

- Create group from UI with:
  - group name
  - comma-separated members
- Members can be entered as:
  - device ID
  - IP address
  - hostname
- Backend resolves entries against `monitored_device` and stores memberships in `device_group_members`.
- Manage view shows group list with computed `member_count`.
- Dashboard can filter instances by selected group.

Data model:
- `device_group`: group definition (name, timestamps)
- `device_group_members`: mapping rows (`group_id`, `device_id`)

---

## Database Overview

Core tables commonly used:

- `monitored_device`
- `registered_agent`
- `db_monitoring`
- `db_monitoring_alert`
- `db_schema_history`
- `device_group`
- `device_group_members`
- `alert_threshold`
- `service_definition`
- `service_pack`
- `service_pack_item`
- `system_setting`
- `windows_port_monitoring`
- `linux_port_monitoring`
- `unified_monitoring`

Startup behavior:
- `init_db()` runs `Base.metadata.create_all(...)` for managed models.
- Default services/packs/threshold seeders run during app startup.

---

## Troubleshooting

### Frontend shows no data on localhost
- Ensure Vite proxy points to backend port actually running (`9000`).
- Check backend logs for request errors.
- Verify browser network requests to `/api/v1/...`.

### UI differs between `localhost` and a server IP
- You may be hitting different deployments/builds.
- Confirm HTML/source and asset bundle match your current frontend.

### Group create/update returns `422`
- Means one or more member tokens were not resolved to a known device.
- Use valid device ID, exact IP, or exact hostname present in `monitored_device`.

### Port conflict
- Run frontend on another port:
  - `npm run dev -- --host 0.0.0.0 --port 3002`

---

## Production Notes

- Restrict CORS (`allow_origins`) before production.
- Replace wildcard API exposure with controlled network rules.
- Use strong secret management for DB and master keys.
- Serve frontend and backend behind reverse proxy (Nginx/Apache) with TLS.
- Add automated backups and schema migration workflow (Alembic recommended).

---

## License / Ownership

Internal project. Add your organization license policy here if required.

