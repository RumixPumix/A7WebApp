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
2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   # Then run through VSCode.
