# AstraMinds — Process Flow Diagrams

This document outlines the core operational workflows and student journeys across the AstraMinds platform using Mermaid process diagrams.

---

## 1. Student Onboarding & Age-Tier Calibration Flow

This flow illustrates the user onboarding journey, age-gating (strictly ages 8–14), and adaptive curriculum calibration.

```mermaid
flowchart TD
    Start([User Registration / Login]) --> CheckAuth{Is Authenticated?}
    CheckAuth -- No --> LoginPage[Redirect to /login or /signup]
    CheckAuth -- Yes --> CheckOnboarding{Onboarding Completed?}
    
    CheckOnboarding -- Yes --> Dashboard[Redirect to Main Dashboard]
    CheckOnboarding -- No --> OpenModal[Display Onboarding Modal]
    
    OpenModal --> InputData[Collect Nickname, Age & Grade]
    InputData --> ValidateAge{Age between 8 and 14?}
    
    ValidateAge -- No --> ShowError[Display Error: Age must be 8 to 14]
    ShowError --> InputData
    
    ValidateAge -- Yes --> CalibrateTier[Calibrate Learning Tier]
    
    CalibrateTier --> TierBranch{Age Evaluation}
    TierBranch -- Age 8 to 10 --> JuniorTier[Junior Savers Tier: Concrete Basics & Visual Story Scenarios]
    TierBranch -- Age 11 to 13 --> MiddleTier[Smart Budgeters Tier: Needs vs Wants, Allowance & Phishing Drills]
    TierBranch -- Age 14 --> SeniorTier[Financial Explorers Tier: Compound Interest, Digital Banking & Cyber Defense]
    
    JuniorTier --> SaveProfile[POST /api/complete-onboarding]
    MiddleTier --> SaveProfile
    SeniorTier --> SaveProfile
    
    SaveProfile --> SyncStore[(Sync to Store / Firestore)]
    SyncStore --> WelcomeNotif[Send Tailored Welcome Notification]
    WelcomeNotif --> FirstMission[Initialize First-Day Starter Checklist]
    FirstMission --> Dashboard
```

---

## 2. Daily Student Engagement Loop (AI Budget Mission)

The primary daily loop guiding students through real-world financial decision-making and AI feedback.

```mermaid
flowchart TD
    Login[Student Logs In] --> CheckMission{Today's Mission Completed?}
    CheckMission -- No --> HeroBanner[Highlight 'Today's Mission' Banner]
    CheckMission -- Yes --> CompletedBanner[Show 'Mission Complete' Status]
    
    HeroBanner --> LaunchDaily[Click 'Start Mission Now']
    LaunchDaily --> FetchScenario[GET /api/budget-challenge/daily]
    
    FetchScenario --> CheckCache{Scenario Exists for Today?}
    CheckCache -- Yes --> ReturnScenario[Load Daily Challenge]
    CheckCache -- No --> AgentGen[Gemini AI Agent Generates Calibrated Scenario]
    AgentGen --> ReturnScenario
    
    ReturnScenario --> DisplayUI[Display Starting Budget, Dilemma & Sudden Emergency Expense]
    DisplayUI --> StudentSelect[Student Selects Items & Decides on Sudden Expense]
    StudentSelect --> StudentReasoning[Student Writes 1-Sentence Budget Reasoning]
    
    StudentReasoning --> SubmitPlan[POST /api/budget-challenge/submit]
    SubmitPlan --> AIReview[AI Evaluator Grades Needs vs Wants & Reasoning]
    
    AIReview --> ScoreBranch{Verdict}
    ScoreBranch -- EXCELLENT --> Rew100[Award +100 Coins & +40 XP]
    ScoreBranch -- GOOD --> Rew60[Award +60 Coins & +25 XP]
    ScoreBranch -- NEEDS IMPROVEMENT --> Rew25[Award +25 Coins & +15 XP]
    
    Rew100 --> UpdateStreak[Maintain Daily Save Streak]
    Rew60 --> UpdateStreak
    Rew25 --> UpdateStreak
    
    UpdateStreak --> ArchiveJournal[(Save to Past Scenarios Journal)]
    ArchiveJournal --> ShowReveal[Display Item Classification & AI Advice Tip]
```

---

## 3. Weekly Financial Literacy & Digital Safety Quiz Loop

The dual-track quiz system testing both money management and cybersecurity awareness.

