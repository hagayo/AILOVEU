@echo off
setlocal enabledelayedexpansion

:: Created by Hagay Onn, https://ailoveu.art

:: get current folder name from path
for %%I in ("%cd%") do set "FolderName=%%~nxI"

:: text to say in voice
set "text=You are currently at folder !FolderName!."

:: magic powershell command to say the text
powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('!text!')"
