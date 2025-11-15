# Running the Development Server

If you encounter PowerShell execution policy errors, use one of these methods:

## Method 1: Use the Batch File (Easiest)
```bash
.\run-dev.bat
```

## Method 2: Use CMD directly
```bash
cmd /c "npm run dev"
```

## Method 3: Fix PowerShell Execution Policy (One-time setup)
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then you can use:
```bash
npm run dev
```

## Method 4: Use Git Bash or WSL
If you have Git Bash or WSL installed:
```bash
npm run dev
```

---

## Current Status
- Server runs on: http://localhost:8080
- Build tested: ✅ Working
- Ready for deployment: ✅ Yes

