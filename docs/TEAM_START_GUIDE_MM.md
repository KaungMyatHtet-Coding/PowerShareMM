# PowerShare MM — Team Member စတင်အသုံးပြုရန် လမ်းညွှန်

PowerShare MM ကို လူ ၄ ယောက်က branch ၄ ခုဖြင့် တပြိုင်နက်တည်း ဖွံ့ဖြိုးမည်ဖြစ်သည်။ တစ်ယောက်ပြီးမှ တစ်ယောက်စောင့်ရန် မလိုပါ။ လူတိုင်းတွင် ကိုယ်ပိုင် file ownership ရှိပြီး `main` ပေါ်တွင် တိုက်ရိုက် implementation မလုပ်ရပါ။ အားလုံးသည် frozen contract နှင့် expected results တစ်ခုတည်းမှ စတင်ရမည်ဖြစ်သည်။ Monday ရည်ရွယ်ချက်မှာ production system မဟုတ်ဘဲ အလုပ်လုပ်သော MVP demo တစ်ခုဖြစ်သည်။

## လိုအပ်သော tools

- Git
- VS Code
- Codex extension/access
- Person 1, 2, 4 အတွက် Python 3.11+
- Person 3, 4 အတွက် Node.js 20+ နှင့် npm
- clone/push အတွက် Internet; setup ပြီးနောက် final demo သည် offline အလုပ်လုပ်ရမည်

Prompt ထဲတွင် project configuration ကို စစ်ဆေးပြီးမှ လိုအပ်သော dependencies ကို install လုပ်ပါ။ အစမတင်ခင် random package များကို လူတိုင်း ကြိုတင် install မလုပ်ပါနှင့်။

## ပထမအကြိမ် clone လုပ်ခြင်း

Windows PowerShell တွင်:

```powershell
git clone https://github.com/KaungMyatHtet-Coding/PowerShareMM.git
cd PowerShareMM
git fetch --prune origin
git branch -a
```

- `git clone` သည် repository ကို computer ထဲသို့ copy ယူသည်။
- `cd PowerShareMM` သည် project folder ထဲဝင်သည်။
- `git fetch --prune origin` သည် remote branch အခြေအနေအသစ်ကို ယူပြီး မရှိတော့သော remote refs ကို ရှင်းသည်။
- `git branch -a` တွင် local/remote branches အားလုံးကို ကြည့်နိုင်သည်။

VS Code ဖြင့် parent folder မဟုတ်ဘဲ clone လုပ်ထားသော `PowerShareMM` folder ကိုပဲ Open Folder လုပ်ပါ။

## Person 1 — Mathematical/Algorithm Lead

```powershell
git switch feat/math-engine
git pull --ff-only
git status
```

မှန်ကန်လျှင် status တွင် အနည်းဆုံး အောက်ပါအဓိပ္ပာယ်ရှိရမည်:

```text
On branch feat/math-engine
Your branch is up to date with 'origin/feat/math-engine'.
```

Codex ထံသို့ အောက်ပါ message ကို အတိအကျ ပို့ပါ:

```text
Read and follow docs/prompts/PERSON_1_MATH_ENGINE.md completely. Execute the assigned Person 1 work on the current feat/math-engine branch. Do not work outside the assigned ownership, do not merge into main, and provide the required verification and handoff report when finished.
```

Person 1 သည် utility calculation, payoff matrix, dominance, best response, Nash equilibrium, Pareto frontier, Prisoners Dilemma, Games Against Nature, Nash arbitration, repeated game/Tit-for-Tat နှင့် mathematical unit tests များကို တာဝန်ယူသည်။

ကိုယ်ပိုင်နေရာများ:

- `backend/app/algorithms/`
- `backend/tests/algorithms/`
- `docs/MATHEMATICAL_MODEL.md`

API, database, frontend code ကို Person 1 မရေးရပါ။

## Person 2 — Backend/API/Database Lead

```powershell
git switch feat/backend-api
git pull --ff-only
git status
```

Codex ထံသို့ အောက်ပါ message ကို အတိအကျ ပို့ပါ:

```text
Read and follow docs/prompts/PERSON_2_BACKEND_API.md completely. Execute the assigned Person 2 work on the current feat/backend-api branch. Use the frozen API contract and temporary adapters where the math engine is not yet merged. Do not duplicate authoritative mathematics, do not merge into main, and provide the required verification and handoff report when finished.
```

Person 2 သည် FastAPI application, Pydantic schemas, input validation, API endpoints, standard success/error envelopes, temporary adapters, in-memory fallback, P0 API ပြီးမှ optional SQLite, API contract tests များကို တာဝန်ယူသည်။ Person 1 ကို မစောင့်ဘဲ temporary/mock adapter ဖြင့် စတင်နိုင်သည်။ Utility နှင့် Game Theory formulas ကို ပြန်ရေး/တွက်မလုပ်ရပါ။

