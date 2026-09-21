# School Management System API

A full-stack Node.js application built with Express and React to manage school records and calculate proximity-based sorting.

## Features
- **Add School**: Register institutions with name, address, latitude, and longitude.
- **List Schools**: Retrieve schools sorted by distance from a user's location.
- **Frontend Dashboard**: Visual interface for managing schools with real-time distance calculation.
- **Persistence**: SQLite database (`better-sqlite3`) for efficient storage.

## Tech Stack
- **Backend**: Node.js, Express.js, Zod (Validation), better-sqlite3.
- **Frontend**: React, Tailwind CSS, Lucide Icons, Framer Motion.
- **Tooling**: Vite, TypeScript, tsx.

## Deliverables
- **API Repository**: Complete source code.
- **Postman Collection**: `School_Management_API.postman_collection.json` (included in root).

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository or download the ZIP.
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Copy `.env.example` to `.env` to customize the port.
4. Start the development server (runs both API and Frontend):
   ```bash
   npm run dev
   ```
5. Access the application at `http://localhost:3000`.

### Production
```bash
npm run build   # bundles the frontend into dist/
npm start       # serves the built frontend + API from server.ts
```

## API Endpoints

### 1. Add School
- **Endpoint**: `POST /addSchool`
- **Body**:
  ```json
  {
    "name": "School Name",
    "address": "Full Address",
    "latitude": 12.3456,
    "longitude": 78.9012
  }
  ```

### 2. List Schools
- **Endpoint**: `GET /listSchools`
- **Params**: `latitude`, `longitude`
- **Returns**: A sorted list of schools starting from the nearest one.

## Submission Details
- **Postman Collection**: Import the `.json` file into Postman and set the `baseUrl` variable to your hosted URL or `localhost:3000`.
