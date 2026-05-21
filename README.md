# Planora - Project Management System

A modern, beautiful, and fully-featured project management dashboard built with the MERN stack (MongoDB, Express, React, Node.js) and containerized using Docker.

## 🏗️ Architecture

Planora uses a standard MERN stack architecture, separated into frontend and backend services:

- **Frontend (React + Vite)**: A single-page application (SPA) built with React and Vite. It provides a highly interactive and premium user interface with modern glassmorphism design. The frontend communicates with the backend via RESTful APIs. When containerized, the built static files are served using an **Nginx** web server.
- **Backend (Node.js + Express)**: A RESTful API server that handles business logic, authentication (JWT), and data processing.
- **Database (MongoDB)**: A NoSQL database hosted on MongoDB Atlas to store user, project, task, and team data securely.

Both the frontend and backend are fully containerized using **Docker**, making deployment and local development consistent and straightforward.

## 🐳 Running Locally with Docker

You can spin up the entire application (frontend and backend) using Docker Compose.

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Steps to Run

1. **Clone the repository and navigate to the project directory**:
   ```bash
   cd Planora-project-management
   ```

2. **Configure Environment Variables (Optional but recommended)**:
   By default, the `docker-compose.yml` provides fallback values. To customize, create a `.env` file in the `backend/` directory:
   ```env
   MONGO_URI=mongodb+srv://<your_username>:<your_password>@<your_cluster>.mongodb.net/planora?appName=Cluster0
   JWT_SECRET=your_super_secret_key
   PORT=5000
   ```

3. **Build and Run the Containers**:
   ```bash
   docker-compose up --build
   ```

4. **Access the Application**:
   - **Frontend**: Open your browser and visit `http://localhost` (or `http://localhost:80`).
   - **Backend API**: Accessible at `http://localhost:5000`.

### Docker Commands Used
- `docker-compose up --build`: Builds the Docker images (if not already built or if changes are detected) and starts the containers in the foreground.
- `docker-compose up -d`: Starts the containers in detached mode (background).
- `docker-compose down`: Stops and removes the containers, networks, and volumes created by `up`.
- `docker build -t planora-backend ./backend`: Manually build the backend image.
- `docker build -t planora-frontend .`: Manually build the frontend image.

## 🚀 Deployment to Render

The backend is fully configured to be deployed as a **Web Service** on [Render](https://render.com/).

### Backend Deployment Steps (Render Dashboard)

1. Log in to your Render account and click **New** -> **Web Service**.
2. Connect your GitHub/GitLab repository containing this project.
3. Configure the service:
   - **Name**: `planora-backend` (or your preferred name)
   - **Root Directory**: `backend` (This is crucial, as it tells Render where the backend code lives).
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `MONGO_URI`: Your MongoDB Atlas connection string (make sure Render's IPs are whitelisted in MongoDB Atlas, or allow access from anywhere `0.0.0.0/0`).
   - `JWT_SECRET`: A secure random string for signing tokens.
   - `PORT`: (Optional) Render automatically assigns a port, but you can specify one if needed.
5. Click **Create Web Service**. Render will automatically build and deploy your backend.

**Backend Deployment Link:** `[INSERT RENDER URL HERE]` *(e.g., https://planora-backend.onrender.com)*

*(Once deployed, update the frontend's API base URL in `src/services/api.js` to point to this new Render URL instead of `/api` or `http://localhost:5000`)*.
