@echo off
setlocal EnableExtensions

title MOBILE SHARE V4

REM This script can live in a fixed folder that is included in PATH.
REM It shares the folder from which you run the command, not the script folder.
REM V4 modes:
REM   sharezip               -> ZIP all files from the current folder
REM   sharezip docs          -> ZIP only document files
REM   sharezip pics          -> ZIP only image files
REM   sharezip vids          -> ZIP only video files
REM   sharezip myfile.pdf    -> send this one file directly, without ZIP
REM   sharezip docs 9000     -> same, but use port 9000
REM   sharezip 9000          -> backward compatible: ZIP all files on port 9000
REM
REM Created by Hagay Onn, https://ailoveu.art

set "SHARE_DIR=%CD%"
set "SESSION_DIR=%TEMP%\mobile_share_v4_%RANDOM%_%RANDOM%"
set "PREPARE_SCRIPT=%TEMP%\mobile_share_prepare_%RANDOM%_%RANDOM%.py"
set "SERVER_SCRIPT=%TEMP%\mobile_share_server_%RANDOM%_%RANDOM%.py"
set "META_CMD=%TEMP%\mobile_share_meta_%RANDOM%_%RANDOM%.cmd"

cls
echo ===================================================
echo [!] STARTING MOBILE SHARE V4
echo [!] SOURCE FOLDER: %SHARE_DIR%
echo ===================================================
echo.
echo Usage examples:
echo   sharezip              - ZIP all files in the current folder
echo   sharezip docs         - ZIP only documents
echo   sharezip pics         - ZIP only pictures
echo   sharezip vids         - ZIP only videos
echo   sharezip myfile.pdf   - send one file directly, without ZIP
echo   sharezip docs 9000    - use another port
echo.
echo After the first complete download, this window closes automatically.
echo.

REM Prefer the Windows Python launcher if it exists, otherwise use python.exe.
set "PY_CMD="
where py >nul 2>nul
if not errorlevel 1 set "PY_CMD=py -3"
if "%PY_CMD%"=="" (
    where python >nul 2>nul
    if not errorlevel 1 set "PY_CMD=python"
)
if "%PY_CMD%"=="" goto python_missing

mkdir "%SESSION_DIR%" >nul 2>nul
if errorlevel 1 goto temp_error

powershell -NoProfile -ExecutionPolicy Bypass -Command "$raw = Get-Content -Raw -LiteralPath '%~f0'; $m = [regex]::Match($raw, '(?s)# PYTHON_PREPARE_START\r?\n(.*?)\r?\n# PYTHON_PREPARE_END'); if (-not $m.Success) { exit 2 }; Set-Content -LiteralPath '%PREPARE_SCRIPT%' -Value $m.Groups[1].Value -Encoding UTF8" >nul 2>nul
if errorlevel 1 goto prepare_script_error

powershell -NoProfile -ExecutionPolicy Bypass -Command "$raw = Get-Content -Raw -LiteralPath '%~f0'; $m = [regex]::Match($raw, '(?s)# PYTHON_SERVER_START\r?\n(.*?)\r?\n# PYTHON_SERVER_END'); if (-not $m.Success) { exit 2 }; Set-Content -LiteralPath '%SERVER_SCRIPT%' -Value $m.Groups[1].Value -Encoding UTF8" >nul 2>nul
if errorlevel 1 goto server_script_error

echo [!] Preparing the file for sharing...
echo.
%PY_CMD% "%PREPARE_SCRIPT%" "%SHARE_DIR%" "%SESSION_DIR%" "%META_CMD%" "%~1" "%~2"
set "PREPARE_EXIT=%ERRORLEVEL%"
del "%PREPARE_SCRIPT%" >nul 2>nul
if not "%PREPARE_EXIT%"=="0" goto prepare_error
if not exist "%META_CMD%" goto meta_missing

call "%META_CMD%"
del "%META_CMD%" >nul 2>nul

if "%TARGET_PATH%"=="" goto meta_missing
if not exist "%TARGET_PATH%" goto target_missing
if "%PORT%"=="" set "PORT=8000"

set "IP_FILE=%TEMP%\mobile_share_ip_%RANDOM%_%RANDOM%.txt"
set "IP_SCRIPT=%TEMP%\mobile_share_ip_%RANDOM%_%RANDOM%.py"

