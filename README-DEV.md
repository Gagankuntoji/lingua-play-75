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
npm run dev         # frontend only
npm run server      # backend auth proxy (optional)
npm run dev:full    # run both together
```

## Method 4: Use Git Bash or WSL
If you have Git Bash or WSL installed:
```bash
npm run dev
```

---

## Environment quick-start
1. Copy `env.example` to `.env.local`.
2. Fill in Supabase `URL` + `anon key` and your Gemini API key (from [Google AI Studio](https://makersuite.google.com/app/apikey)).
3. Restart `npm run dev` so Vite reloads the variables.

---

## Current Status
- Frontend: http://localhost:8080
- Backend proxy: http://localhost:3333 (health check at /api/health)
- Build tested: ✅ Working
- Ready for deployment: ✅ Yes

