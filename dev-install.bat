@echo off
echo Building Manuscript Pro...
call npm run build

echo.
echo Copying files to test vault...
copy /Y build\main.js test-vault\.obsidian\plugins\manuscript-pro\main.js
copy /Y manifest.json test-vault\.obsidian\plugins\manuscript-pro\manifest.json
copy /Y styles.css test-vault\.obsidian\plugins\manuscript-pro\styles.css
echo.
echo ✓ Plugin installed to test vault!
echo.
echo Next steps:
echo 1. Open test-vault in Obsidian
echo 2. Enable Manuscript Pro in Settings ^> Community Plugins
echo 3. If hot-reload plugin is installed, it will auto-reload on changes
echo.
pause
