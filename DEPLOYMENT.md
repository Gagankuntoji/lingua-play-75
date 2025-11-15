# Deployment Guide for LinguaLearn

This guide will help you deploy your LinguaLearn application to various platforms.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (optional, you can also use the web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   vercel
   ```
   Follow the prompts to link your project.

3. **Deploy via GitHub** (Recommended):
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your repository: `Gagankuntoji/lingua-play-75`
   - Configure environment variables:
     - `VITE_SUPABASE_URL` = Your Supabase URL
     - `VITE_SUPABASE_PUBLISHABLE_KEY` = Your Supabase publishable key
     - `VITE_GEMINI_API_KEY` = Your Gemini API key (recommended, free tier available)
     - `VITE_OPENAI_API_KEY` = Your OpenAI API key (optional, fallback)
   - Click "Deploy"

4. **Your app will be live at**: `https://lingua-play-75.vercel.app` (or your custom domain)

---

### Option 2: Netlify

1. **Deploy via GitHub**:
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository: `Gagankuntoji/lingua-play-75`
   - Build settings (auto-detected from `netlify.toml`):
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables in Site settings → Environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_GEMINI_API_KEY` (recommended, free tier available)
     - `VITE_OPENAI_API_KEY` (optional, fallback)
   - Click "Deploy site"

2. **Your app will be live at**: `https://random-name.netlify.app` (or your custom domain)

---

### Option 3: GitHub Pages (Requires additional setup)

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Select source: `gh-pages` branch
   - Save

---

## 📋 Pre-Deployment Checklist

- [ ] Environment variables are configured in your deployment platform
- [ ] Supabase project is set up and migrations are applied
- [ ] Row-level security policies are configured in Supabase
- [ ] Production build works locally (`npm run build`)
- [ ] All API keys are added to environment variables (never commit them!)

---

## 🔧 Environment Variables

Make sure to add these in your deployment platform:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | ✅ Yes |
| `VITE_GEMINI_API_KEY` | Google Gemini API key (free tier available) | ⭐ Recommended |
| `VITE_OPENAI_API_KEY` | OpenAI API key for ChatGPT (fallback) | ❌ Optional |

---

## 🧪 Testing the Build Locally

Before deploying, test your production build:

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to preview the production build.

---

## 🔄 Continuous Deployment

Both Vercel and Netlify automatically deploy when you push to your main branch. Just commit and push:

```bash
git add .
git commit -m "Deploy updates"
git push origin main
```

---

## 🌐 Custom Domain

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Netlify:
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS as instructed

---

## 📝 Notes

- The `vercel.json` and `netlify.toml` files are already configured
- Your app uses client-side routing (React Router), so all routes redirect to `index.html`
- Environment variables starting with `VITE_` are exposed to the client
- Never commit `.env` files with real keys to GitHub

---

## 🆘 Troubleshooting

**Build fails:**
- Check that all dependencies are in `package.json`
- Verify Node.js version (requires ≥18)
- Check build logs in your deployment platform

**Environment variables not working:**
- Ensure they're set in your deployment platform's settings
- Restart/redeploy after adding variables
- Check variable names match exactly (case-sensitive)

**404 errors on routes:**
- Verify redirect rules are configured (already in `vercel.json` and `netlify.toml`)
- Check that `index.html` is in the root of the build output

---

Happy deploying! 🎉

