@echo off
setlocal EnableDelayedExpansion

:: Usage:
::   clean-zip.bat       - actually deletes all relevant log/bak/tmp files
::   clean-zip /dry      - preview only, nothing is deleted, size calculated
::
:: It cleans all the project logs, tmp, bak, cache files, and imported packages
:: then zips the project WITHOUT .VENV, .GIT DIRECTORIES, AND .ENV FILES 
::
:: Created by Hagay Onn, https://ailoveu.art

set "SEP===================================================="
set "DRYRUN=0"
if /i "%~1"=="/dry"       set "DRYRUN=1"
if /i "%~1"=="-dry"       set "DRYRUN=1"
if /i "%~1"=="--dry-run"  set "DRYRUN=1"

:: Initialize total size tracker (in bytes)
set /a "TOTAL_BYTES=0"

echo %SEP%
if "%DRYRUN%"=="1" (
    echo [!] DRY RUN - nothing will actually be deleted
)
echo [!] Starting Smart-Clean-n-Zip for: %cd%
echo %SEP%

:: 1. Clean JavaScript / Node.js projects (any depth)
for /d /r %%D in (node_modules) do (
    REM echo [-] Found Node.js project. Deleting node_modules...
    if exist "%%D" call :RemoveDir "%%D" "node_modules"
)

:: 2. Clean Python caches and compiled files
echo [-] Cleaning Python caches and compiled files...
for /d /r %%D in (__pycache__) do (
    if exist "%%D" call :RemoveDir "%%D" "__pycache__"
)
for /r %%F in (*.pyc) do (
    if exist "%%F" call :RemoveFile "%%F"
)

:: 3. Clean Code and Tests Tools caches (any depth)
echo [-] Cleaning Code, Tests Tools caches, and coverage reports...
for %%N in (.mypy_cache .pytest_cache .ruff_cache coverage htmlcov .uv-cache) do (
    for /d /r %%D in (%%N) do (
        if exist "%%D" call :RemoveDir "%%D" "%%N"
    )
)
for /r %%F in (.coverage .coverage.*) do (
    if exist "%%F" call :RemoveFile "%%F"
)

:: === WE DO NOT WANT TO DELETE .venv, JUST NOT ZIP IT (handled below) ===

:: 4. Clean Build and Distribution artifacts (dist, build, *.egg-info)
echo [-] Cleaning Build and Distribution folders...
for %%N in (dist build *.egg-info) do (
    for /d /r %%D in (%%N) do (
        if exist "%%D" call :RemoveDir "%%D" "%%N"
    )
)

:: 5. Clean log files, temp files, backups, and OS metadata (any depth)
echo [-] Deleting backup/log/temporary files, and OS thumbs...
for %%E in (*.log *.tmp *.temp *.bak thumbs.db ehthumbs.db) do (
    for /f "delims=" %%F in ('dir /b /s "%%E" 2^>nul') do (
        if exist "%%F" call :RemoveFile "%%F"
    )
)

:: 6. Convert TOTAL_BYTES to a human-readable format
call :FormatBytes %TOTAL_BYTES% FORMATTED_SIZE
echo %SEP%
if "%DRYRUN%"=="1" (
    echo [V] Dry run complete - nothing was deleted.
    echo [i] Space that would be reclaimed: %FORMATTED_SIZE%
) else (
    echo [V] Projects-Tree cleaning completed successfully!
    echo [i] Total space reclaimed: %FORMATTED_SIZE%
)
echo.
echo [ ] Starting project-to-zip...
echo %SEP%

:: --- Build zip file name from current folder ---
for %%I in (.) do set "FolderName=%%~nxI"
set "ZipName=%FolderName%.zip"

if exist "%ZipName%" del /f /q "%ZipName%"

echo [-] Scanning and zipping files...
echo [-] Excluding: .venv, .git, and .env files

:: --- Check 7-Zip is available before doing any work ---
where 7z >nul 2>&1
if errorlevel 1 (
    echo [X] 7-Zip ^(7z.exe^) was not found on PATH. Aborting.
    goto :end
)

:: --- Build exclude file (single %random% call, reused consistently) ---
set "ExcludeFile=%temp%\zip_exclude_%random%.txt"
echo [i] Using temp exclude list: !ExcludeFile!

(
    echo .venv\
    echo .git\
    echo .env
    echo .env.local
    echo .env.dev
    echo .env.development
    echo .env.production
    echo %ZipName%
) > "!ExcludeFile!"

7z a -tzip "%ZipName%" * -xr@"!ExcludeFile!" >nul

del /q /f "!ExcludeFile!" >nul 2>&1

if exist "%ZipName%" (
    for %%A in ("%ZipName%") do set "SizeBytes=%%~zA"
    set /a "SizeKB=!SizeBytes! / 1024"
    if !SizeKB! GEQ 1024 (
        set /a "SizeMB=!SizeKB! / 1024"
        echo [O] Created archive: %ZipName% ^(~!SizeMB! MB^)
    ) else (
        echo [O] Created archive: %ZipName% ^(~!SizeKB! KB^)
    )
) else (
    echo [X] Archive was not created - check for errors above.
)

echo %SEP%
echo [V] Project-to-Zip completed successfully!
echo %SEP%

goto :end

:: --- Subroutines -----------------------------------------------------

:RemoveDir
    set "DIR_SIZE=0"
    for /f "tokens=3" %%A in ('dir /s /a /-c "%~1" 2^>nul ^| findstr /c:"File(s)"') do (
        set "DIR_SIZE=%%A"
    )
    if defined DIR_SIZE (
        set /a "TOTAL_BYTES+=DIR_SIZE"
    )

    if "%DRYRUN%"=="1" (
        echo [DRY] Would delete %~2: %~1
    ) else (
        echo [-] Found %~2: %~1
        rmdir /s /q "%~1" >nul 2>&1
    )
    goto :eof

:RemoveFile
    for %%A in ("%~1") do set "FILE_SIZE=%%~zA"
    if defined FILE_SIZE (
        set /a "TOTAL_BYTES+=FILE_SIZE"
    )

    if "%DRYRUN%"=="1" (
        echo [DRY] Would delete file: %~1
    ) else (
        del /q /f "%~1" >nul 2>&1
    )
    goto :eof

:FormatBytes
    set "BYTES=%~1"
    
    REM Convert to KB
    set /a "KB=BYTES / 1024"
    if %KB% LEQ 0 (
        set "%~2=%BYTES% Bytes"
        goto :eof
    )

    REM Convert to MB
    set /a "MB=KB / 1024"
    if %MB% LEQ 0 (
        set "%~2=%KB% KB"
        goto :eof
    )

    REM Convert to GB
    set /a "GB=MB / 1024"
    if %GB% LEQ 0 (
        set "%~2=%MB% MB"
        goto :eof
    )

    set "%~2=%GB% GB"
    goto :eof

:end

pause
endlocal
