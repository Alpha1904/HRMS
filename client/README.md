# RhFront_v3

Scaffold React (JSX) frontend for a multisite HR application (v3) connected to a NestJS backend.

Features:
- Centralized theme (src/theme/tailwind.theme.js)
- TailwindCSS, React Router, Redux Toolkit, Axios (single api file src/api/api.js)
- Login (react-hook-form + yup), remember checkbox stores token in localStorage/sessionStorage
- Sidebar with active state, pages scaffolded, Employees page with modal to create employee
- Connects to NestJS backend at REACT_APP_API_URL (see .env)

To run:
1. `npm install`
2. copy `.env.example` to `.env` and edit if needed
3. `npm start`

API endpoints expected:
- POST /auth/login
- GET /employees
- POST /employees
- PUT /employees/:id
- DELETE /employees/:id

If your API uses cookies for auth, enable `withCredentials` in src/api/api.js and adjust CORS on the backend.
