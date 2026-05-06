# POLYWORDS Brand Bible

## 📖 Overview

**POLYWORDS** is a vibrant, engaging mobile word-learning game where players explore a magical kingdom, master vocabulary through four interactive gameplay modes, compete in an arena, and nurture their memory through a crystal garden. The game celebrates language, wordplay, and the joy of discovery through Polly the Polymath—a witty, low-poly geometric parrot mascot.

---

## 🦜 Polly the Polymath: Character Guidelines

### Visual Identity

**Polly** is a **low-poly geometric parrot** with a whimsical, modern aesthetic. She serves as guide, cheerleader, and comic relief.

#### Design Specs

- **Base Shape**: Isometric parrot silhouette with clean geometric planes
- **Primary Color**: **Teal/Turquoise** (hex: `#00CED1` or `#00E5FF`)
- **Secondary Colors**: Character color never appears in UI — only in Polly herself
- **Style**: Minimalist, flat-shaded, with subtle gradients on wings
- **Size**: Scales responsively; never dominates screen
- **Animation**: Smooth, looping idle animations; responsive to interactions

#### 6 Key Poses

1. **Idle** — Gentle wing flutter, head tilt, looking around curiously
2. **Celebrating** — Wings spread wide, head up, spiraling upward
3. **Thinking** — Chin on wing, eye half-closed, contemplative
4. **Flying** — Soaring across screen with trail effect
5. **Encouraging** — Leaning forward, wing outstretched, thumbs-up equivalent
6. **Arena Mode** — Fierce, competitive stance; feathers ruffled

#### 🚫 **Strict Rules**

- **NO eyewear** (no monocles, glasses, or spectacles) — Polly relies on expression, not props
- **NO weapons or aggressive imagery** — Keep competitive arenas playful, not violent
- **Consistent personality** — Always witty, supportive, never condescending

### Personality & Voice

**Tone**: Witty, encouraging, relatable, occasionally punny

**Brand Catchphrases**:
- "Word Up!" — Celebration after correct answers
- "Are You Game?" — Challenge invitation
- "Squawk! That's a tricky one." — Supportive nudge on wrong answers
- "Let's talk wordplay!" — Transition into Polly's Discovery
- "PolyWords = many meanings, infinite possibilities" — Brand explainer

**Dialogue Style**:
- Puns on language, wordplay, bird references (feathers, squawk, perch, etc.)
- Supportive but never patronizing
- References to learning, memory, growth
- Playful banter during Arena matches

---

## 🎨 Visual Brand: Color Palette

### Primary Colors

| Color | Hex | Usage | Example |
|-------|-----|-------|---------|
| **Deep Indigo** | `#1A1040` | Primary background, navigation bar, cards | App background, bottom nav |
| **Gold Accent** | `#FFD700` | Highlights, rewards, call-to-action | Button backgrounds, streak indicators, rewards |
| **Purple** | `#8B5CF6` | Secondary highlights, glow effects, premium | Glassmorphism tint, Arena rank borders, premium features |

### Secondary Colors (by context)

#### Character Colors (NEVER in UI)

| Character Color | Hex | Usage |
|-----------------|-----|-------|
| **Teal (Polly)** | `#00CED1` | Polly sprite only |
| **Green** | `#22C55E` | Alternative pose colors (moss, nature) |
| **Orange** | `#FB923C` | Alternative pose colors (sunset, warmth) |
| **Brown** | `#92400E` | Alternative pose colors (earth, stability) |

#### Contextual Colors

| Context | Hex | Usage |
|---------|-----|-------|
| **Success** | `#10B981` | Correct answers, completion checkmarks |
| **Error** | `#EF4444` | Wrong answers, warnings, timers (low) |
| **Info** | `#0EA5E9` | Tips, hints, information panels |
| **Neutral** | `#6B7280` | Disabled states, secondary text |

### Accessibility

- **Contrast Ratio**: All text ≥ 4.5:1 (AA standard)
- **Colorblind Safe**: Avoid red-green-only distinction; use icons + color
- **Glow Effects**: Use purple subtly; don't overpower content

---

## 🎮 Gameplay Modes

