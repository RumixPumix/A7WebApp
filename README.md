# A7WebApp

**Self-Hosted Server Management Dashboard with Social Features**  
Control Minecraft/Linux servers, manage files, and interact via forums — all in one place.

![Demo Screenshot](![image](https://github.com/user-attachments/assets/8b8e9fcb-672a-4f6f-a0ea-e9feda93ab7a)
)

---

## Features

- **Server Control** — Remotely manage Minecraft and Linux servers.
- **User System** — Secure JWT authentication with role-based access.
- **File Manager** — Perform file operations directly in the browser.
- **Forum System** — Built-in forums for threaded discussions. *(DMs coming soon via Socket.IO)*
- **Desktop-First** — Optimized for desktop; mobile support is under development.

---

## Tech Stack

| **Frontend**     | **Backend** | **Database** | **Real-Time** |
|------------------|-------------|--------------|---------------|
| React (Vite)     | Flask       | MariaDB      | Socket.IO     |
| Basic CSS        | Python 3.8+ |              |               |
| Node.js v21.4.0  | JWT Auth    |              |               |

---

## Setup Guide

### Prerequisites

- [VS Code](https://code.visualstudio.com/) (recommended)
- [Python 3.8+](https://www.python.org/)
- [Node.js v21.4.0](https://nodejs.org/en/download/) with npm v10.2.4
- [MariaDB](https://mariadb.org/download/) 

---

### Backend Setup (Flask)

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # For Linux/macOS
   # OR
   venv\Scripts\activate     # For Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   # Then run through VSCode or use the terminal:
   flask run --port=5000
   ```

---

### Frontend Setup (React/Vite)

1. **Install Node.js**  
   Make sure you have the correct versions:
   ```bash
   node -v    # should be v21.4.0
   npm -v     # should be v10.2.4
   ```

2. **Install npm modules:**
   ```bash
   npm install
   # This installs everything from package.json
   ```

3. **Run the app:**
   ```bash
   npm run dev
   # The app will be available at http://localhost:5173
   ```

---

### Database Configuration

1. **Install MariaDB:**  
   Download and install it from the official site:  
   [https://mariadb.org/download/](https://mariadb.org/download/)

2. **Configure your environment variables:**  
   Open the `.env` file located at:  
   `flask/.env`

   It should look like this:

   ```env
   SECRET_KEY=super-secret-key           # You can change this if needed
   DATABASE_URL=mysql+pymysql://root:your_password@localhost/
   DB_NAME=A7FlaskDB                     # Keep this as-is
   JWT_SECRET_KEY=super-jwt-secret      # You can change this if needed
   ```

   Replace `your_password` with the actual password you set for the MariaDB user (likely `root` by default).

3. **Database Initialization:**  
   The database will configure itself automatically on first run.

4. **Default Login Credentials:**  
   You can log in using the following preset accounts:

   **Administrator account:**
   ```
   Username: admin
   Password: 1234
   ```

   **User account:**
   ```
   Username: user
   Password: 1234
   ```

---

## Common Issues and FAQ

### 1. Frontend won't start (`npm run dev` fails)

This usually means your dependencies are misconfigured or corrupted.

**Fix:**
- Delete the following files:
  - `package.json`
  - `package-lock.json`
  - `node_modules/` folder
- Then reinstall everything:
  ```bash
  npm install
  ```

### 2. MariaDB Connection failed

This usually means your password is incorrect.

**Fix:**
- Check .env file:
  ```bash
  DATABASE_URL=mysql+pymysql://root:1234@localhost/
  ```

- Reconfigure root account:
  ```sql
  USE mysql;
  ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyN3wP4ssw0rd'; flush privileges; exit;
  ```

### 3. Backend not communicating with frontend

Your frontend might be pointing to the wrong backend URL.

**Fix:**
- Open `src/config/config.js` in the frontend.
- Change the backend URL to one of the following:
  ```js
  development: {
      baseURL: 'http://127.0.0.1:5000', //For localhost
    },
  // or
  development: {
      baseURL: 'http://x.x.x.x:5000',// for LAN access
    },
  ```

---

## License

This project is licensed under the [MIT License](LICENSE).  
Self-host and modify freely, but use responsibly.