ကိုယ်ပိုင်နေရာများ:

- `backend/app/api/`
- `backend/app/schemas/`
- `backend/app/models/`
- `backend/app/services/`
- `backend/app/database/`
- backend API tests

## Person 3 — Frontend/UI/Animation Lead

```powershell
git switch feat/frontend-dashboard
git pull --ff-only
git status
```

Codex ထံသို့ အောက်ပါ message ကို အတိအကျ ပို့ပါ:

```text
Read and follow docs/prompts/PERSON_3_FRONTEND_DASHBOARD.md completely. Execute the assigned Person 3 work on the current feat/frontend-dashboard branch. Begin with sample-data/mock-full-analysis-response.json, keep authoritative mathematics in the backend, do not merge into main, and provide the required verification and handoff report when finished.
```

Person 3 သည် React/Vite/TypeScript UI, scenario form, payoff matrix, Nash/Pareto highlight, Prisoners Dilemma explanation, uncertainty comparison, arbitration result, repeated-game result, lightweight animation, responsive layout, accessibility/reduced motion, frontend tests နှင့် production build ကို တာဝန်ယူသည်။

ကိုယ်ပိုင်နေရာ: `frontend/` directory အားလုံး။

အစတွင် `sample-data/mock-full-analysis-response.json` ကို သုံးနိုင်သောကြောင့် Person 1/2 ကို မစောင့်ရပါ။ Frontend သည် backend result ကို display လုပ်ရမည်; authoritative mathematical answer ကို browser ထဲတွင် လွတ်လပ်စွာ မတွက်ရပါ။

## Person 4 — Integration, Testing, Documentation and Demo Lead

```powershell
git switch test/integration-demo
git pull --ff-only
git status
```

Codex ထံသို့ အောက်ပါ message ကို အတိအကျ ပို့ပါ:

```text
Read and follow docs/prompts/PERSON_4_INTEGRATION_DEMO.md completely. Execute the assigned Person 4 work on the current test/integration-demo branch. Begin integration planning, expected-result verification, documentation, setup checks, presentation, and demo preparation immediately. Do not rewrite another members owned code, do not merge into main yet, and provide the required verification and handoff report when finished.
```

Person 4 သည် integration checklist, expected-result verification, Windows setup/offline demo instruction, manual end-to-end test, presentation outline, 5–7 minute demo script, UI integrate ပြီးနောက် screenshots, troubleshooting, backup procedure, release checklist နှင့် team handoff tracking ကို တာဝန်ယူသည်။ လူအားလုံးပြီးမှ စရန် မဟုတ်ဘဲ အစကတည်းက စတင်ပါ။ Math, API, frontend owner ၏ code ကို ခွင့်ပြုချက်မရှိဘဲ မပြန်ရေးရပါ။

## နေ့စဉ် စတင်မည့် workflow

Session တိုင်း မစတင်ခင်:

```powershell
git switch <assigned-branch>
git fetch --prune origin
git pull --ff-only
git status
```

`<assigned-branch>` ကို ကိုယ့် branch name ဖြင့် အစားထိုးပါ။ Uncommitted change ရှိလျှင် အခြေအနေမသိဘဲ `git pull` မလုပ်ပါနှင့်။ Divergence/conflict ဖြစ်လျှင် အကူအညီတောင်းပါ။ အလွယ်ဖြေရှင်းနည်းအဖြစ် `git reset --hard` သို့မဟုတ် `git push --force` ကို ဘယ်တော့မှ မသုံးပါနှင့်။

## Commit နှင့် push workflow

Verification ပြီးနောက် detailed commit ကို Codex က အများအားဖြင့် ကူညီလုပ်ဆောင်မည်ဖြစ်သော်လည်း အစဉ်ကို သိထားပါ:

```powershell
git status
git diff --check
git add <owned-files>
git commit -m "<clear message>"
git push origin <assigned-branch>
```

အကြံပြု commit messages:

- Person 1: `feat(math): implement verified game theory engine`
- Person 2: `feat(api): add validated PowerShare analysis API`
- Person 3: `feat(ui): build PowerShare decision dashboard`
- Person 4: `test(demo): add integration and presentation workflow`

ကိုယ်ပိုင် files များသာ stage လုပ်ပြီး staged diff ကို review လုပ်ပါ။ `main` သို့ push/merge မလုပ်ပါနှင့်၊ force-push မလုပ်ပါနှင့်။ `.env`, `.venv`, `node_modules`, caches, local databases, build output များကို commit မလုပ်ရပါ။

## မဖြစ်မနေ ပေးရမည့် handoff report

