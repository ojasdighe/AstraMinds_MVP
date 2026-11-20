# AstraMinds — Complete Catalog of Currently Available Features

This document details every feature currently implemented, active, and tested in the **AstraMinds MVP** codebase.

---

## 1. Landing Page & Institutional Presentation

* **Left-Aligned High-Impact Hero:**
  * Punchy typography: *"Save Like a Pro. Stay Safe Online."*
  * Clear value proposition: *"Pocket-money budgeting, interactive daily challenges & digital money safety superpowers built specifically for students aged 8–14."*
  * Quick-action buttons: *"Start Learning Free"* and *"Sign In"*.
  * Clean trust badges bar: *100% Safe Sandbox*, *Daily Challenges*, *Age-Adaptive Curriculum*.
* **"Why It Matters" Research & News Clippings Section:**
  * Replaces fake generic customer reviews with authenticated news articles and scientific findings.
  * Research citations from *The Economic Times*, *Cambridge University*, *Reserve Bank of India (RBI)*, *LiveMint*, and *NEP 2020*.
  * Focuses on the youth financial literacy gap, impulsive digital spending, and online gaming scams.
* **Concept Validation & Survey Insights (Bento Grid):**
  * Displays findings from pre-launch concept validation interviews with parents and students.
  * Real-world statistics: average milestone targets (₹4,500), scam-detection confidence improvements, and pocket-money tracking habits.
* **Interactive Feature Showcase:**
  * Tabbed feature previews highlighting pocket money tracking, goal jars, and scam spotter drills.
* **Institutional FAQ Section:**
  * Details AstraMinds' **hybrid delivery model** (offline experiential courses in select cities + digital platform subscription).
  * Direct contact channels with interactive `mailto:` and `tel:` links: `contact@astraminds.in` & `+91 73786 55805`.

---

## 2. Onboarding & Age-Tier Calibration (Ages 8–14)

* **Strict Age-Gating:**
  * Enforces student age between **8 and 14** (blocking invalid entries on both frontend and backend).
* **Grade Selection:**
  * Selectable from **Grade 3 through Grade 9**.
* **Preferred Name / Nickname:**
  * Personalized greeting across the dashboard, quizzes, and AI coaching dialogues.
* **Live Dynamic Curriculum Tier Preview:**
  * **Junior Savers (Ages 8–10 / Grades 3–5):** Visual saving jars, needs vs. wants stories, and basic piggy bank fundamentals.
  * **Smart Budgeters (Ages 11–13 / Grades 6–8):** Pocket-money budgeting, allowance planning, and phishing scam detection.
  * **Financial Explorers (Age 14 / Grade 9):** Compound savings math, banking primitives simulation, and advanced cyber hygiene.
* **Welcome Notification:**
  * Automatically delivers a personalized onboarding welcome notification to the student's notification center.

---

## 3. Student Dashboard Hub (`DashboardHome.tsx`)

* **"Today's Mission" Hero Banner:**
  * Single prominent daily call-to-action designed to eliminate choice paralysis for younger students.
  * Highlights the current daily mission with glowing rewards pill (`⚡ +50 Coins • +30 XP`) and direct *"Start Mission"* button.
* **Guided First-Day Mission (Coachmarks Checklist):**
  * Friendly 3-step starter checklist:
    1. 🎯 *Step 1: Set your first dream savings goal*
    2. 🛡️ *Step 2: Take today's 2-minute safety challenge*
    3. 💰 *Step 3: Log pocket money or chore reward*
  * Live progress indicator (`0/3` to `3/3`), collapsible view, and unlockable *"First Mission Master"* milestone celebration.
* **Header Stats Bar:**
  * Real-time Level badge, XP progress bar, active Streak Counter (with fire animation), and Gold Coins wallet.
* **Virtual Debit Card Preview:**
  * Sleek brushed-metal card visual reflecting the student's **Cumulative Net Balance**.
