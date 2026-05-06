# POLYWORDS Implementation Checklist
**Tracking Brand Bible Specs vs. Code Implementation**

**Last Updated:** May 6, 2026

---

## 🎮 Gameplay Modes

### Required Modes (Brand Bible)

| Mode | Status | File | Notes |
|------|--------|------|-------|
| **Timed Challenge** | ❌ NOT FOUND | `clock-tower.tsx` (missing) | "Race the Clock" — fill-in-the-blank with timer |
| **Multiple Choice** | ✅ EXISTS | `app/multiple-choice.tsx` | "Pick the Right Path" — 4-option selection |
| **Guess the Word** | ✅ EXISTS | `app/guess-the-word.tsx` | "Prove Your Knowledge" — definition→word |
| **Sound Alikes** | ❌ NOT FOUND | `echo-canyon.tsx` (missing) | "Master the Sounds" — homophones |

### Cross-Cutting Features

| Feature | Status | File | Notes |
|---------|--------|------|-------|
| **Daily Challenge** | ❓ UNCLEAR | `app/index.tsx`? | One challenge/day with streak |
| **Polly's Discovery** | ❌ NOT FOUND | (missing) | Etymology/slang bonus rounds |
| **Did You Know?** | ❌ NOT FOUND | (missing) | Fun language facts between rounds |

---

## 🏠 Screens & Navigation

### Expected Screens (Brand Bible)

| Screen | Location | Status | File | Notes |
|--------|----------|--------|------|-------|
| **Polly's Perch** (Home) | Tab 1 🏡 | ✅ LIKELY EXISTS | `app/(tabs)/index.tsx` | Home base, daily challenge, Polly greets |
| **Adventure Map** | Tab 2 🗺️ | ❓ UNCLEAR | (unknown) | Mode selection/exploration |
| **Clock Tower** | Navigated to | ❌ MISSING | (missing) | Timed Challenge mode |
| **Crossroads** | Navigated to | ✅ EXISTS | `app/multiple-choice.tsx` | Multiple Choice mode |
| **Scholar's Cave** | Navigated to | ✅ EXISTS | `app/guess-the-word.tsx` | Guess the Word mode |
| **Echo Canyon** | Navigated to | ❌ MISSING | (missing) | Sound Alikes mode |
| **Colosseum** | Tab 3 ⚔️ | ✅ EXISTS | `app/(tabs)/arena.tsx` | Arena/PvP (NOT in brand bible!) |
| **Crystal Garden** | Tab 4 🌿 | ✅ EXISTS | `app/(tabs)/garden.tsx` | Memory Garden (status unclear) |
| **Scrapbook** | Tab 5 📖 | ✅ EXISTS | `app/(tabs)/profile.tsx`? | Polly's adventure journal |

### Unplanned/Unclear Features

| Feature | Status | File | Question |
|---------|--------|------|----------|
| **Arena** | ✅ IN CODE | `app/(tabs)/arena.tsx` | Is this v2.0 feature or should it be removed? |
| **Forge** | ✅ IN CODE | `app/(tabs)/forge.tsx` | What is "Forge"? Not in brand bible. |
| **Rankings** | ✅ IN CODE | `app/(tabs)/rankings.tsx` | Leaderboards — fine, but not explicitly in brand bible. |
| **Mastery Card** | ✅ IN CODE | `app/mastery-card.tsx` | Purpose unclear — crystal display? |
| **Lexicon** | ✅ IN CODE | `app/lexicon.tsx` | Is this "Scrapbook" or separate? |

---

## 🎨 Visual & Brand

### Polly the Parrot

| Element | Status | File | Notes |
|---------|--------|------|-------|
| **Character Design** | ✅ DEFINED | `constants/polly.ts` | Colors, poses, expressions spec'd |
| **6 Key Poses** | ❓ PARTIALLY | Code? | Idle, celebrating, thinking, flying, encouraging, arena |
| **No Eyewear Rule** | ⚠️ CHECK | Code assets | VERIFY Polly never has glasses/monocle |
| **Brand Colors Used** | ✅ UPDATED | `constants/polly.ts` | POLYWORDS (not POLYPLEX) ✓ |

### Color Palette

| Color | Status | Usage | Notes |
|--------|--------|-------|-------|
| **Deep Indigo** (`#1A1040`) | ✅ DEFINED | Backgrounds, overall | Primary brand color |
| **Gold** (`#FFD700`) | ✅ DEFINED | Accents, rewards | Secondary brand color |
| **Purple** (`#8B5CF6`) | ✅ DEFINED | Highlights, glow | Tertiary brand color |
| **Character Colors** | ✅ DEFINED | Polly ONLY | Green, orange, brown (never UI) |

### UI Components

