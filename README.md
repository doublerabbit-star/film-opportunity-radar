# Film Opportunity Radar

An AI-assisted tool that helps film creators discover content opportunities from industry events.

Instead of simply collecting movie news, Film Opportunity Radar identifies **events worth creating content about** and provides AI-generated content angles to help creators start faster.

> Current Status: MVP (In Development)

---

## Overview

Every day, the film industry produces a large amount of information:

- Trailer releases
- Festival awards
- Casting announcements
- Release date updates
- Director interviews
- Box office news

Finding valuable topics manually is time-consuming.

Film Opportunity Radar automatically collects these events, organizes them into a unified format, evaluates their content potential, and generates creator-friendly suggestions.

The current version is designed for personal use and small-scale testing.

---

## Core Features

- Collect film industry events
- Normalize data from multiple sources
- Enrich movie metadata
- Calculate Opportunity Score
- Generate AI-powered content ideas
- Save movies to a local Watchlist

---

## Tech Stack

| Layer | Technology |
| ------ | ---------- |
| Frontend | Next.js |
| UI | React + Tailwind CSS + shadcn/ui |
| Backend | Next.js Route Handlers |
| Database | Supabase (PostgreSQL) |
| AI | Gemini Flash |
| Movie Metadata | TMDb API |
| Deployment | Vercel |

---

## Project Structure

```text
film-opportunity-radar/

├── app/
├── components/
├── services/
├── lib/
├── types/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   └── DESIGN.md
│
├── README.md
└── AGENTS.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| docs/PRD.md | Product requirements |
| docs/ARCHITECTURE.md | Technical architecture |
| docs/DATA_MODEL.md | MVP data and pipeline contract |
| docs/DESIGN.md | Product design direction |
| AGENTS.md | AI development guidelines |

Please read these documents before implementing new features.

---

## Development Principles

This project follows several simple principles:

- Build the MVP first.
- Keep the architecture simple.
- Do not add features outside the PRD.
- AI assists content creation but does not make business decisions.
- Prefer readability over complexity.

---

## Project Status

Current Version:

**v0.1 (MVP)**

Current Goals:

- Build a usable MVP
- Validate the product idea
- Test with a small group of users
- Iterate quickly based on feedback

---

## Future Plans

Possible future improvements include:

- More event sources
- User accounts
- Cloud Watchlist
- Better opportunity ranking strategy

These features are intentionally excluded from the current MVP.

---

## License

This project is currently intended for personal learning and portfolio purposes.
