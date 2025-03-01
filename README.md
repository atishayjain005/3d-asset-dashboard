# 3D Asset Dashboard

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

A full-stack 3D Asset Dashboard for managing and previewing 3D assets. This project features a modern, minimalistic UI built with React (using Vite and Tailwind CSS) and an Express backend integrated with Supabase for file storage and metadata management.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
  - [Deploying the Frontend](#deploying-the-frontend)
  - [Deploying the Backend](#deploying-the-backend)
- [Usage](#usage)
- [License](#license)

## Features

- **Dashboard UI:**  
  - Modern, minimalistic interface with smooth transitions and responsive design.
  - Grid view of assets with search and filter functionality.

- **3D Model Preview:**  
  - Interactive 3D preview using react‑three‑fiber and Three.js with orbit controls.

- **Asset Management:**  
  - Upload, edit (name and tags), and delete 3D assets.
  - Metadata management using Supabase (PostgreSQL & Storage).

## Demo

- **Deployed Project:** [3D Asset Dashboard](https://3d-asset-dashboard.vercel.app/)
- **GitHub Repository:** [GitHub Link](https://github.com/atishayjain005/3d-asset-dashboard/tree/main)

## Tech Stack

- **Frontend:**  
  - [React](https://reactjs.org/)
  - [Vite](https://vitejs.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [react‑three‑fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) & [Three.js](https://threejs.org/)

- **Backend:**  
  - [Node.js](https://nodejs.org/)
  - [Express](https://expressjs.com/)
  - [Multer](https://github.com/expressjs/multer) (for file uploads)
  - [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) (for Supabase integration)

- **Database & Storage:**  
  - [Supabase](https://supabase.com/) (PostgreSQL & Storage)

- **Deployment:**  
  - [Vercel](https://vercel.com/)

## Setup

### Frontend Setup

1. **Clone the repository and navigate to the frontend folder:**

   ```bash
   git clone https://github.com/atishayjain005/3d-asset-dashboard.git
   cd 3d-asset-dashboard/frontend
Install dependencies:

bash
Copy
npm install
Run the development server:

bash
Copy
npm run dev
Backend Setup
Navigate to the backend folder (ensure your Express app is inside an /api folder for Vercel):

bash
Copy
cd ../backend
Install dependencies:

bash
Copy
npm install
Create a .env file with the following variables:

env
Copy
PORT=8080
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_KEY="your-supabase-service-key"
FRONTEND_URL="https://3d-asset-dashboard.vercel.app"
For local development, run the backend:

bash
Copy
npm run dev
Environment Variables
Create a .env file (do not commit this file) in your backend directory with:

env
Copy
PORT=8080
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_KEY="your-supabase-service-key"
FRONTEND_URL="https://3d-asset-dashboard.vercel.app"
When deploying to Vercel, add these variables via the Vercel Dashboard.

Deployment
Deploying the Frontend
Push the frontend code to GitHub.
In Vercel, import the repository (Vite will be auto-detected).
Configure any required environment variables (if your frontend needs to know your backend API URL).
Deploy the project.
Deploying the Backend
Ensure your backend code is in an api folder.

Create a vercel.json file in the project root with the following content:

json
Copy
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
Push your backend code to GitHub.

Import the backend project into Vercel.

Add the environment variables in your Vercel project settings.

Deploy the backend.

Note: Make sure the frontend fetches the API from the correct URL (avoid extra slashes).

Usage
Dashboard:
Log in to the dashboard to view, search, and filter your uploaded 3D assets.

Uploading Assets:
Use the upload form to add new 3D models (GLB, FBX, OBJ). Metadata is stored in Supabase, and files are saved in Supabase Storage.

Editing & Deleting:
Edit asset details (name and tags) or delete assets directly from the dashboard.

3D Preview:
Click on an asset to launch an interactive 3D preview with orbit controls.