| Component | Status | File | Notes |
|-----------|--------|------|-------|
| **Glassmorphism Cards** | ❓ UNCLEAR | App styles | Purple tint, blur, gold border accent |
| **Bottom Navigation** | ✅ EXISTS | `app/(tabs)/_layout.tsx` | Dark indigo background, gold top border |
| **Buttons** | ❓ UNCLEAR | Component? | Gold background, dark text, 12px radius |
| **Ambient Effects** | ❓ UNCLEAR | Screens? | Floating particles, stars, mist, vines, feathers |

---

## 💎 Crystal System

| Feature | Status | File | Notes |
|---------|--------|------|-------|
| **Crystal Tiers** | ✅ PLANNED | Code? | Common (purple), Rare (gold), Legendary (indigo) |
| **Growth Stages** | ✅ PLANNED | Code? | Unseen → Seed → Sprout → Budding → Full → Radiant |
| **Memory Garden** | ✅ EXISTS | `app/(tabs)/garden.tsx` | Visual implementation unclear |
| **No Punishment Rule** | ⚠️ CHECK | Logic | Wrong answers don't break crystals |

---

## ⚔️ Arena System

| Feature | Status | File | Notes |
|---------|--------|------|-------|
| **Arena Implementation** | ✅ EXISTS | `app/(tabs)/arena.tsx` (26KB) | **NOT explicitly in brand bible** — verify if v1.0 or v2.0 |
| **Match Structure** | ⚠️ CHECK | Code | Should be 5 rounds (all 4 modes + mixed) |
| **Scoring System** | ⚠️ CHECK | Code | Accuracy + Speed + Streak |
| **League System** | ⚠️ CHECK | Code | 5 tiers: Bronze, Silver, Gold, Purple, Diamond |
| **Energy System** | ⚠️ CHECK | Code | 5 free matches/day |

---

## 💰 Monetization

| Pillar | Status | Implementation | Notes |
|--------|--------|-----------------|-------|
| **Free Base Game** | ✅ PLANNED | All 4 modes free | No content gates |
| **Rewarded Ads** | ❌ NOT FOUND | (missing) | Optional video ads for bonuses |
| **Cosmetic IAP** | ❓ UNCLEAR | Code? | Polly outfits, crystal skins, garden themes |
| **POLYWORDS Pass** | ❌ NOT FOUND | (missing) | $4.99/mo — unlimited Arena + ad-free |
| **Season Battle Pass** | ❌ NOT FOUND | (missing) | $4.99/season — exclusive rewards |

---

## 🔤 Branding & Copy

| Element | Status | File | Notes |
|---------|--------|------|-------|
| **Catchphrase: "Word Up!"** | ❓ UNCLEAR | Strings? | Used for celebrations |
| **Challenge: "Are You Game?"** | ❓ UNCLEAR | Strings? | Challenge screens, notifications |
| **PolyWords Term** | ❓ UNCLEAR | Strings? | Branded term for multi-meaning words |
| **Screen Taglines** | ❓ UNCLEAR | Strings? | 9 taglines per brand bible |

---

## ⚠️ Issues & Action Items

### 🔴 CRITICAL — Missing Implementations

- [ ] **Timed Challenge mode** — MUST CREATE `clock-tower.tsx` or equivalent
- [ ] **Sound Alikes mode** — MUST CREATE `echo-canyon.tsx` or equivalent
- [ ] **Polly's Discovery** — Etymology/slang bonus rounds system
- [ ] **Did You Know?** — Fun facts between rounds system
- [ ] **Rewarded Ads** — Ad system integration
- [ ] **Monetization UI** — Pass/Battle Pass purchase flows

### 🟡 UNCLEAR — Need Clarification

- [ ] **Arena Status** — Is Arena v1.0 live feature or planned for v2.0?
- [ ] **Garden Status** — Is Memory Garden fully implemented per spec?
- [ ] **Forge Purpose** — What does "Forge" do? Remove or document?
- [ ] **Lexicon vs. Scrapbook** — Are these the same screen?
- [ ] **Mastery Card** — What is this component for?
- [ ] **Daily Challenge** — Where is implementation?

### 🟢 VERIFIED ✅

- [x] POLYWORDS branding (not POLYPLEX)
- [x] Polly character specs updated in code
- [x] Multiple Choice mode exists
- [x] Guess the Word mode exists
- [x] Bottom navigation structure

---

## 📋 Next Steps

1. **Implement missing modes:** Timed Challenge + Sound Alikes
2. **Clarify Arena:** Include in v1.0, defer to v2.0, or remove?
3. **Clarify Garden:** Is it fully spec'd and implemented?
4. **Remove dead code:** Delete Forge if not needed, consolidate Lexicon/Scrapbook
5. **Build monetization:** Ad system + Pass flows
6. **Add cross-cutting features:** Daily Challenge, Polly's Discovery, Did You Know?
7. **Polish Polly:** Ensure all 6 poses, ambient animations, no eyewear
8. **Verify colors:** Check all UI elements use only 3-color palette
9. **Add copy:** Implement all taglines, catchphrases, challenge text

---

**Version:** 1.0  
**Last Updated:** May 6, 2026  
**Owner:** Copilot (on behalf of Peter DiBari)
