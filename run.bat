@echo off
SETLOCAL ENABLEEXTENSIONS

:: ==============================================
:: Resolve root path
:: ==============================================
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"
set "REACT_ROOT=%ROOT_DIR%"
set "FLASK_DIR=%ROOT_DIR%flask"
set "FLASK_APP=run.py"
set "FLASK_PORT=5000"
set "VITE_PORT=5173"
set "VENV_PATH=%FLASK_DIR%\flask-a7-virt\Scripts\activate.bat"

:: ==============================================
:: Kill node/python processes (optional, risky)
:: ==============================================
echo [INFO] Attempting to stop existing dev servers (node/python)...
for /f "tokens=2 delims=," %%a in ('tasklist /fi "imagename eq node.exe" /fo csv /nh') do taskkill /F /PID %%~a >nul 2>&1
for /f "tokens=2 delims=," %%a in ('tasklist /fi "imagename eq python.exe" /fo csv /nh') do taskkill /F /PID %%~a >nul 2>&1

:: ==============================================
:: 1. Start Flask Backend
:: ==============================================
if not exist "%FLASK_DIR%\%FLASK_APP%" (
    echo [ERROR] Flask app not found at "%FLASK_DIR%\%FLASK_APP%"
    pause
    exit /b
)

if not exist "%VENV_PATH%" (
    echo [ERROR] Virtual environment not found at "%VENV_PATH%"
    pause
    exit /b
)

start "Flask Backend" cmd /k ^
"@echo off && ^
cd /d %FLASK_DIR% && ^
echo [FLASK] Activating virtual environment... && ^
call flask-a7-virt\Scripts\activate.bat && ^
echo [FLASK] Starting Flask on port %FLASK_PORT%... && ^
set FLASK_APP=%FLASK_APP% && ^
flask run --port=%FLASK_PORT% && ^
pause"

:: ==============================================
:: 2. Start Vite Frontend
:: ==============================================
cd /d "%REACT_ROOT%"
if not exist "%REACT_ROOT%\package.json" (
    echo [ERROR] package.json not found. Are you in the React root?
    pause
    exit /b
)

start "Vite Frontend" cmd /k ^
"@echo off && ^
cd /d %REACT_ROOT% && ^
echo [VITE] Starting Vite dev server... && ^
npm run dev && ^
pause"

:: ==============================================
:: 3. Open browser
:: ==============================================
echo [INFO] Waiting 10 seconds for servers to boot...
timeout /t 10 >nul

start "" "http://localhost:%VITE_PORT%"
start "" "http://localhost:%FLASK_PORT%"

echo.
echo [SUCCESS] Both servers should now be running:
echo - Frontend: http://localhost:%VITE_PORT%
echo - Backend:  http://localhost:%FLASK_PORT%
echo.
pause
