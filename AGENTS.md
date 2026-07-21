# AGENTS.md

## Project

Project Name: Film Opportunity Radar

This project is an AI-assisted tool for discovering film industry events that are worth creating content about.

The current version is an MVP intended for personal use and small-scale testing with friends.

---

# Before You Start

Before implementing any feature, read the following documents in order:

1. README.md
2. docs/PRD.md
3. docs/ARCHITECTURE.md
4. docs/DATA_MODEL.md
5. docs/DESIGN.md
6. docs/RSS.md
7. docs/DEEPSEEK.md
8. docs/GEMINI.md

These documents define the product scope and technical architecture.

---

# Primary Goal

Your goal is **not** to build a complete commercial product.

Your goal is to help build a stable MVP that can be tested quickly.

When in doubt, choose the simpler solution.

---

# Development Principles

Follow these principles at all times.

## Keep It Simple

Prefer simple implementations.

Avoid unnecessary abstraction.

Avoid premature optimization.

---

## Stay Within MVP Scope

Only implement features defined in PRD.

Do not add features on your own.

Examples of features that should NOT be added:

- Login
- User accounts
- Cloud sync
- Notifications
- Admin dashboard
- Payment
- Personalized recommendation system
- Mobile App

---

## Respect Module Responsibilities

Each module has a single responsibility.

For example:

- Collector fetches data.
- Parser normalizes data.
- Opportunity Engine calculates scores.
- AI Generator creates content suggestions.

Do not mix responsibilities between modules.

---

## AI Responsibilities

AI is allowed to:

- summarize content
- generate discussion angles
- generate titles
- generate creator suggestions

AI should NOT:

- calculate Opportunity Score
- implement business rules
- rank events
- make product decisions

Business logic must be implemented in code.

---

# Coding Rules

Use TypeScript.

Prefer functional components.

Keep functions small.

Avoid duplicated logic.

Prefer readable code over clever code.

Do not introduce unnecessary dependencies.

---

# File Organization

Follow the project structure defined in Architecture.md.

Do not create new top-level folders unless necessary.

---

# Making Changes

Focus on one task at a time.

Avoid unrelated refactoring.

Avoid changing files that are unrelated to the current request.

---

# If Requirements Are Unclear

Do not guess.

Choose the simplest implementation that matches the PRD.

If multiple reasonable solutions exist, briefly explain the trade-offs.

---

# After Completing a Task

Always provide a short summary including:

- Files modified
- What was implemented
- Any assumptions made
- Anything still incomplete

---

# Communication Style

Keep responses concise.

Avoid unnecessary explanations.

Prioritize implementation over theory.
