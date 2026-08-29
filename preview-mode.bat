@echo off
echo Starting PREVIEW Mode (Read-Only)...
echo.

cd /d E:\Kel-MyselfWeb\my-portfolio

echo [1] Stopping existing dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [2] Creating preview launcher...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<title^>Starting Preview Mode...^</title^>
echo     ^<script^>
echo         // Clear localStorage and set sessionStorage for preview mode
echo         localStorage.removeItem('localEditMode'^);
echo         sessionStorage.setItem('previewMode', 'true'^);
echo.
echo         console.log('Preview mode initialization:'^);
echo         console.log('- localStorage.localEditMode =', localStorage.getItem('localEditMode'^)^);
echo         console.log('- sessionStorage.previewMode =', sessionStorage.getItem('previewMode'^)^);
echo.
echo         // Redirect with preview parameter
echo         setTimeout(function(^) {
echo             window.location.href = 'http://localhost:5173/?preview=true';
echo         }, 200^);
echo     ^</script^>
echo ^</head^>
echo ^<body^>
echo     ^<p^>Starting preview mode...^</p^>
echo     ^<p^>Clearing edit permissions...^</p^>
echo ^</body^>
echo ^</html^>
) > start-preview-mode.html

echo [3] Starting fresh dev server...
start "" cmd /c "npm run dev"
echo.

echo [4] Waiting 6 seconds for server...
timeout /t 6 /nobreak
echo.

echo [5] Opening browser in preview mode...
start start-preview-mode.html
echo.

echo ========================================
echo Preview mode active - NO EDITING
echo Close ALL browser tabs before testing
echo Close this window when done
echo ========================================
echo.
pause
