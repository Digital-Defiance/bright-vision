# Local LLM setup (recommended)

Aider Vision is **privacy-first**: the default path is a **local** model on your machine via [Ollama](https://ollama.com/), not rented cloud inference.

## Built into the desktop app (first-class)

The Tauri app embeds the **plain** [local-llm](https://github.com/Digital-Defiance/local-llm) profile — no Qdrant, no Docker:

- **Terminal → Local LLM** — Start / Unload / **Ping LLM** / status (Ollama up, pull, preload)
- **Ollama models** — on **Refresh**, lists `/api/tags` (pulled) and `/api/ps` (loaded in RAM) as readable text; chip shows whether your Settings tag is in `/api/ps`
- **Auto before session** (default) — clicking **Start** runs Local LLM first, then Vision Core
- Still reads **`local-llm.env`** for `OLLAMA_HOST` and `DATA_MODEL` (symlink at `./local-llm` OK)

Use the shell repo only if you need the **indexed** profile (Roo / Qdrant) or prefer scripts in CI.

### What built-in Local LLM does (plain)

1. Ensure [Ollama](https://ollama.com/) is running (starts `ollama serve` on macOS with MLX when needed)
2. `ollama pull` your chat model if missing
3. Preload the model via Ollama’s `/api/generate` (`keep_alive: -1`)
4. Vision session starts with **Ollama API base** and `ollama_chat/<tag>` from Settings

Toggle **Auto before session** in Settings or the Terminal Local LLM panel.

### Ping LLM (health check, no repo edits)

**Ping LLM** runs a minimal roundtrip without starting a chat turn or modifying project files:

1. `GET /api/tags` — Ollama server up  
2. Model in tags + optional `/api/ps` (loaded in RAM)  
3. `POST /api/generate` with `num_predict: 1` and prompt `ping` — proves inference works; shows latency  
4. Optional `GET {coreApiUrl}/health` — Vision core API reachable  

Use this when the activity bar says “Waiting for model” but CPU is idle, or before queuing many `/add` messages. A failed ping means fix Ollama/model first; a successful ping with a stuck chat turn means the session queue or core turn needs **Stop** / **Clear queue**, not a dead GPU.

## What you install (two pieces)

| Piece | Role |
|-------|------|
| **[Ollama](https://ollama.com/)** | Runs the model server (default API `http://127.0.0.1:11434`). Download the macOS app or CLI from ollama.com. |
| **[local-llm](https://github.com/Digital-Defiance/local-llm)** | Pulls models, starts Ollama with MLX on Apple Silicon when needed, and preloads weights so Vision does not hit an empty server. |

Aider Vision itself does **not** bundle Ollama or model weights.

## Threaded with Aider Vision (desktop)

Vision reads the **same env keys** as [local-llm](https://github.com/Digital-Defiance/local-llm), in file order (later files win):

1. `~/.config/local-llm/env`
2. `$LOCAL_LLM_DIR/local-llm.env` (if set)
3. `{aider-vision}/local-llm/local-llm.env` — typically a **symlink** to your clone (recommended for dev)
4. `~/local-llm/local-llm.env`
5. **Settings → local-llm directory** (optional) — `local-llm.env` inside that path, applied last

### Symlink at repo root (recommended)

Keep one real clone elsewhere and link it into the Vision tree (gitignored):

```bash
git clone https://github.com/Digital-Defiance/local-llm.git ~/Code/local-llm
cd aider-vision
ln -s ~/Code/local-llm local-llm
cp local-llm/local-llm.env.example local-llm/local-llm.env
```

Vision reads through the symlink; Settings shows resolved paths. From the repo root:

```bash
./local-llm/local-llm.sh start aider-vision
```

| local-llm variable | Aider Vision setting |
|--------------------|----------------------|
| `OLLAMA_HOST` | **Ollama API base** → `OLLAMA_API_BASE` on engine spawn |
| `DATA_MODEL` / `LLM_MODEL` / `CHAT_MODEL` | **LLM model** as `ollama_chat/<tag>` |

On launch, Vision **fills empty** fields from those files (default model + blank Ollama base). Use **Settings → Sync from local-llm** to overwrite model and Ollama base from disk. **Save** after syncing, then **Terminal → Stop / Start**.

Configure once in `local-llm.env`; run `./local-llm.sh start aider-vision`; Vision follows on the next app open or sync.

## Quick path (macOS, chat only)

Use the **`plain`** profile (alias **`aider-vision`**): LLM only — no Docker, no Qdrant.

```bash
# 1. Install Ollama from https://ollama.com/ and open it once (or install CLI).

# 2. Clone and configure local-llm
git clone https://github.com/Digital-Defiance/local-llm.git
cd local-llm
cp local-llm.env.example local-llm.env
# Edit DATA_MODEL to the tag you want (default in the repo: qwen3.6:27b-q4_K_M)

chmod +x local-llm.sh
./local-llm.sh start aider-vision
./local-llm.sh status plain
```

```bash
# 3. In Aider Vision → Settings → Model & system
#    LLM model: ollama_chat/<same tag as DATA_MODEL>
#    Example: ollama_chat/qwen3.6:27b-q4_K_M
#    Save, then Terminal → Start
```

Stop the stack when done:

```bash
./local-llm.sh stop plain
```

## Profiles (local-llm)

| Profile | What runs | Docker | Use when |
|---------|-----------|--------|----------|
| **plain** | Chat LLM only | No | **Aider Vision**, Aider, Cursor-style chat |
| **indexed** | Embedding + LLM + Qdrant | Yes | RAG / codebase indexing (e.g. Roo) |

Aliases: `aider`, `aider-vision`, `cursor` → **plain**; `vectored`, `roo` → **indexed**.

Full command reference: [local-llm README](https://github.com/Digital-Defiance/local-llm).

## Model name in Vision vs Ollama tag

| Where | Example |
|-------|---------|
| Ollama / `DATA_MODEL` in local-llm | `qwen3.6:27b-q4_K_M` |
| Aider Vision **Settings → LLM model** | `ollama_chat/qwen3.6:27b-q4_K_M` |

Vision Core routes models through **LiteLLM**. The `ollama_chat/` prefix selects the Ollama provider; the part after `/` must match the tag Ollama has loaded (`ollama list`).

## Do you need `OLLAMA_API_BASE`?

**Usually no** if `OLLAMA_HOST` in local-llm is default (`http://localhost:11434`) — use **Sync from local-llm** or leave **Ollama API base** empty.

Set **`OLLAMA_HOST`** in `local-llm.env` (or **Ollama API base** in Vision) when Ollama uses a custom URL; they should match. Vision injects the saved **Ollama API base** when spawning the core (Finder launches included).

Shell `export OLLAMA_API_BASE=…` still works if the Settings field is empty.

## Cloud and other providers (still supported)

Defaults and docs emphasize **local Ollama**; nothing in the app **blocks** cloud APIs.

| Provider style | Settings | Environment (inherited by core) |
|----------------|----------|-----------------------------------|
| Ollama (default) | `ollama_chat/<tag>` | Optional `OLLAMA_API_BASE` |
| OpenAI | `openai/gpt-4o` (example) | `OPENAI_API_KEY` |
| Anthropic | `anthropic/claude-…` | `ANTHROPIC_API_KEY` |
| Others | Any [LiteLLM](https://docs.litellm.ai/docs/providers) model string | Provider-specific keys |

Steps:

1. **Do not** require local-llm if you use a cloud model.
2. Set **LLM model** to the LiteLLM id (not `ollama_chat/…`).
3. Export API keys in the environment that launches the app (macOS: launch from Terminal, or set keys in your shell profile).
4. **Save** settings, **Terminal → Start**.

If a cloud setup fails after you previously used Ollama, check that the model string and keys match the provider — the UI still defaults to `ollama_chat/qwen3.6:27b-q4_K_M` until you change it.

## Vision models (images / PDF)

Chat attach for images/PDF requires a **vision-capable** model. Many local chat models are text-only; pick a multimodal Ollama model if you rely on attach, or use a cloud vision model with the appropriate API key.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Session starts then errors on first message | `./local-llm.sh status plain` — is the LLM loaded? Does Settings model match `ollama list`? |
| Connection refused to Ollama | Ollama running? `curl -s http://127.0.0.1:11434/api/tags` |
| Wrong model loaded | `DATA_MODEL` in local-llm vs `ollama_chat/…` in Vision |
| Custom Ollama port/host | `OLLAMA_API_BASE` exported before launching Vision |

See also [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Related

- [USER_WORKFLOW.md](./USER_WORKFLOW.md) — day-to-day app flow  
- [DEVELOPMENT.md](./DEVELOPMENT.md) — hacking on Vision itself  
- [local-llm on GitHub](https://github.com/Digital-Defiance/local-llm)
