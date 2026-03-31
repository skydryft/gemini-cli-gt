---
name: debugging-methodology
description: Structured debugging approach that prevents infinite reasoning loops and thought spiraling. Use when diagnosing errors, test failures, or unexpected behavior.
---

# Debugging Methodology

Systematic approach to prevent analysis paralysis and reasoning loops during debugging.

## The Rule: One Hypothesis, One Test

Never reason about multiple hypotheses simultaneously. Follow this sequence strictly:

1. **Read the error** - Read the full error message, stack trace, or test output. Do not summarize or paraphrase.
2. **Identify the file** - Determine which file contains the error. Use the stack trace or error location.
3. **Read the file** - Read the relevant section of the file. Use line numbers from the error.
4. **Form ONE hypothesis** - State a single, specific hypothesis about the root cause.
5. **Make ONE edit** - Apply the minimal fix for your hypothesis.
6. **Test** - Run the test or command that produced the error.
7. **Evaluate** - If fixed, done. If not, go to step 4 with a NEW hypothesis. Do not revisit old hypotheses.

## Anti-Patterns to Avoid

- **Reasoning spirals**: Do not write "Wait...", "Actually...", "Let me reconsider..." — commit to your hypothesis and test it.
- **Multiple hypotheses**: Do not list 3-5 possible causes and reason about each. Pick the most likely one and test it.
- **Speculative fixes**: Do not make changes based on what "might" be wrong. Read the code first.
- **Over-reading**: Do not read every file in the project. Read only what the error points to.
- **Re-reading**: Do not re-read files you already read in this session unless they changed.

## When Stuck After 3 Attempts

If three hypotheses have failed:
1. Re-read the FULL error output (not a summary)
2. Search for the error message in the codebase
3. Check if the issue is environmental (dependencies, config, permissions)
4. Ask the user for additional context