```mermaid
flowchart TD
    SelectQuiz[Select Quiz Track] --> TrackChoice{Track Type}
    
    TrackChoice -- Money Smarts --> LoadMoneyQuiz[Load Needs vs Wants, Saving Math & Budget Quizzes]
    TrackChoice -- Digital Safety --> LoadSafetyDrill[Load OTP Protection, Phishing & Gaming Scams]
    
    LoadSafetyDrill --> RedFlagDrill[Interactive Visual Phone Notification Simulation]
    RedFlagDrill --> StudentTaps[Student Taps 3 Red Flags: OTP Demand, Weird Shortlink, Urgency]
    StudentTaps --> RedFlagDisarmed[Scam Disarmed Educational Animation]
    
    RedFlagDisarmed --> AnswerQuestions[Student Answers 5 Weekly Quiz Questions]
    LoadMoneyQuiz --> AnswerQuestions
    
    AnswerQuestions --> SubmitQuiz[POST /api/submit-quiz or /api/submit-safety-quiz]
    SubmitQuiz --> CalculateScore[Calculate Score & Explanations]
    
    CalculateScore --> AwardCoins[Award up to 200 Gold Coins & Level XP]
    AwardCoins --> UpdateUserRecord[(Update Coins & Profile in Firestore / Store)]
    UpdateUserRecord --> ShowExplanations[Display Detailed Step-by-Step Educational Answers]
```

---

## 4. Savings Goal, Auto-Save & Delay Impact Flow

Illustrates how goal jars operate, how automated allowances fund them, and how impulse purchases trigger the delay impact calculator.

```mermaid
flowchart TD
    CreateGoal[Student Creates Goal Jar] --> InputGoal[Select Icon / Upload Photo, Set Target & Date]
    InputGoal --> SelectFreq[Choose Auto-Save Frequency: Daily / Weekly / Monthly]
    SelectFreq --> CalculateAuto[Calculate Recommended Installment]
    CalculateAuto --> GoalCreated[(Store Goal in Active Jars)]
    
    subgraph Execution Loop
        ScheduleTrigger[Auto-Save Trigger Event] --> CheckBalance{Account Balance >= Installment?}
        CheckBalance -- Yes --> DebitBalance[Debit Pocket Money Balance]
        DebitBalance --> CreditGoal[Credit Goal Jar Saved Amount]
        CreditGoal --> CheckGoal100{Saved Amount >= Target?}
        
        CheckGoal100 -- Yes --> GoalMilestone[Trigger 100% Milestone Celebration]
        GoalMilestone --> ConfettiAnim[Full-Screen Confetti & Sound]
        GoalMilestone --> AwardBadge[Unlock 'Goal Crusher' Badge & Coins]
        GoalMilestone --> CertPDF[Enable Downloadable PDF Achievement Certificate]
        
        CheckBalance -- No --> PauseAuto[Pause Auto-Save & Send Friendly Balance Reminder]
    end
    
    subgraph Impulse Decision Flow
        ImpulseBuy[Student Plans Unplanned Purchase] --> FutureSim[Future Impact Simulator]
        FutureSim --> ComputeDelay[Compute Delay Days = Purchase Cost / Daily Auto-Save Rate]
        ComputeDelay --> DisplayWarning[Display Warning: 'This purchase delays your Goal by X days!']
        DisplayWarning --> DecideBuy{Student Proceed?}
        DecideBuy -- Cancel Purchase --> GoalKept[Goal on Track!]
        DecideBuy -- Proceed --> GoalPushed[Goal Completion Date Pushed Out]
    end
```

---

## 5. Parent-Approved Reward Voucher Redemption Flow

How virtual learning currency bridges to real-world privileges verified by parents.

```mermaid
flowchart TD
    EarnCoins[Student Earns Gold Coins via Quizzes & Challenges] --> OpenShop[Open Coin Shop]
    OpenShop --> SelectVouchers[Select 'Parent Reward Vouchers' Tab]
    
    SelectVouchers --> BrowseVouchers[Browse: Gaming Pass, Ice Cream Outing, Movie Pick, Chore Pass]
    BrowseVouchers --> ChooseVoucher[Choose Voucher & Click 'Redeem Voucher']
    
    ChooseVoucher --> CheckCoins{Coins >= Voucher Cost?}
    CheckCoins -- No --> InsufficientAlert[Display Alert: Need X more coins]
    CheckCoins -- Yes --> DeductCoins[Deduct Gold Coins from User Balance]
    
    DeductCoins --> GeneratePass[Generate Unique Digital Voucher Pass with Code]
    GeneratePass --> SaveRedeemed[(Save Voucher to Local Storage / User State)]
    
    SaveRedeemed --> ShowPassModal[Display Digital Certificate Pass on Screen]
    ShowPassModal --> PresentParent[Student Shows Screen to Parent]
    PresentParent --> ParentVerifies[Parent Verifies Code & Confirms Privilege]
    ParentVerifies --> RealWorldReward[Real-World Reward Fulfilled!]
```