* **Quick Challenge Cards:**
  * Direct access to *Money Smarts Quiz*, *Digital Money Safety Quiz*, *Money Smarts Flashcards*, and *Daily Challenge*.
* **Savings Trajectory Graph:**
  * Visual historical chart tracking cumulative savings over time.
* **Weekly Leaderboard Preview:**
  * Friendly student rankings based on weekly learning XP.

---

## 4. Pocket Money Tracker & Cash Flow Management

* **Income & Expense Logging:**
  * One-click manual transaction modal with amount, date, payment method, category, merchant, and notes.
* **Kid-Friendly Categories:**
  * *Snacks & Treats*, *Books & Comics*, *Games & Apps*, *Toys & Hobbies*, *Sports & Clubs*, *School Supplies*, *Chore Rewards*, *Pocket Money*, and *Gift Money*.
* **Auto-Allowance Scheduler:**
  * Parents or students can configure weekly (e.g. ₹200 every Sunday) or monthly allowance auto-deposits.
  * Optional toggle to credit the first allowance directly into the balance upon saving.
* **Needs vs. Wants Donut Chart:**
  * Automatically classifies expenses into Essentials vs. Fun Extras.
  * Renders an interactive Recharts donut chart with percentage breakdown.
  * Provides smart habit coaching advice based on whether the student is maintaining the recommended balance.
* **Category Budget Spending Caps:**
  * Allows setting monthly limits (e.g. ₹300 for Snacks & Treats) with alert badges when approaching or exceeding caps.
* **Timeframe Filters:**
  * Quick filters for *Today*, *This Week*, *This Month*, *Last Month*, or custom date ranges.
* **AI Receipt & Bill Scanner:**
  * Upload bill/receipt photos with automated Gemini OCR extraction for merchant, date, and amount.

---

## 5. Savings Goals, Auto-Save & Visual Jars

* **Goal Creation & Custom Photos:**
  * Set goal name, target amount, target date, and auto-save frequency (Daily, Weekly, Monthly, or Custom days).
  * **Curated 16-Emoji Picker** (`🚲`, `🎮`, `📚`, `⚽`, `🎨`, `🎁`, `🐷`, `🛹`, `🎸`, `💻`, `🔭`, etc.).
  * **Custom Photo Upload:** Upload a photo of the real-world item the student is saving for, rendered directly inside the goal jar.
* **Visual Goal Jar Progress:**
  * Dynamic liquid jar filling animations displaying current saved percentage.
* **Autonomous Goal Auto-Save:**
  * Automatically debits the designated installment from the pocket money balance into the goal jar on schedule.
  * Safety buffer: pauses automatically if the pocket money balance is insufficient (no negative balances).
* **Goal Delay Impact Calculator (Future Simulator):**
  * Visualizes the educational trade-off of impulse purchases.
  * Shows exactly how many days a ₹400 toy purchase will push back the completion date of a ₹4,500 bicycle.
* **Goal Milestone Celebration (100% Achieved):**
  * Full-screen celebratory banner and unlockable **"Goal Crusher 🏆"** profile badge.
  * One-click **"Download Achievement Certificate (PDF)"** formatted for printing and sharing with parents.

---

## 6. Daily Budget Challenges (AI-Powered Dilemmas)

* **Age-Calibrated Daily Dilemmas:**
  * Generates realistic student scenarios (e.g. school canteen lunch, weekend sports tournament, science fair supplies).
* **Sudden Emergency Expenses:**
  * Introduces surprise events (e.g. flat bicycle tyre, lost school compass) requiring students to adapt and prioritize essentials.
* **Needs vs. Wants Trade-Off Engine:**
  * Students pick which items to buy and write a 1-sentence budget justification.
* **Instant AI Feedback & Scoring:**
  * Grades decisions into `EXCELLENT`, `GOOD`, or `NEEDS_IMPROVEMENT`.
  * Awards up to 100 Gold Coins and 40 XP.
