---
name: framework-docs
description: Guides retrieval of live documentation for frameworks and SDKs. Use when working with APIs or frameworks that may have changed since training data cutoff.
---

# Framework Documentation Retrieval

Your training data has a knowledge cutoff. Framework APIs, SDK methods, and best practices change frequently. Always verify against live sources.

## When to Retrieve Documentation

- Working with any framework API you are not 100% certain about
- The user references a specific version or recent feature
- You encounter an error that suggests an API has changed
- You are about to recommend a deprecated pattern

## Retrieval Strategy

1. **Check project context first** - GEMINI.md, AGENTS.md, or docs/ may contain framework-specific instructions.
2. **Check project dependencies** - Read package.json, requirements.txt, etc. to identify exact framework versions.
3. **Use web_fetch or web_search** if available to retrieve current documentation.
4. **Check local docs** - Some projects vendor documentation in docs/ or .docs/ directories.

## Critical Rule

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning. When documentation context is available, use it rather than your pre-trained knowledge. If you are unsure about an API signature, method name, or configuration option — look it up, do not guess.

## Common Pitfalls

- Generating code with deprecated API methods
- Using old configuration syntax that no longer works
- Recommending patterns that have been replaced by better alternatives
- Assuming method signatures that changed between versions
