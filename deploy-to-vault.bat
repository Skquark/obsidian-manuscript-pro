@echo off
REM Deploy Manuscript Pro plugin to vault
REM Usage: deploy-to-vault.bat "C:\path\to\vault"

if "%1"=="" (
    echo Usage: deploy-to-vault.bat "C:\path\to\vault"
    echo Example: deploy-to-vault.bat "C:\Projects\god-is-water-book"
    exit /b 1
)

set VAULT_PATH=%~1
set PLUGIN_DIR=%VAULT_PATH%\.obsidian\plugins\manuscript-pro

echo Deploying Manuscript Pro to: %PLUGIN_DIR%

REM Create plugin directory if it doesn't exist
if not exist "%PLUGIN_DIR%" (
    echo Creating plugin directory...
    mkdir "%PLUGIN_DIR%"
)

REM Copy only the required files
echo Copying plugin files...
copy /Y "main.js" "%PLUGIN_DIR%\main.js"
copy /Y "manifest.json" "%PLUGIN_DIR%\manifest.json"
copy /Y "styles.css" "%PLUGIN_DIR%\styles.css"

echo.
echo Deployment complete!
echo.
echo Next steps:
echo 1. Restart Obsidian (or reload without restart: Ctrl+R)
echo 2. Go to Settings ^> Community Plugins
echo 3. Enable "Manuscript Pro"
echo.