### Mode 1: **Timed Challenge** ("Race the Clock")
- **Type**: Fill-in-the-blank with timer (30–60 seconds)
- **Mechanism**: Sentence appears, player types the missing word
- **Difficulty**: Easy → Hard (word length, obscurity increases)
- **Reward**: Crystals + XP (bonus for speed)
- **Duration**: 1–3 minutes per session

### Mode 2: **Multiple Choice** ("Pick the Right Path")
- **Type**: Definition + 4 word options
- **Mechanism**: Read definition, tap correct word
- **Difficulty**: Easy → Hard
- **Reward**: Crystals + XP
- **Progression**: Words unlock based on prior success
- **Duration**: 2–5 minutes per session

### Mode 3: **Guess the Word** ("Prove Your Knowledge")
- **Type**: Etymology/history → guess the word
- **Mechanism**: Polly tells word's origin or fun fact, player guesses
- **Difficulty**: Medium → Hard (longer stories, older words)
- **Reward**: Crystals + XP + etymology insights
- **Duration**: 2–5 minutes per session

### Mode 4: **Sound Alikes** ("Master the Sounds")
- **Type**: Homophones, homographs, near-rhymes
- **Mechanism**: Hear audio + definition, select correct spelling/word
- **Difficulty**: Medium → Hard
- **Reward**: Crystals + XP
- **Duration**: 2–5 minutes per session

### Cross-Cutting Features

#### Daily Challenge
- **1 challenge per day** (resets at midnight)
- **All 4 modes included** in randomized order
- **Bonus streak reward**: 3, 7, 14, 30-day streaks unlock cosmetics

#### Polly's Discovery (Bonus Rounds)
- **Etymology deep-dives**: "Did you know this word comes from..."
- **Slang spotlight**: Current pop culture slang + origin
- **Word families**: Related words branching from one root
- **Trigger**: After 3 correct answers in a session

#### Did You Know? (Micro-content)
- **30-second fun facts** between rounds (pauseable)
- **Topics**: Word origins, famous misquotes, language trivia
- **Tone**: Playful, surprising, shareable
- **Delivery**: Text + Polly illustration + optional audio

---

## 🗺️ Screen Architecture

### Tab Navigation (Bottom Bar)

The app uses a **5-tab bottom navigation** with dark indigo background and gold top border accent.

#### Tab 1: 🏡 **Polly's Perch** (Home)
- **Hero**: Large Polly illustration in idle pose
- **Content**:
  - Daily challenge button (big, gold)
  - Quick-start buttons for all 4 modes
  - Streak counter
  - XP progress bar
  - Motivational tagline (Polly-voiced)
- **Taglines (rotate)**:
  - "The more you play, the more you grow!"
  - "Ready to flex your vocab muscles?"
  - "Language isn't boring—it's an adventure!"
  - "Every word is a stepping stone."
  - "Your journey to fluency starts now."
  - "One word, infinite possibilities."
  - "Master words, master communication."
  - "Play, learn, conquer."
  - "Vocabulary is your superpower!"

#### Tab 2: 🗺️ **Adventure Map** (Mode Selection)
- **Design**: Fantasy map with 4 landmark icons
- **Landmarks** (clickable to enter modes):
  1. **⏰ Clock Tower** → Timed Challenge
  2. **🛤️ Crossroads** → Multiple Choice
  3. **📚 Scholar's Cave** → Guess the Word
  4. **🎵 Echo Canyon** → Sound Alikes
- **Visual**: Illustrated fantasy landscape (consistent color palette)
- **Meta**: Shows mode unlock progress, suggested next mode

#### Tab 3: ⚔️ **Colosseum** (Arena / PvP)
- **Overview**: 1v1 vocabulary duels against AI or players
- **Match Structure**: 5 rounds (all 4 modes + mixed round)
- **Scoring**: Accuracy + Speed + Streak multiplier
- **Ranking**: League tiers (Bronze → Silver → Gold → Purple → Diamond)
- **Energy**: 5 free matches/day (resets 6 AM)
- **Leaderboard**: Global + friends rankings
- **Rewards**: Ranked crystals, cosmetics, seasonal battle pass

#### Tab 4: 🌿 **Crystal Garden** (Memory Garden)
- **Concept**: Visual representation of word retention
- **Mechanic**: Each mastered word grows into a crystal/plant
- **Growth Stages**:
  1. **Unseen** — Dormant seed (gray)
  2. **Seed** — Word first seen (indigo sprout)
  3. **Sprout** — 1 correct answer (green shoot)
  4. **Budding** — 3+ correct answers (gold stem)
  5. **Blooming** — 7+ correct answers (purple flower)
  6. **Full Radiance** — 15+ correct answers (diamond crystal, glowing)
