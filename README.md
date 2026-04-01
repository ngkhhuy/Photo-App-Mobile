# Photo-app Mobile

A React Native & Expo mobile application for photo sharing with user authentication, photo upload, browsing, search, chat, and user profiles.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Backend](#api-backend)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- User Authentication (Sign up, Login)
- Photo Upload with descriptions and keywords
- Home feed to browse recent photos
- Search photos by keyword
- Photo detail view with shared-element transition
- Real-time Chat powered by Socket.IO
- User Profiles and Edit Profile screen

## Tech Stack

- **Framework:** React Native with TypeScript
- **Expo SDK:** Expo managed workflow
- **Navigation:** React Navigation (bottom tabs & native stack)
- **Networking:** Axios for HTTP requests
- **Real-time:** socket.io-client for chat
- **Storage:** @react-native-async-storage/async-storage
- **Mock Server:** json-server (db.json)
- **Testing:** Jest & jest-expo

## Prerequisites

- Node.js >= 14
- npm (or yarn)
- Expo CLI (`npm install -g expo-cli`)

## Installation

1. Clone the repo:
    ```bash
    git clone <repo-url>
    cd ProjectMobile
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. (Optional) Run mock JSON server:
    ```bash
    npm install -g json-server
    json-server --watch db.json --port 3001
    ```
4. Configure API URL in `constants/config.ts` (default: `http://192.168.101.237:3000`).
5. Start the app:
    ```bash
    npm start
    ```
6. In the Expo CLI, select an Android emulator, iOS simulator, or Expo Go on your device.

## Environment Variables

- The base API URL is set in `constants/config.ts` as `API_URL`.
- No additional `.env` setup is required.

## Available Scripts

- `npm start` — Launch Expo development server
- `npm run android` — Open Android emulator
- `npm run ios` — Open iOS simulator
- `npm run web` — Run on web browser
- `npm run reset-project` — Reset starter code (moves to app-example)
- `npm test` — Run Jest tests
- `npm run lint` — Run ESLint checks

## Project Structure

```
ProjectMobile/
├── App.tsx              # Entry point
├── app.json             # Expo configuration
├── db.json              # Mock data for json-server
├── package.json         # Project metadata & scripts
├── tsconfig.json        # TypeScript configuration
├── assets/              # Images & fonts
├── components/          # Reusable UI components
├── constants/           # Configuration constants
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── navigation/          # React Navigation setup
├── screens/             # App screens (Login, Signup, Home, Upload, Profile, Search, Chat, etc.)
├── services/            # API & socket services
├── utils/               # Helper functions
└── scripts/             # Utility scripts (e.g., reset-project)
```

## API Backend

This app communicates with a RESTful API:

- **Base URL:** `http://192.168.101.237:3000` (see `constants/config.ts`)
- **Authentication:** Token-based; include `Authorization: Bearer <token>` header
- **Endpoints:** `/auth`, `/users`, `/photos`, `/search`, `/chat`, etc.

## Contributing

We follow Git Flow for collaboration:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/<name>`
3. Commit changes and push: `git push origin feature/<name>`
4. Submit a pull request against `develop`

Branch naming conventions:
- `feature/…` for new features
- `release/…` for version preparation
- `hotfix/…` for urgent production fixes
- 
## 📱 DEMO

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/5daa2b35-1a3b-4d37-935a-f512a0f36851" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/7922c4e4-15a5-4410-94ee-b5d66dfbc404" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/20fe42ac-ffb1-48d3-b66e-2148560662ac" width="250"/></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/d9584094-b630-4d6c-8c1f-4dc5985f5957" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/7482df45-25c1-4c99-b9df-893fe758f065" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/b553fbd9-5410-4b7a-8340-9dd44469b6e6" width="250"/></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/0ee25a3e-ef61-4391-b86e-ec14888f4cdc" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/7368ec3f-03c7-407d-a3f1-68b5d993073d" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/db7d6abf-c6c9-4670-bf2d-686067005631" width="250"/></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/100a1ffc-71ca-45ed-96f0-072dc63fd3a5" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/14d0f9c9-f045-4361-8997-a1f52c8aef22" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/e3997567-2cd5-437e-86fd-2e8369f7f39a" width="250"/></td>
  </tr>
</table>


## Contact
DEMO
Maintainer: huynguyen.career@gmail.com
