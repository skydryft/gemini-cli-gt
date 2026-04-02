# Gemini CLI GT

A customized fork of Google's
[Gemini CLI](https://github.com/google-gemini/gemini-cli) focused on improving
model performance and efficiency through prompt engineering and tool
architecture changes.

## Why This Fork Exists

Google's Gemini CLI ships with 25+ built-in tools (glob, grep, read_file, edit,
write_file, etc.) that the model must select from on every turn. The core
problem: Gemini models aren't trained on their own tool-use API. Every session,
the model learns about tools in real-time from function declarations injected
into the system prompt. Without reinforcement training on tool selection, this
leads to:

- Tool selection fumbling and wasted reasoning tokens
- Failed tool calls from misformatted parameters
- Thought spiraling when the model gets stuck between tool options
- Significantly higher token usage compared to simpler approaches

This fork addresses these issues from the CLI side — changing how tools are
presented, how the system prompt coaches the model, and how context is managed.

## Key Changes

### Shell-Only Mode (`v0.1.0-shell-only`)

The flagship change. Strips the tool set from 25+ down to 4 essential tools and
rewrites system prompt coaching to guide the model toward bash commands instead
of specialized tools.

**What it does:**

- Configurable via `tools.core` in settings.json — no code changes needed to
  toggle
- System prompt auto-detects the reduced tool set and swaps "Tool Routing Rules"
  (which discourages shell use) for a "Shell Playbook" (which coaches effective
  bash patterns)
- Default behavior (all tools) is completely unchanged

**Recommended config:**

```json
{
  "tools": {
    "core": ["run_shell_command", "ask_user", "update_topic", "save_memory"]
  }
}
```

**Results:** Testing with gemini-3-flash-preview shows a greenfield project
kickoff completing in under 5 minutes with 75-80% cache hit rate. Context file
length is critical — keeping GEMINI.md under ~55 lines measurably impacts
response latency. No tool selection fumbling, no spiraling.

### UX Polish

- **Visual text differentiation** — collaborative persona tone in responses
- **Response duration** — inline token usage annotations show elapsed time
- **Copy-paste friendly output** — conversation feed formatting improvements
- **Session token breakdown** — input/output token counts in footer

### Other Improvements

See `docs/research/` for the full set of findings driving changes:

- **Compression threshold tuning** — adjusting context window management to
  reduce task time
- **Enhanced loop detection** — catching word salad and thought spiraling
  patterns
- **Static context support** — AGENTS.md for reliable skill injection vs
  on-demand discovery
- **Task tracker path** — relocated to `.gemini/tracker/tasks/` for consistency

## Project Structure

TypeScript monorepo using npm workspaces:

```
packages/
  cli/        Terminal UI (React + Ink)
  core/       API orchestration, prompt construction, tool execution
  sdk/        Programmatic embedding SDK
  devtools/   Network/console inspector
  a2a-server/ Agent-to-Agent server (experimental)
  test-utils/ Shared test utilities
```

## Building

```bash
npm install
npm run build        # Build packages
npm run start        # Run in development mode
npm run test         # Unit tests
npm run preflight    # Full validation (build + lint + typecheck + tests)
```

## Relationship to Upstream

This is a soft fork — changes are additive and focused on the prompt/tool layer.
The core CLI architecture, tool implementations, and API integration are
unchanged from upstream. Periodic syncs with
[google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) are
expected.

## Documentation

- `docs/research/gemini-cli/` — Research findings driving improvements
- `docs/session_notes/` — Working session summaries
- `GEMINI.md` — Project context for AI-assisted development

## License

Apache License 2.0 (inherited from upstream)
