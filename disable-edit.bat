@echo off
echo Disabling Edit Mode...
echo.

cd /d E:\Kel-MyselfWeb\my-portfolio

echo Creating disable script...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<title^>Disabling Edit Mode...^</title^>
echo     ^<script^>
echo         localStorage.removeItem('localEditMode'^);
echo         console.log('Edit mode disabled'^);
echo         window.location.href = 'http://localhost:5173/';
echo     ^</script^>
echo ^</head^>
echo ^<body^>
echo     ^<p^>Disabling edit mode...^</p^>
echo ^</body^>
echo ^</html^>
) > disable-edit-mode.html

echo Opening browser to disable edit mode...
start disable-edit-mode.html

echo.
echo Edit mode has been disabled.
echo You can now browse in preview mode.
echo.
pause