> "%IP_SCRIPT%" echo import socket
>> "%IP_SCRIPT%" echo ip = ""
>> "%IP_SCRIPT%" echo try:
>> "%IP_SCRIPT%" echo     s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
>> "%IP_SCRIPT%" echo     s.connect(("8.8.8.8", 80))
>> "%IP_SCRIPT%" echo     ip = s.getsockname()[0]
>> "%IP_SCRIPT%" echo     s.close()
>> "%IP_SCRIPT%" echo except Exception:
>> "%IP_SCRIPT%" echo     try:
>> "%IP_SCRIPT%" echo         ips = socket.gethostbyname_ex(socket.gethostname())[2]
>> "%IP_SCRIPT%" echo         ips = [x for x in ips if not x.startswith(("127.", "169.254."))]
>> "%IP_SCRIPT%" echo         ip = ips[0] if ips else ""
>> "%IP_SCRIPT%" echo     except Exception:
>> "%IP_SCRIPT%" echo         ip = ""
>> "%IP_SCRIPT%" echo print(ip)

%PY_CMD% "%IP_SCRIPT%" > "%IP_FILE%" 2>nul

set "IP="
for /f "usebackq delims=" %%I in ("%IP_FILE%") do set "IP=%%I"

del "%IP_FILE%" >nul 2>nul
del "%IP_SCRIPT%" >nul 2>nul

if "%IP%"=="" goto ip_error

set "BASE_URL=http://%IP%:%PORT%"
set "DOWNLOAD_URL=%BASE_URL%/download"

echo.
echo ===================================================
echo [!] DOWNLOAD READY
echo ===================================================
echo MODE: %SHARE_MODE%
echo FILE: %TARGET_NAME%
echo URL:  %DOWNLOAD_URL%
echo.
echo Scan the QR code from your phone.
echo The server will close after the first complete download.
echo.

where curl >nul 2>nul
if errorlevel 1 goto no_qr

echo ===================================================
echo QR CODE
echo ===================================================
curl -L "https://qrenco.de/%DOWNLOAD_URL%"
echo.
goto start_server

:no_qr
echo [!] curl was not found, so no QR code was printed.
echo [!] Use the DOWNLOAD URL above manually on your phone.
echo.

:start_server
echo ===================================================
echo [!] STARTING AUTO-CLOSE DOWNLOAD SERVER ON PORT %PORT%...
echo [!] SERVING ONLY THIS FILE: %TARGET_PATH%
echo [!] PRESS CTRL+C TO STOP SHARING MANUALLY.
echo ===================================================
echo.

%PY_CMD% "%SERVER_SCRIPT%" "%TARGET_PATH%" "%TARGET_NAME%" "%PORT%"
set "SERVER_EXIT=%ERRORLEVEL%"

del "%SERVER_SCRIPT%" >nul 2>nul
if "%SERVER_EXIT%"=="0" goto success_exit

echo.
echo ===================================================
echo [!] SERVER STOPPED WITH ERROR. Exit code: %SERVER_EXIT%
echo ===================================================
echo Possible reasons:
echo [1] Port %PORT% is already in use. Try: sharezip docs 9000
echo [2] Windows Firewall blocked Python. Allow Python on Private networks.
echo [3] Python could not access the file.
echo [4] The phone disconnected before the download completed.
echo.
pause
rd /s /q "%SESSION_DIR%" >nul 2>nul
exit /b %SERVER_EXIT%

:success_exit
rd /s /q "%SESSION_DIR%" >nul 2>nul
exit

:python_missing
echo [ERROR] Python was not found in PATH.
echo Install Python, or reinstall it and check "Add python.exe to PATH".
echo.
pause
exit /b 1

:temp_error
echo [ERROR] Could not create temporary folder:
echo %SESSION_DIR%
echo.
pause
exit /b 1

:prepare_script_error
echo [ERROR] Could not extract the internal Python prepare code.
echo.
pause
rd /s /q "%SESSION_DIR%" >nul 2>nul
exit /b 1

:server_script_error
echo [ERROR] Could not extract the internal Python server code.
echo.
pause
rd /s /q "%SESSION_DIR%" >nul 2>nul
exit /b 1

:prepare_error
echo.
echo [ERROR] Share preparation failed. Exit code: %PREPARE_EXIT%
echo.
echo Check the mode or filename you used.
echo Valid modes are: docs, pics, vids
echo Examples:
echo   sharezip docs
echo   sharezip pics
echo   sharezip vids
echo   sharezip report.pdf
echo.
pause
rd /s /q "%SESSION_DIR%" >nul 2>nul
del "%META_CMD%" >nul 2>nul
del "%SERVER_SCRIPT%" >nul 2>nul
exit /b %PREPARE_EXIT%

