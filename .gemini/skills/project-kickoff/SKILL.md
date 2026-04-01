---
name: project-kickoff
description:
  Activate this skill when the user asks to start a new project, kick off
  development, get started, build something from scratch, or when the workspace
  has no existing application code and the user provides a project description
  or references a context file like GEMINI.md. Trigger phrases include
  "get started", "kick off", "new project", "let's build", "from scratch",
  "project kickoff", "set up the project", "bootstrap", "initialize".
---

# `project-kickoff` skill instructions

You are initiating a new project from scratch. The workspace has no existing
application code — do NOT spend time exploring the filesystem for code that
does not exist. Follow this workflow precisely.

## Phase 1: Gather Context (1-2 tool calls max)

1. **Read the context file.** Read `GEMINI.md` (or `.GEMINI.md`, `AGENTS.md`)
   in the workspace root. This is your primary source of truth for what the
   user wants to build.
2. **Quick scan only.** Run a single `glob` for `**/*` with a shallow depth
   or `ls` the root directory. The purpose is ONLY to confirm what already
   exists (likely nothing beyond config files). Do NOT recursively explore
   subdirectories, node_modules, or build artifacts. If there is no `src/`
   or application code directory, you are in a greenfield scenario — proceed
   immediately to Phase 2.

**STOP exploring after this phase.** Do not read package.json files, config
files, or any other files unless they are explicitly referenced in the context
file. You are building from scratch — there is nothing to map.

## Phase 2: Enter Plan Mode

1. **Use the `enter_plan_mode` tool immediately.** Do not write any code or
   create any files before entering plan mode.
2. In plan mode, draft a comprehensive project plan that includes:
   - **Project summary:** One paragraph restating what the user wants to build
     in your own words, confirming your understanding.
   - **Tech stack recommendation:** If not specified in the context file, ask
     the user. If specified, confirm it.
   - **Architecture overview:** High-level components, data flow, and key
     design decisions.
   - **Directory structure:** Proposed project layout.
   - **Implementation phases:** Break the work into ordered phases, each with
     clear deliverables. Phase 1 should be a minimal working skeleton.
   - **Testing strategy:** How you will verify each phase works.

## Phase 3: Present and Wait

1. **Present the plan to the user.** Share it clearly and ask for approval
   or feedback.
2. **Do NOT proceed until the user explicitly approves.** If they have
   feedback, revise the plan and present again.
3. Once approved, exit plan mode and begin execution following the standard
   development lifecycle.

## Phase 4: Execute

1. **Scaffold first.** Set up the project structure, install dependencies,
   and create the minimal skeleton.
2. **Build incrementally.** Implement one phase at a time. After each phase,
   verify it works (build, lint, test).
3. **Report progress.** After completing each phase, briefly summarize what
   was done and what comes next.

## Critical Rules

- **Never explore an empty workspace for more than 30 seconds.** If you find
  yourself reading file after file looking for application code that does not
  exist, STOP and enter plan mode.
- **Never start writing application code without an approved plan.**
- **Never assume a tech stack.** If the context file does not specify one,
  ask the user.
- **Treat the context file as the requirements document.** Everything you
  need to know about what to build is there.
- **Ask clarifying questions early.** It is better to ask 2-3 targeted
  questions upfront than to build the wrong thing.
