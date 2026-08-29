@echo off
echo Starting Edit Mode...
echo.

cd /d E:\Kel-MyselfWeb\my-portfolio

echo [1] Starting dev server...
start "" cmd /c "npm run dev"
echo.

echo [2] Waiting 5 seconds...
timeout /t 5 /nobreak
echo.

echo [3] Opening browser with edit mode...
start activate-edit-mode.html
echo.

echo Done! Edit mode is now active.
echo Close this window when you're done editing.
echo.
pause