:meta_missing
echo [ERROR] Internal metadata file was not created correctly.
echo.
pause
rd /s /q "%SESSION_DIR%" >nul 2>nul
del "%SERVER_SCRIPT%" >nul 2>nul
exit /b 1

:target_missing
echo [ERROR] Prepared target file does not exist:
echo %TARGET_PATH%
echo.
pause
rd /s /q "%SESSION_DIR%" >nul 2>nul
del "%SERVER_SCRIPT%" >nul 2>nul
exit /b 1

:ip_error
echo [ERROR] Could not detect your Wi-Fi/LAN IP address.
echo Run ipconfig and look for "IPv4 Address" under Wi-Fi.
echo Then open this manually on your phone:
echo http://YOUR_IPV4_ADDRESS:%PORT%/download
echo.
pause
rd /s /q "%SESSION_DIR%" >nul 2>nul
del "%SERVER_SCRIPT%" >nul 2>nul
exit /b 1

goto :eof

# PYTHON_PREPARE_START
import os
import shutil
import sys
import zipfile
from pathlib import Path

DOC_EXTS = {
    ".txt", ".text", ".md", ".markdown", ".rtf", ".pdf",
    ".doc", ".docx", ".odt", ".ott", ".pages",
    ".xls", ".xlsx", ".ods", ".csv", ".tsv",
    ".ppt", ".pptx", ".odp", ".epub"
}
PIC_EXTS = {
    ".jpg", ".jpeg", ".jpe", ".png", ".webp", ".gif", ".ico",
    ".bmp", ".tif", ".tiff", ".svg", ".heic", ".heif", ".avif"
}
VID_EXTS = {
    ".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".wmv",
    ".flv", ".mpg", ".mpeg", ".3gp", ".3g2", ".mts", ".m2ts"
}
MODE_EXTS = {
    "docs": DOC_EXTS,
    "pics": PIC_EXTS,
    "vids": VID_EXTS,
}
ZIP_NAMES = {
    "all": "shared-folder.zip",
    "docs": "shared-docs.zip",
    "pics": "shared-pictures.zip",
    "vids": "shared-videos.zip",
}
SKIP_DIRS = {"__pycache__", ".pytest_cache"}


def fail(message: str, code: int = 2) -> None:
    print("ERROR:", message)
    sys.exit(code)


def is_int(value: str) -> bool:
    return value.isdigit() and int(value) > 0 and int(value) <= 65535


def cmd_escape(value: str) -> str:
    # Avoid accidental environment expansion when the metadata .cmd is called.
    return value.replace("%", "%%")


def write_meta(meta_path: str, *, target_path: str, target_name: str, port: int, mode: str) -> None:
    lines = [
        f'set "TARGET_PATH={cmd_escape(target_path)}"',
        f'set "TARGET_NAME={cmd_escape(target_name)}"',
        f'set "PORT={port}"',
        f'set "SHARE_MODE={cmd_escape(mode)}"',
    ]
    Path(meta_path).write_text("\r\n".join(lines) + "\r\n", encoding="utf-8")


def resolve_file(share_dir: str, value: str) -> str | None:
    p = Path(value)
    candidates = []
    if p.is_absolute():
        candidates.append(p)
    else:
        candidates.append(Path(share_dir) / value)
        candidates.append(Path.cwd() / value)
    for candidate in candidates:
        try:
            if candidate.is_file():
                return str(candidate.resolve())
        except OSError:
            pass
    return None


def should_include(path: Path, mode: str) -> bool:
    if mode == "all":
        return True
    return path.suffix.lower() in MODE_EXTS[mode]


def create_zip(share_dir: str, session_dir: str, mode: str) -> tuple[str, str, int, int]:
    src = Path(share_dir).resolve()
    folder_name = src.name or "shared-folder"
    zip_name = ZIP_NAMES[mode]
    zip_path = Path(session_dir) / zip_name
    count = 0
    total_bytes = 0

    print(f"Creating ZIP snapshot. Mode: {mode}")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as z:
        for root, dirs, files in os.walk(src):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            root_path = Path(root)
            for name in files:
                full = root_path / name
                try:
                    if full.resolve() == zip_path.resolve():
                        continue
                    if not should_include(full, mode):
                        continue
                    rel = full.relative_to(src)
                    arc = Path(folder_name) / rel
                    z.write(full, str(arc))
                    count += 1
                    total_bytes += full.stat().st_size
                except Exception as exc:
                    print(f"Skipped: {full} - {exc}")

    if mode != "all" and count == 0:
        try:
            zip_path.unlink(missing_ok=True)
        except Exception:
            pass
        fail(f"No matching files found for mode '{mode}'.", 7)

    print("ZIP ready:", zip_path)
    print("Files packed:", count)
    print("Original size:", round(total_bytes / 1024 / 1024, 2), "MB")
    return str(zip_path), zip_name, count, total_bytes


