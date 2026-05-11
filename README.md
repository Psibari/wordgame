
🌟 POLY WORDS
A fast, clever, beautifully simple word‑mastery game starring Polly the Parrot.
<div align="center">

https://img.shields.io/badge/React_Native-0.74-blue  
https://img.shields.io/badge/Expo-51.0-black  
https://img.shields.io/badge/TypeScript-5.0-blue  
https://img.shields.io/badge/Platform-iOS_/_Android-green  
https://img.shields.io/badge/Status-In_Development-yellow

</div>

🦜 What Is POLY WORDS?
POLY WORDS is a vocabulary‑adventure game built around polysemy — words with multiple meanings.
Players explore, guess, collect, and master words across difficulty tiers, guided by Polly, the game’s smartass‑but‑welcoming parrot mascot.

The game is built with:

React Native + Expo

TypeScript

Expo Router

Modern component architecture

A curated 739‑word dataset

🎮 Core Screens
▶️ Play
The main gameplay loop — fast, clean, and replayable.

📚 Library
Browse the full word database, view meanings, examples, and track mastery.

🦜 Polly
Your companion, guide, and occasional roaster.
Polly reacts to progress, gives hints, and adds personality to the experience.

📁 Project Structure
Code
/
├── app/
│   ├── play/
│   ├── library/
│   ├── polly/
│   └── _layout.tsx
│
├── components/
│   ├── ui/
│   ├── game/
│   └── shared/
│
├── data/
│   └── polywords.json   ← full 739‑word dataset
│
├── assets/
│   ├── images/
│   ├── fonts/
│   └── audio/
│
├── hooks/
├── utils/
├── constants/
└── README.md
🧠 Word Dataset
The /data/polywords.json file contains:

Word type (Double / Triple / Quadruple)

2–4 meanings

Example sentences

Theme

Difficulty rating

This dataset powers Play, Library, and future modes.

🚀 Getting Started
Install
bash
npm install
Run
bash
npx expo start
Build (Expo)
bash
npx expo prebuild
🛠 Tech Stack
React Native

Expo

TypeScript

Expo Router

Zustand (state management)

Reanimated (animations)

AsyncStorage (planned)

🎨 Branding
POLY WORDS uses a clean, modern visual identity:

Primary Palette:

Deep Indigo (#1A1040)

Gold (#FFD700)

Purple Glow (#8B5CF6)

Mascot: Polly the Parrot

Green body

Orange curved beak

Explorer hat

Taglines:

Words Have Meaning…’s

How many can you master

Are You Game

🗺️ Roadmap
Library MVP

Animated Polly reactions

Sound design pass

Daily challenges

Word mastery progression

Achievements

Expanded word packs

🤝 Contributing
Pull requests are welcome — especially:

UI improvements

Word dataset expansions

Performance optimizations

Accessibility enhancements

📄 License
MIT License.

👤 Author
Pete DiBari  
GitHub: Psibari