- **Interaction**: Tap crystal to see word stats (reviews, streak, last seen)
- **Decay Warning**: Words not reviewed in 7 days show "wilting" state → encourages review
- **Incentive**: Beautiful garden = motivation to maintain streaks
- **Optional**: Share garden snapshot to social media

#### Tab 5: 📖 **Scrapbook** (Profile / Adventure Journal)
- **Content**:
  - Player profile (username, avatar, level)
  - Lifetime stats (words mastered, total XP, achievements)
  - Achievement gallery (badges unlocked)
  - Cosmetics wardrobe (Polly outfit skins, crystal themes)
  - Settings + account management
- **Aesthetic**: Scrapbook-style layout with torn paper edges, stickers, annotations
- **Polly cameo**: In corner, commenting on milestones

---

## 💎 Crystal System

### Crystal Tiers

**By Rarity**:
1. **Common** (Purple glow) — Starting words, frequent drops
2. **Rare** (Gold glow) — Mid-tier words, less common
3. **Legendary** (Indigo glow) — Advanced words, rare drops

**By Stage** (see Crystal Garden above):
- Unseen → Seed → Sprout → Budding → Blooming → Full Radiance

### Reward Philosophy

- **No punishment for wrong answers** — Wrong answers don't break/damage crystals
- **Positive reinforcement** — Each correct answer strengthens the crystal
- **Decay, not deletion** — Unmaintained words gradually dim but don't disappear
- **Visual feedback** — Polly celebrates growth; encourages, never mocks mistakes

---

## 🎯 Onboarding Flow

1. **Splash Screen** — POLYWORDS logo + Polly waving
2. **Polly Introduction** — "Hi! I'm Polly, your vocab guide. Ready?"
3. **Mode Tutorial** — 30-second explainer for each mode (skippable)
4. **First Challenge** — Easy difficulty, Polly cheering
5. **Reward Celebration** — XP + crystal unlock + Polly happy dance
6. **Tab Navigation Tour** — Swipe through each tab
7. **Invitation to Daily Challenge** — Start streak

---

## 💰 Monetization Strategy

### Free Base Game ✅

- All 4 gameplay modes fully accessible
- No content gates
- Optional cosmetics only

### Rewarded Ads (Soft Currency)

- Optional video ads for bonus rewards:
  - **+50 XP** after completing a round
  - **+1 free Arena match** 
  - **Hint system** (reveal one letter in Timed Challenge)
- Player controls frequency (never forced)

### Cosmetic In-App Purchases

| Item | Price | Example |
|------|-------|---------|
| **Polly Outfit Skin** | $1.99 each | "Sunset Parrot," "Forest Guardian," "Cosmic Explorer" |
| **Crystal Theme Pack** | $2.99 | Different crystal colors/shapes for garden |
| **Garden Background** | $0.99 | Themed garden environments |

### Premium Subscription Options

#### POLYWORDS Pass (Monthly)
- **Price**: $4.99/month
- **Benefits**:
  - Unlimited Arena matches (vs. 5 free/day)
  - Ad-free experience
  - 2x XP on all rounds
  - Monthly cosmetic exclusive (Polly skin or garden theme)
  - Early access to new words/challenges
- **Auto-renew**: With free trial (first week free)

#### Seasonal Battle Pass (Quarterly)
- **Price**: $4.99/season
- **Duration**: 3 months
- **Benefits**:
  - 50+ exclusive cosmetics
  - Weekly bonus challenges (unique rewards)
  - Ranked season cosmetics (leaderboard-dependent)
  - Polly avatar frames
- **Free Track**: 15 items available without pass purchase

### No Dark Patterns ⚡

