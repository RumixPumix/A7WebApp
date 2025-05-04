# A7WebApp

**Self-Hosted Server Management Dashboard with Social Features**  
Control Minecraft/Linux servers, manage files, and interact via forums — all in one place.

![Demo Screenshot](https://via.placeholder.com/1000x400?text=Add+your+app+screenshot+here)

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

### 2. Backend not communicating with frontend

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
