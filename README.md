# 🧠 MindVault AI — Chrome Extension

> AI-powered browsing memory assistant with focus analytics & smart summaries

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![Manifest](https://img.shields.io/badge/manifest-v3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📁 Project Structure

```
mindvault-ai/
├── manifest.json          ← Chrome Extension configuration (MV3)
├── background.js          ← Service worker: tab tracking, storage, alarms
├── content.js             ← Injected into pages: scroll detection, meta extraction
├── popup.html             ← Main extension popup UI
├── popup.css              ← Glassmorphism dark theme styles
├── popup.js               ← Popup logic: tabs, memory list, charts, modals
├── options.html           ← Settings page
├── options.css            ← Settings page styles
├── options.js             ← Settings page logic
├── utils/
│   ├── ai.js              ← Anthropic Claude API calls (summaries, search, insights)
│   └── analytics.js       ← Focus score calculation, weekly reports
└── icons/
    ├── icon16.png         ← Extension toolbar icon (16×16)
    ├── icon32.png         ← Extension icon (32×32)
    ├── icon48.png         ← Extension management icon (48×48)
    └── icon128.png        ← Chrome Web Store icon (128×128)
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 Smart Memory | Auto-saves every page: title, URL, favicon, timestamp, category |
| ✨ AI Summaries | Claude AI generates 2-3 sentence summaries + key points per page |
| 🔍 NL Search | Natural language queries: "React article from yesterday" |
| 🎯 Focus Score | 0–100 score based on productivity mix, tab switching, doomscrolling |
| 📊 Analytics | Daily + weekly charts, time per site, category breakdown |
| 📌 Pin Pages | Save important pages for quick reference |
| 📋 Daily Insights | AI-generated personalised productivity tips |
| 🔔 Notifications | Doomscroll alerts, daily focus report at 11pm |
| ⬇️ Export | Download all data as JSON backup |
| ⌨️ Shortcuts | `Alt+Shift+M` to open, `Alt+Shift+S` to pin current page |

---

## 🚀 How to Install in Chrome (Developer Mode)

### Step 1 — Download the extension
1. Download the `mindvault-ai` folder (or clone the GitHub repo)
2. Place it somewhere permanent on your computer (e.g., `Desktop/mindvault-ai`)
   ⚠️ **Don't move or delete this folder after loading** — Chrome needs it to stay

### Step 2 — Enable Developer Mode
1. Open Chrome and go to: **`chrome://extensions`**
2. Toggle **"Developer mode"** ON (top-right corner)

### Step 3 — Load the Extension
1. Click **"Load unpacked"** button (top-left)
2. Browse to and select your `mindvault-ai` folder
3. Click **"Select Folder"**

### Step 4 — Verify Installation
- You should see **MindVault AI** appear in your extensions list
- The brain icon 🧠 should appear in your Chrome toolbar
- Click it to open the popup!

---

## 🔑 Setting Up AI Features

To use AI summaries, smart search, and daily insights:

1. Click the **⚙️ Settings** button in the popup (or right-click extension → Options)
2. Go to **"✨ AI Settings"**
3. Get a free API key from [console.anthropic.com](https://console.anthropic.com):
   - Sign up / Log in
   - Go to **API Keys** → **Create Key**
   - Copy the key (starts with `sk-ant-api03-…`)
4. Paste it into the **API Key** field
5. Click **"🔌 Test Connection"** to verify
6. Click **"Save AI Settings"**

> 💡 Your API key is stored **locally in your browser only** — it never leaves your device.

---

## 🔄 How to Update the Extension

### If you have the folder on your computer:
1. Edit the files directly (see GitHub section below for online editing)
2. Go to `chrome://extensions`
3. Find MindVault AI → click **"↺ Reload"** (or the circular arrow icon)

### To update the version number:
1. Open `manifest.json`
2. Change `"version": "1.0.0"` → `"version": "1.1.0"` (or whatever makes sense)
3. Reload the extension in Chrome

---

## 📂 How to Use GitHub to Edit Files Online

### Setting up GitHub:
1. Create a free account at [github.com](https://github.com)
2. Click **"New repository"** → name it `mindvault-ai`
3. Make it **Private** (recommended, since code may have your API key references)

### Upload your files:
```bash
# In your terminal (Mac/Linux) or Git Bash (Windows):
cd path/to/mindvault-ai
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/mindvault-ai.git
git push -u origin main
```

### Edit files online:
1. Go to your repo on GitHub
2. Click any file → click the **pencil ✏️ icon** to edit
3. Make changes → click **"Commit changes"**
4. Pull changes back to your computer:
   ```bash
   git pull origin main
   ```
5. Reload the extension in Chrome

### GitHub Codespaces (full online editor):
1. In your repo, click **"Code"** → **"Codespaces"** → **"Create codespace"**
2. A full VS Code editor opens in your browser — no local setup needed!

---

## 🏪 How to Publish to Chrome Web Store

### Step 1 — Prepare for publication
1. Make sure `manifest.json` has a clean version number (`"version": "1.0.0"`)
2. Update the `"description"` in manifest.json to be compelling (max 132 chars)
3. Create screenshots of your extension (1280×800 or 640×400 pixels)
4. Create a promotional tile (440×280 pixels) in Canva or Figma

### Step 2 — Create a ZIP file
```bash
# Mac/Linux:
cd path/to/mindvault-ai
zip -r mindvault-ai.zip . -x "*.DS_Store" "*.git*" "*README*"

# Windows: Right-click the mindvault-ai folder → "Send to" → "Compressed folder"
```

### Step 3 — Register as a Chrome Developer
1. Go to [chromewebstore.google.com/devconsole](https://chromewebstore.google.com/devconsole)
2. Pay the **one-time $5 registration fee**
3. Agree to the developer agreement

### Step 4 — Upload your extension
1. Click **"New Item"**
2. Upload your ZIP file
3. Fill in:
   - **Title:** MindVault AI
   - **Description:** Detailed description of all features
   - **Category:** Productivity
   - **Screenshots:** At least 1 required
   - **Privacy policy:** Required (you can use a simple one)
4. Submit for review

### Step 5 — Wait for review
- Google reviews typically take **1–3 business days**
- You'll receive an email when approved (or if changes are needed)
- Once approved, it goes live at a URL like:
  `https://chromewebstore.google.com/detail/mindvault-ai/YOUR_EXTENSION_ID`

### Publishing tips:
- 🏷️ Use relevant keywords in your description
- 📸 High-quality screenshots increase install rates significantly
- 🔒 Write a clear privacy policy (required for extensions that access browsing data)
- 📝 Simple privacy policy template: "MindVault AI stores all data locally using Chrome's storage API. No data is transmitted to external servers except optional Anthropic API calls for AI features."

---

## 🔧 How to Deploy a Backend (Future)

If you want to add a backend (e.g., sync across devices, server-side AI):

### Option A — Node.js + Express (simplest)
```bash
# 1. Set up a new project
mkdir mindvault-backend && cd mindvault-backend
npm init -y
npm install express cors dotenv

# 2. Create server.js
cat > server.js << 'EOF'
const express = require('express');
const cors    = require('cors');
const app     = express();
app.use(cors({ origin: 'chrome-extension://YOUR_EXTENSION_ID' }));
app.use(express.json());

app.post('/api/summarise', async (req, res) => {
  // Proxy Anthropic API call here
  res.json({ summary: '...', keyPoints: [] });
});

app.listen(3000, () => console.log('MindVault backend running on port 3000'));
EOF

# 3. Deploy to Railway (free tier)
# Go to railway.app → New Project → Deploy from GitHub
```

### Option B — Supabase (for user sync & auth)
```bash
# 1. Create project at supabase.com (free tier)
# 2. Get your URL and anon key
# 3. In your extension, use:

const SUPABASE_URL = 'https://xxx.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

// Save visit to Supabase
async function syncVisit(visit) {
  await fetch(`${SUPABASE_URL}/rest/v1/visits`, {
    method:  'POST',
    headers: {
      'apikey':       SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(visit),
  });
}
```

### Option C — Cloudflare Workers (serverless, free)
```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Create a new worker
wrangler init mindvault-api

# 3. Deploy
wrangler deploy

# Your backend is live at: https://mindvault-api.YOUR_SUBDOMAIN.workers.dev
```

### Connecting backend to extension
In `manifest.json`, add your backend URL to `host_permissions`:
```json
"host_permissions": [
  "<all_urls>",
  "https://your-backend.railway.app/*"
]
```

---

## 🛠️ Development Tips

### Debugging the extension:
- **Popup errors:** Right-click the extension icon → "Inspect popup"
- **Background errors:** `chrome://extensions` → Click "Service Worker" link under MindVault AI
- **Content script errors:** Open DevTools (F12) on any webpage → Console tab

### Useful Chrome APIs used:
```javascript
chrome.tabs.onActivated.addListener(...)   // Tab switching
chrome.tabs.onUpdated.addListener(...)     // Page loads
chrome.storage.local.get/set(...)          // Data persistence
chrome.notifications.create(...)           // Desktop notifications
chrome.alarms.create/onAlarm(...)          // Scheduled tasks
chrome.scripting.executeScript(...)        // Inject code into pages
chrome.runtime.sendMessage/onMessage(...)  // Component communication
```

### Hot-tip for faster development:
Install the **"Extensions Reloader"** Chrome extension — it adds a button to reload all unpacked extensions with one click!

---

## 📊 Focus Score Algorithm

The score (0–100) is calculated as:

| Component | Max Points | Criteria |
|-----------|-----------|---------|
| Productive site ratio | 35 | % of time on Tech/Education/Productivity |
| Low tab switching | 25 | Ideal < 50 switches/day |
| No doomscrolling | 20 | -5 pts per doomscroll session |
| Active time | 20 | Ideal: 4–8 hours |

**Score Labels:**
- 85–100: Excellent 🚀
- 70–84: Good 👍
- 50–69: Average 😐
- 30–49: Distracted 😅
- 0–29: Low Focus 😴

---

## 🔒 Privacy

- ✅ All data stored **locally** via `chrome.storage.local`
- ✅ No tracking pixels or analytics
- ✅ No data sent anywhere except:
  - Anthropic API (only when you use AI features, with your own key)
  - Google Favicons API (`g.co/s2/favicons`) for site icons
- ✅ Export your data anytime as JSON
- ✅ Clear all data instantly from Settings → Privacy

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ using Chrome Extension APIs + Anthropic Claude AI*