- **Explicit opt-in**: All ads/IAP clearly labeled
- **No artificial timers or energy gates** (except Arena's generous 5 daily matches)
- **Transparent pricing**: All costs visible upfront
- **Account portability**: Purchases tied to player account

---

## 📱 UI & Visual Language

### Design System

#### Typography

- **Font Family**: Clean, modern sans-serif (e.g., Inter, Roboto)
- **Headlines**: Bold, 20–28px, letter-spaced
- **Body**: Regular, 14–16px
- **Accent text**: Medium weight, 12px, all-caps for labels

#### Components

**Buttons**:
- **Primary**: Gold background (`#FFD700`), dark text, 12px border-radius
- **Secondary**: Transparent with purple border, white text
- **Disabled**: Gray background, 50% opacity

**Cards**:
- **Glassmorphism**: Slight blur, purple-tinted background, gold border accent
- **Shadows**: Subtle, dark indigo drop shadow
- **Spacing**: 16px padding, 12px border-radius

**Badges/Tags**:
- **Streak indicator**: Gold background with flame icon
- **Rank badge**: Tier color (bronze, silver, gold, purple, diamond)
- **Achievement**: Starburst background with icon

#### Ambient Effects

- **Floating particles**: Subtle sparkles, feathers, or mist (5–10% opacity)
- **Star field**: Background animation in deep indigo areas
- **Glow effects**: Purple halos on interactive elements (on hover/focus)
- **Transitions**: Smooth 300ms easing, no jarring cuts

### Accessibility

- **Font sizes**: ≥14px minimum for readability
- **Color contrast**: All text ≥ 4.5:1 ratio
- **Touch targets**: ≥44x44px for all buttons
- **Motion**: Respect `prefers-reduced-motion` setting
- **Screen reader**: Semantic HTML, ARIA labels where needed

---

## 📢 Marketing & Social

### Brand Voice (Social Media)

- **Tone**: Playful, encouraging, linguistically witty
- **Hashtags**: #PolyWords #VocabAdventure #WordUp #LexicalQuest
- **Call-to-action**: "Can you master the challenge? Play now!"
- **User-generated content**: Retweet player garden screenshots, Arena victories

### Content Pillars

1. **Etymology drops** — "Did you know..." facts (1–2x/week)
2. **Player spotlights** — Celebrate top leaderboard players (1x/week)
3. **Mode tutorials** — How to play each mode, tips & tricks (1x/month)
4. **Polly's personality** — Memes, comics, witty observations (2–3x/week)
5. **Game updates** — New word packs, seasons, features (as released)

---

## 🛠️ Technical Requirements

### Platform
- **iOS & Android** via React Native / Expo
- **Minimum OS**: iOS 12+, Android 7+
- **Target device**: Phones (6"–6.7" preferred)
- **Orientation**: Portrait primary, landscape supported

### Performance
- **Load time**: <2 seconds
- **Frame rate**: 60 FPS consistent
- **Memory**: <150MB footprint
- **Offline**: Core gameplay works offline; syncs when online

### Analytics
- **Track**: Mode completion rates, session length, word mastery progression
- **A/B test**: Button text, reward amounts, Daily Challenge frequency
- **Privacy**: GDPR/COPPA compliant; no sensitive user data collection

### Localization (Phase 2)
- **English**: v1.0 launch
- **Spanish, French, German, Japanese**: v1.5+

---

## 📋 Launch Checklist

- [ ] All 4 gameplay modes fully implemented & tested
- [ ] Polly character + 6 poses + animations complete
- [ ] Color palette applied consistently across UI
- [ ] Crystal Garden visuals & progression system live
- [ ] Arena matching & leaderboard functional
- [ ] Daily Challenge system live
- [ ] Ad system integrated (rewarded)
- [ ] Premium Pass + Battle Pass purchases tested
- [ ] Onboarding flow complete & tested with 5+ users
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] App Store & Play Store listings prepared
- [ ] Privacy policy & terms of service finalized
- [ ] Marketing assets & social previews ready
- [ ] Beta testing with 100+ external users complete
- [ ] Bug fixes & performance optimization done
- [ ] Launch day coordination (social, press, etc.)

---

## 📝 Brand Summary

**POLYWORDS** is where **learning meets adventure**. Through Polly's witty guidance, four engaging modes, competitive Arena play, and the meditative Crystal Garden, players grow their vocabulary while having genuine fun. The brand celebrates language as a superpower—accessible, joyful, and infinite.

**Your brand promise**: *Master words, master communication.*

---

**Version**: 1.0  
**Last Updated**: May 2026  
**Owner**: Peter DiBari (Psibari)
