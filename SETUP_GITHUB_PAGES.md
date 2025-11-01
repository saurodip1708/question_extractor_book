# 🚀 Quick Setup Guide - Enable GitHub Pages

## Your code is now on GitHub! Follow these steps to make it live:

---

## Step-by-Step Instructions

### 1️⃣ Go to Repository Settings
1. Open https://github.com/ClaexaAI/question_extractor
2. Click the **Settings** tab (top right)

### 2️⃣ Enable GitHub Pages
1. In the left sidebar, scroll down and click **Pages**
2. Under **Build and deployment**:
   - **Source**: Select **"GitHub Actions"** from the dropdown
3. The page will refresh automatically

### 3️⃣ Wait for Deployment
1. Go to the **Actions** tab (top menu)
2. You should see "Deploy static content to Pages" workflow running
3. Click on it to watch the progress
4. Wait 2-3 minutes for completion ⏱️

### 4️⃣ Access Your Live App! 🎉
Once deployment completes, your app will be live at:

**🔗 https://claexaai.github.io/question_extractor/**

---

## 📱 Using Your App

### First Time Setup:
1. **Enter Gemini API Key**
   - Get free key: https://aistudio.google.com/app/apikey
   - Paste it in the form
   - Click "Start Analyzing"
   - Key is saved in your browser

### Analyzing Books:
1. **Upload PDF** - Drag & drop or click to browse
2. **Select Board** - Choose from dropdown (CBSE, ICSE, etc.)
3. **Enter Subject** - Type subject name (Mathematics, Science, etc.)
4. **Click "Analyze Book"** - Processing begins!
5. **Download Files** - Markdown files download automatically

### Features:
- ✅ Extracts all questions from each chapter
- ✅ Classifies by difficulty (Easy/Medium/Hard)
- ✅ Categorizes by Bloom's Taxonomy
- ✅ Includes board and subject metadata
- ✅ Works with text and image-based questions

---

## 🔄 Making Updates

Whenever you make changes to the code:

```bash
git add .
git commit -m "Your update description"
git push origin main
```

GitHub Actions will automatically rebuild and redeploy! ✨

---

## 🆘 Troubleshooting

### Deployment Not Working?
- Check the **Actions** tab for error messages
- Ensure GitHub Pages source is set to "GitHub Actions"
- Wait a few minutes - sometimes it takes time

### App Not Loading?
- Clear browser cache
- Check if deployment completed successfully
- Verify the URL: https://claexaai.github.io/question_extractor/

### API Key Issues?
- Get new key from https://aistudio.google.com/app/apikey
- Click "Change API Key" in the app to update
- Make sure to enable Gemini API in Google Cloud Console

---

## ✅ What's Been Completed

- [x] API key input system (localStorage)
- [x] Board and subject selection
- [x] All compilation errors fixed
- [x] GitHub repository created
- [x] Code pushed to GitHub
- [x] GitHub Actions workflow configured
- [x] vite.config.ts updated for GitHub Pages
- [x] Build tested and successful
- [x] Documentation created

## 🎯 Next Action Required

**Enable GitHub Pages in repository settings** (See steps above)

That's it! Once you enable GitHub Pages, your app will be live! 🚀
