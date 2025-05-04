@echo off
setlocal enabledelayedexpansion

:: Check if Minecraft version is provided
if "%~1"=="" (
    echo Usage: %~nx0 ^<minecraft_version^> ^<output_path^>
    exit /b 1
)

:: Check if output path is provided
if "%~2"=="" (
    echo Usage: %~nx0 ^<minecraft_version^> ^<output_path^>
    exit /b 1
)

set "PROJECT=paper"
set "MINECRAFT_VERSION=%~1"
set "OUTPUT_PATH=%~2"

:: Replace forward slashes with backslashes
set "OUTPUT_PATH=%OUTPUT_PATH:/=\%"

:: Remove trailing backslash if it exists
if "%OUTPUT_PATH:~-1%"=="\" (
    set "OUTPUT_PATH=%OUTPUT_PATH:~0,-1%"
)

:: Check if output path exists, create if it doesn't
if not exist "%OUTPUT_PATH%" (
    echo Output path "%OUTPUT_PATH%" does not exist, creating...
    mkdir "%OUTPUT_PATH%"
)

:: Fetch latest build using PowerShell and capture into a temp file
set "TEMPFILE=%TEMP%\build_info.txt"
echo Fetching latest build for Minecraft version %MINECRAFT_VERSION%. Project: %PROJECT%. 
powershell -Command " $response = Invoke-WebRequest -Uri 'https://api.papermc.io/v2/projects/%PROJECT%/versions/%MINECRAFT_VERSION%/builds' -UseBasicParsing; $json = $response.Content | ConvertFrom-Json; if ($json.builds.Count -eq 0) { 'null' } else { ($json.builds | Where-Object { $_.channel -eq 'default' } | Select-Object -Last 1).build } " > "%TEMPFILE%"

set /p LATEST_BUILD=<"%TEMPFILE%"
del "%TEMPFILE%"

if "%LATEST_BUILD%"=="null" (
    echo No stable build for version %MINECRAFT_VERSION% found :(
    exit /b 1
)

set "JAR_NAME=%PROJECT%-%MINECRAFT_VERSION%-%LATEST_BUILD%.jar"
set "PAPERMC_URL=https://api.papermc.io/v2/projects/%PROJECT%/versions/%MINECRAFT_VERSION%/builds/%LATEST_BUILD%/downloads/%JAR_NAME%"

:: Download the server jar
curl -o "%OUTPUT_PATH%\server.jar" "%PAPERMC_URL%"

echo Download completed for Minecraft version %MINECRAFT_VERSION%, build %LATEST_BUILD%.
echo Server jar saved to "%OUTPUT_PATH%\server.jar"