Push ပြီးလျှင် integration owner (Person 4) ထံသို့ အောက်ပါ template ဖြင့် report ပို့ပါ:

```text
Role:
Branch:
Commit hash:
Push result:

Implemented:
- ...

Files changed:
- ...

Tests/checks run:
- ...

Expected results verified:
- ...

Known limitations:
- ...

Integration notes:
- ...

Git ahead/behind:
Worktree status:
```

ဤ report သည် integration owner အတွက် merge-ready ဖြစ်မဖြစ် စစ်ရန် အရေးကြီးသည်။

## အရေးကြီး demo results

| Result | Expected |
|---|---|
| Dominant strategy | `CLAIM_MORE` for both |
| Pure Nash equilibrium | `MM` |
| Pareto frontier | `CC`, `CM`, `MC` |
| Prisoners Dilemma | Detected |
| Nature recommendation | `HYBRID` for all six methods |
| Arbitration energy | `[5.5,4.5]` kWh |
| Arbitration hours | `[2,3]` |
| Arbitration cost shares | `[0.6,0.4]` |
| Arbitration product | `4771.071428571428` |

Full-precision verification အတွက် [EXPECTED_RESULTS.md](EXPECTED_RESULTS.md) ကို ကြည့်ပါ။

## Merge အကြောင်း

Member တစ်ယောက်ချင်းစီသည် ကိုယ့် branch ကိုသာ push လုပ်ရမည်; ကိုယ်တိုင် `main` သို့ merge မလုပ်ရပါ။ Integration owner က အောက်ပါအစဉ်ဖြင့် review/merge လုပ်မည်:

1. `feat/math-engine`
2. `feat/backend-api`
3. `feat/frontend-dashboard`
4. `test/integration-demo`

Merge တစ်ခုစီပြီးလျှင် tests များ run ရမည်။ Test fail ဖြစ်လျှင် နောက် branch ကို မ merge မလုပ်ဘဲ ရပ်ပြီး ပြင်ဆင်ရမည်။ အသေးစိတ်ကို [MERGE_RUNBOOK.md](MERGE_RUNBOOK.md) တွင် ကြည့်ပါ။

## အမှားများနှင့် troubleshooting

### Wrong branch

```powershell
git branch --show-current
```

Result သည် `main` ဖြစ်လျှင် implementation မစတင်ပါနှင့်။ ကိုယ့် assigned branch သို့ switch လုပ်ပါ။

### Branch မတွေ့လျှင်

```powershell
git fetch --prune origin
git switch <assigned-branch>
```

### Dirty worktree

```powershell
git status
```

Change များကို delete/reset မလုပ်ပါနှင့်။ ဘယ်သူပိုင်သလဲ သိအောင်စစ်ပြီး ဆက်မလုပ်မီ owner ကိုမေးပါ။

### Push rejected

```powershell
git fetch --prune origin
git status
```

Force-push မလုပ်ပါနှင့်။ Rejection output ကို Person 4/integration owner ထံ report လုပ်ပါ။

### Codex က အခြားသူပိုင် file ကို edit လုပ်လျှင်

ရပ်ပြီး `git diff` ကို review လုပ်ပါ။ Ownership မရှင်းမချင်း ထို files များကို commit မလုပ်ပါနှင့်။

### Dependencies သို့မဟုတ် project start မရလျှင်

အောက်ပါအချက်များကို record လုပ်ပြီး Person 4 ထံပို့ပါ: exact command, complete error, Python/Node version, current branch, last commit.

## Computer တစ်လုံးတည်း သုံးရလျှင်

ဖြစ်နိုင်လျှင် laptop သီးသန့် သို့မဟုတ် clone သီးသန့် သုံးပါ။ Dirty folder တစ်ခုထဲတွင် branch ကို ထပ်ခါထပ်ခါ switch မလုပ်ပါနှင့်။ Beginner များအတွက် separate directories ကို အကြံပြုသည်:

```text
PowerShareMM-Person1
PowerShareMM-Person2
PowerShareMM-Person3
PowerShareMM-Person4
```

ဤ documentation turn တွင် directories အသစ် မဖန်တီးပါ။ Git worktree ကို နားလည်ပြီးမှသာ သုံးပါ။

## နောက်ဆုံး reminder

Sunday 19:00 သည် feature freeze ဖြစ်သည်။ ထို့နောက် critical fixes, verification, documentation, backup သာလုပ်ပါ။ Monday demo သည် verified sample scenario ကို သုံးရမည်၊ dependencies/demo data ကို offline အတွက် ကြိုတင်ပြင်ဆင်ထားရမည်၊ လူတိုင်း clean pushed branch ထားရမည်။ Optional feature တစ်ခုကြောင့် MVP ကို မတားဆီးပါနှင့်။
