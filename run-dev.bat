@echo off
REM Batch file to run the dev server
REM This works around PowerShell execution policy issues

cd /d %~dp0
npm run dev

