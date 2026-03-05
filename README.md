# OurMeets - AI-Powered Video Conferencing

OurMeets is a modern, lightweight Minimum Viable Product (MVP) for an online video conferencing system. Built with Next.js, WebRTC, and Socket.io, it features real-time peer-to-peer audio and video communication. What sets OurMeets apart is its built-in **AI Meeting Minutes** capability—allowing users to record conversations, generate highly accurate transcripts, and summarize meeting action items automatically using state-of-the-art AI models.

## Features

- **Real-Time Video Conferencing**: Low-latency P2P video and audio communication powered by [PeerJS](https://peerjs.com/) and WebRTC.
- **Custom Signaling Server**: A dedicated standalone Node.js `socket.io` server for seamless peer discovery and connection negotiation.
- **AI Speech-to-Text (STT)**: One-click in-browser audio recording that automatically transcribes spoken words using **OpenAI Whisper** or **Google Gemini** models.
- **AI Meeting Summaries**: Intelligent summarization of the generated transcripts, extracting key points and action items using **OpenAI GPT-4o-mini** or **Google Gemini 2.5 Flash**.
- **Configurable AI Providers**: Easily switch between OpenAI and Gemini for both STT and LLM generation via environment variables.
- **Modern Premium UI**: A highly polished dark-mode interface built with Tailwind CSS, Lucide React icons, and Framer Motion animations.
- **Local Database**: Stores meeting history, transcripts, and summaries securely using Prisma ORM with SQLite (MVP).

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Node.js, Socket.io
- **Database**: Prisma ORM, SQLite
- **WebRTC**: PeerJS
- **AI Integrations**: `@google/generative-ai`, `openai`

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd OurMeets
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the example environment file and fill in your API keys.
   ```bash
   cp .env.example .env
   ```
   **`.env` Configuration:**
   - `DATABASE_URL="file:./dev.db"` (Default Prisma SQLite)
   - `NEXT_PUBLIC_BASE_URL="http://localhost:3000"`
   - `STT_PROVIDER="gemini"` (or `"openai"`)
   - `LLM_PROVIDER="gemini"` (or `"openai"`)
   - `OPENAI_API_KEY="your-openai-api-key"`
   - `GEMINI_API_KEY="your-google-gemini-api-key"`

4. Initialize the database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### Running the Application

This project requires both the Next.js frontend server and the standalone Socket.io signaling server to be running simultaneously.

1. **Start the Signaling Server**:
   Open a terminal and run the Socket.io server:
   ```bash
   node server.mjs
   ```
   The signaling server will start on `http://localhost:3001`.

2. **Start the Next.js Development Server**:
   Open a **second** terminal and run:
   ```bash
   npm run dev
   ```
   The Next.js application will be available at [http://localhost:3000](http://localhost:3000).

## Usage Guide

1. Navigate to `http://localhost:3000`.
2. Enter your display name and click **Create Meeting** (or enter an existing Room ID to join).
3. Allow camera and microphone permissions when prompted by your browser.
4. To start recording the conversation, click the **Record** (Disc) button in the bottom toolbar.
5. Once finished speaking, click **Stop Recording & Analyze**. 
6. Wait for the upload and AI processing to complete. Navigate to the **"AI Meeting Minutes"** tab on the right sidebar to view your transcript and AI-generated summary.

---
*Developed as an MVP demonstrating the integration of WebRTC and Generative AI within a modern React application ecosystem.*