* **Past Scenarios Journal (Decision Archive):**
  * Dedicated journal tab archiving all past challenges.
  * Displays cumulative savings achieved, coins earned, student reasoning, and AI feedback tips.

---

## 7. Weekly Quizzes & Digital Money Safety Drills

* **Dual-Track Quiz Architecture:**
  * **Track 1: Money Smarts:** Saving math, interest concepts, budgeting rules, and Needs vs. Wants.
  * **Track 2: Digital Money Safety:** Scam identification, OTP secrecy, fake gaming links, and parent permission.
* **Visual Scam Red-Flag Challenge:**
  * Interactive smartphone message mockup simulating a phishing attempt (*"CONGRATS! You won 10,000 Free Gems!"*).
  * Students tap interactive red-flag hotspots (*Demands Secret OTP*, *Suspicious Link*, *Urgency Pressure*) to disarm the scam.
* **Step-by-Step Explanations:**
  * Detailed educational rationale displayed immediately after answering each question.
* **Weekly Coin Bounties:**
  * Earn up to 200 Gold Coins per quiz track weekly.

---

## 8. Gamification & Coin Economy

* **Daily Spin Wheel:**
  * Daily free spin awarding bonus coins, XP bursts, and streak shields.
* **Streaks & Streak Shields:**
  * Consecutive day tracking with fire animations.
  * Streak shields protect progress if a day is missed.
* **Coin Shop (Cosmetics & Avatars):**
  * Unlockable avatars (*Shadow Ninja*, *Extraterrestrial*, *Spartan Warrior*, *God of War*).
* **Parent-Approved Reward Vouchers:**
  * Trade virtual Gold Coins for real-world parent privileges:
    * 🎮 *1 Extra Hour of Weekend Gaming* (150 coins)
    * 🍦 *Ice Cream Parlor Outing with Parents* (200 coins)
    * 🎬 *Friday Family Movie & Popcorn Pick* (120 coins)
    * 🧹 *One Night Chore Pass* (180 coins)
    * 📚 *Bookstore / Comic Pick of Choice* (250 coins)
  * Generates an official digital voucher pass with unique pass code and parent signature verification stamp.
* **Money Smarts Flashcards:**
  * 24 interactive flip-cards explaining key financial terminology in kid-friendly language.
* **Level Progression:**
  * Tiered level ranking (*Novice Saver* → *Coin Master*) based on lifetime XP.

---

## 9. Split Rooms (Shared & Group Expenses)

* **Room Creation & Code Sharing:**
  * Create group expense rooms for school projects, group gifts, or family outings.
* **Expense Splitting:**
  * Split equally or custom amounts among room members.
* **Settlement Tracking:**
  * Real-time calculation of who owes what with one-click payment recording.

---

## 10. Reporting, PDF Generation & Parent Utilities

* **Goal Summary PDF:**
  * Downloadable printable summary with savings milestone charts.
* **Monthly Financial Report PDF:**
  * Formatted statement showing income, expenses, category breakdown, and savings progress.
* **Classroom / Milestone Certificates:**
  * Achievement certificates recognizing goal completions.

---

## 11. Platform, PWA & Cloud Infrastructure

* **PWA (Progressive Web App):**
  * Installable as a native-like app on iPads, Android tablets, Chromebooks, and smartphones via Web App Manifest.
  * Offline shell caching powered by a dedicated Service Worker.
* **Hybrid Data Persistence:**
  * **Local:** Zero-config atomic disk snapshotting (`data/astraminds_store.json`) for seamless offline development.
  * **Production:** Native integration with **Google Cloud Firestore** via Application Default Credentials (ADC).
* **Google Cloud Run Deployment:**
  * Production-ready multi-stage Docker container (`PORT=8080`).
  * Automated CI/CD pipeline via `cloudbuild.yaml` triggered on git push.
