<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ua3cWnzS5N57oX0VWXvBse_SWExA2WaY

## Features

- **PDF Book Analysis**: Upload a PDF textbook and automatically extract chapters
- **Board & Subject Selection**: Select the educational board (CBSE, ICSE, etc.) and specify the subject before analysis
- **Question Extraction**: Uses Gemini AI to extract all questions from each chapter
- **Bloom's Taxonomy Classification**: Each question is classified by difficulty and Bloom's taxonomy level
- **Metadata in Output**: Each generated markdown file includes board and subject information at the top
- **Automatic Downloads**: Get individual markdown files for each chapter with full analysis

## Run Locally

**Prerequisites:**  Node.js and pnpm (or npm)

1. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

2. Run the app:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

3. When you first open the app, you'll be prompted to enter your Gemini API key
   - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - The key is stored locally in your browser's localStorage
   - It's never sent to any server except Google's Gemini API

## Deploy to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Setup Steps:

1. **Update Repository Name in `vite.config.ts`**:
   ```typescript
   base: '/your-repository-name/'
   ```

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to **Pages** section
   - Under **Source**, select "GitHub Actions"

3. **Push to Main Branch**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Access Your Deployed App**:
   - After the workflow completes, your app will be available at:
   - `https://your-username.github.io/your-repository-name/`

### Manual Deployment (Alternative):

If you prefer manual deployment using gh-pages:

```bash
pnpm run build
pnpm run deploy
```

## How to Use

1. Upload a PDF textbook using the file uploader
2. Select the educational board from the dropdown (CBSE, ICSE, State Board, IB, Cambridge, or Other)
3. Enter the subject name (e.g., Mathematics, Science, English)
4. Click "Analyze Book" to start processing
5. The app will:
   - Extract the table of contents
   - Download a `chapters.txt` file with all chapters
   - Process each chapter individually
   - Download markdown files for each chapter with board and subject metadata

## Output Format

Each chapter markdown file will include:
```markdown
---
**Board:** CBSE
**Subject:** Mathematics
---

### Question 1
**Question:** [Question text]
**Difficulty:** [Easy/Medium/Hard]
**Bloom's Level:** [Remembering/Understanding/Applying/Analyzing/Evaluating/Creating]
```
