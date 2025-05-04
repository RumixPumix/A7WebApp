A7WebApp

Self-Hosted Server Management Dashboard with Social Features
Control Minecraft/Linux servers, manage files, and interact via forums — all in one place.

Features

    Server Control — Remotely manage Minecraft and Linux servers.

    User System — Secure JWT authentication with role-based access.

    File Manager — Perform file operations directly in the browser.

    Forum System — Built-in forums for threaded discussions. (DMs coming soon via Socket.IO)

    Desktop-First — Optimized for desktop; mobile support is under development.

Tech Stack
Frontend	Backend	Database	Real-Time
React (Vite)	Flask	MariaDB	Socket.IO
Basic CSS	Python 3.8+		
Node.js v21.4.0	JWT Auth		
Setup Guide
Prerequisites

    VS Code (recommended)

    Python 3.8+

    Node.js v21.4.0 with npm v10.2.4

Backend Setup (Flask)

    Create virtual environment:

python -m venv venv
source venv/bin/activate  # For Linux/macOS
# OR
venv\Scripts\activate     # For Windows

Install dependencies:

pip install -r requirements.txt

Run the Flask server:

    flask run --port=5000

Frontend Setup (React + Vite)

    Install dependencies:

npm install

Start development server:

    npm run dev

    Open your browser at http://localhost:3000

Version Compatibility

Recommended versions to avoid compatibility issues:

    Node.js: v21.4.0

    npm: v10.2.4

Development Workflow

    Edit your code in VS Code (or any editor).

    Run both frontend and backend in parallel:

        npm run dev — frontend

        flask run — backend

    Commit changes with Git.

License

This project is licensed under the MIT License.
Self-host and modify freely, but use responsibly.