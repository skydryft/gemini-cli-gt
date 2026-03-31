---
name: project-onboarding
description: Systematic codebase exploration for unfamiliar projects. Use when first encountering a project or exploring a new area of the codebase.
---

# Project Onboarding

Structured approach to understanding a new codebase efficiently.

## Exploration Sequence

1. **Context files first** - Read GEMINI.md, AGENTS.md, README.md, CONTRIBUTING.md in the project root.
2. **Project structure** - Use glob to map the directory layout. Identify: source directories, test directories, config files, build files.
3. **Tech stack** - Read package.json, Cargo.toml, requirements.txt, go.mod, or equivalent. Identify: language, framework, dependencies, scripts.
4. **Entry points** - Identify main entry points (main.ts, index.ts, app.py, main.go). Read them to understand the application flow.
5. **Tests** - Find existing tests to understand expected behavior before modifying code.
6. **CI/CD** - Check .github/workflows, .gitlab-ci.yml, Makefile for build and deployment pipeline.

## Efficiency Rules

- Use grep and glob to discover structure. Do NOT read files sequentially.
- Parallelize independent reads (e.g., package.json and README.md at the same time).
- For large codebases, focus on the area relevant to the current task after getting the high-level picture.
- Summarize findings concisely before proceeding to implementation.

## What to Report

After onboarding, you should know:
- Language, framework, and key dependencies
- Directory structure and organization pattern
- How to build, test, and lint the project
- Key architectural patterns (monorepo, microservices, MVC, etc.)
- Where the relevant code lives for the current task
