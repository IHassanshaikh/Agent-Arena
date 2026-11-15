# AgentArena: Security, Privacy & Redaction Policy

Traces capture agent interactions, arguments, and environment responses which may contain sensitive credentials, tokens, or proprietary source code. AgentArena implements strict defense-in-depth controls.

## 1. Multi-Stage Redaction Engine

### Client-Side Pre-Pass (SDK Level)
Before payloads leave the agent runner, `TraceEmitter` scrubs arguments matching credential patterns.

### Server-Side Deep Recursive Redaction
All incoming payloads undergo recursive redaction before persistence:
- **Sensitive Key Match**: Keys containing `api_key`, `token`, `password`, `secret`, `authorization`, `cookie`, `private_key` are replaced with `[REDACTED:CREDENTIAL]`.
- **Pattern Matching (Regex)**:
  - Bearer tokens (`bearer\s+[a-zA-Z0-9_\-\.=:_+/]+`)
  - OpenAI API Keys (`sk-[a-zA-Z0-9]{20,}`)
  - Anthropic API Keys (`sk-ant-[a-zA-Z0-9_\-]{20,}`)
  - Google Gemini Keys (`AIza[0-9A-Za-z\-_]{35}`)
  - GitHub Personal Access Tokens (`ghp_[0-9a-zA-Z]{36}`)
  - JWT Tokens (`eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`)
  - Private Keys (`-----BEGIN RSA/EC PRIVATE KEY-----`)

## 2. Chain-of-Thought Boundary
AgentArena explicitly does not record or scrape internal hidden chain-of-thought. Instead, agents emit structured `decision.summary` rationales indicating action chosen and factual rationale suitable for public inspection.

## 3. Read-Only Dashboard & Anti-Execution
Captured tool outputs in traces are displayed purely as text/JSON. The trace viewer never executes scripts, shell commands, or HTML from trace content.

## 4. Tenant & Run Isolation
All queries and Socket.IO room joins validate run ownership and authorized room boundaries (`run:${run_id}`).