def main() -> None:
    if len(sys.argv) < 4:
        fail("Internal usage error.")

    share_dir = sys.argv[1]
    session_dir = sys.argv[2]
    meta_path = sys.argv[3]
    raw_args = [a for a in sys.argv[4:] if a != ""]

    if len(raw_args) > 2:
        fail("Too many arguments. Use only one mode/file argument and optional port.")

    port = 8000
    mode = "all"
    direct_file = None

    if not raw_args:
        pass
    elif len(raw_args) == 1:
        arg = raw_args[0]
        low = arg.lower()
        if low in MODE_EXTS:
            mode = low
        elif is_int(arg):
            port = int(arg)
        else:
            direct_file = resolve_file(share_dir, arg)
            if not direct_file:
                fail(f"Argument is not a valid mode, port, or existing file: {arg}", 3)
    else:
        first, second = raw_args
        if not is_int(second):
            fail(f"Second argument must be a port number. Got: {second}", 4)
        port = int(second)
        low = first.lower()
        if low in MODE_EXTS:
            mode = low
        else:
            direct_file = resolve_file(share_dir, first)
            if not direct_file:
                fail(f"First argument is not a valid mode or existing file: {first}", 5)

    if direct_file:
        target_path = direct_file
        target_name = Path(direct_file).name
        share_mode = "single-file"
        size = Path(direct_file).stat().st_size
        print("Single file mode. No ZIP will be created.")
        print("File:", target_path)
        print("Size:", round(size / 1024 / 1024, 2), "MB")
    else:
        target_path, target_name, _, _ = create_zip(share_dir, session_dir, mode)
        share_mode = f"zip-{mode}"

    write_meta(meta_path, target_path=target_path, target_name=target_name, port=port, mode=share_mode)


if __name__ == "__main__":
    main()
# PYTHON_PREPARE_END

# PYTHON_SERVER_START
import http.server
import mimetypes
import os
import socketserver
import sys
import threading
import time
from urllib.parse import quote, unquote, urlparse

target_path = os.path.abspath(sys.argv[1])
target_name = sys.argv[2]
port = int(sys.argv[3])
download_path = "/download"

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

class OneDownloadHandler(http.server.BaseHTTPRequestHandler):
    server_version = "MobileShare/4.0"

    def log_message(self, fmt, *args):
        print(f"{self.client_address[0]} - {fmt % args}")

    def send_download_headers(self):
        size = os.path.getsize(target_path)
        content_type = mimetypes.guess_type(target_name)[0] or "application/octet-stream"
        fallback = target_name.encode("ascii", "ignore").decode("ascii") or "download"
        encoded = quote(target_name)
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(size))
        self.send_header("Content-Disposition", f'attachment; filename="{fallback}"; filename*=UTF-8\'\'{encoded}')
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_HEAD(self):
        path = unquote(urlparse(self.path).path)
        if path == download_path and os.path.isfile(target_path):
            self.send_download_headers()
        else:
            self.send_error(404, "File not found")

    def do_GET(self):
        path = unquote(urlparse(self.path).path)

        if path in ("/", ""):
            self.send_response(302)
            self.send_header("Location", download_path)
            self.end_headers()
            return

        if path == "/favicon.ico":
            self.send_error(404, "No favicon")
            return

        if path != download_path:
            self.send_error(404, "File not found")
            return

        if not os.path.isfile(target_path):
            self.send_error(404, "Target file not found")
            return

        try:
            self.send_download_headers()
            with open(target_path, "rb") as f:
                while True:
                    chunk = f.read(1024 * 1024)
                    if not chunk:
                        break
                    self.wfile.write(chunk)

            self.wfile.flush()
            print()
            print(f"Download completed by {self.client_address[0]}.")
            print("Closing server and terminal...")
            threading.Thread(target=self.shutdown_soon, daemon=True).start()

        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError) as exc:
            print(f"Client disconnected before completing the download: {exc}")
        except Exception as exc:
            print(f"Download error: {exc!r}")

    def shutdown_soon(self):
        time.sleep(1)
        self.server.shutdown()

with ReusableTCPServer(("0.0.0.0", port), OneDownloadHandler) as httpd:
    print(f"Server ready on port {port}.")
    print(f"Serving: {target_path}")
    print("Waiting for the first complete download...")
    httpd.serve_forever()

print("Server closed after first complete download.")
# PYTHON_SERVER_END
