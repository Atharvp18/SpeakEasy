# SpeakEasy

I built SpeakEasy with four other people during **Rocket Launch**, a hackathon held as part of **LA Tech Week**.

## What it is

SpeakEasy is a web app for practicing public speaking in front of a virtual audience that reacts to you in real time. Rehearse a sales pitch, a job interview or a speech, and see whether the room is hooked, bored or on their phones.

## How it works

1. **Pick a scenario.** On the landing page, click **Practice** and choose what you're rehearsing:
   - **Sales pitch**: 1 buyer
   - **Interview**: a panel of 4
   - **Speech**: a full room of 16
2. **Tune the room.** The practice room has a settings bar for:
   - **Setting**: venue (classroom, boardroom, auditorium, office, café) and how formal the room is.
   - **Audience**: age range.
   - **Interaction**: how often people ask questions, and whether they're curious, friendly, skeptical or aggressive.
   - **Difficulty**: strictness and social pressure, from a friendly practice run to a hostile room.
3. **Start speaking.** Click **Start speaking** and talk. Your mic audio is transcribed live, and captions appear as you go.
4. **Watch the crowd react.** Every few seconds, the latest part of your talk is sent to Gemini, which role-plays each audience member. Each person gets an interest score from 1 to 10, and their seated avatar changes pose to match: listening, interested, bored, on their phone, or hand raised with a question. The ring in the header shows the room's average interest.
5. **Answer questions.** Audience members can ask questions based on what you actually said (at most two at a time). Click one to hear it read aloud in that character's own voice.

SpeakEasy also tracks your word count, pace (words per minute) and filler words ("um", "like", "you know"...) so you can see how you sounded as well as how the room felt.

## Tech

- [TanStack Start](https://tanstack.com/start), React and TypeScript
- Tailwind CSS and Radix UI components
- AI through the [Lovable AI Gateway](https://lovable.dev):
  - `/api/transcribe`: speech-to-text for live captions
  - `/api/speech`: Gemini scores the audience's interest and writes their questions
  - `/api/voice`: text-to-speech for audience questions

Prompts and API keys stay on the server. The browser only maps the interest scores to avatar poses.

## Running locally

You need Node.js and npm (or Bun), plus a `LOVABLE_API_KEY` environment variable for the AI features.

```sh
git clone https://github.com/Atharvp18/SpeakEasy.git
cd SpeakEasy
npm i
npm run dev
```

Other scripts: `npm run build`, `npm test`, `npm run lint`.

## Built with Lovable

This project started in [Lovable](https://lovable.dev).
