# AI Response Guardian — PRD 3: Proxy Engine

The network-level HTTPS intercept engine. Sits between employees and AI APIs,
scans both outbound prompts and inbound AI responses, and reports incidents to
the Guardian backend in real time.

## Architecture

```
Employee's browser / VS Code / terminal
         │
         ▼  (OS proxy: 127.0.0.1:8080)
┌─────────────────────────────────────┐
│       Guardian Proxy Engine         │
│  ┌──────────────┐  ┌─────────────┐  │
│  │  Platform    │  │   Scanner   │  │
│  │  Detector    │  │  (PRD 3)    │  │
│  └──────────────┘  └─────────────┘  │
│         │               │           │
│         └────── ──── ───┘           │
│              Reporter               │
│         (async POST to backend)     │
└─────────────────────────────────────┘
         │
         ▼  (forwarded — possibly sanitized or blocked)
   AI Platform API (OpenAI, Anthropic, Gemini, Copilot…)
         │
         ▼  (response intercepted on way back)
   Employee receives response (or block notice)
```

## Quick Start

### 1. Install dependencies

```bash
cd proxy
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env — set PROXY_SECRET_KEY to match backend .env
```

### 3. Run the proxy

```bash
# Standard mode
python run.py

# With verbose debug output
python run.py --log-level DEBUG

# Dry run (scan only — no blocking or reporting)
python run.py --dry-run

# Visual web UI (opens http://127.0.0.1:8081)
python run.py --web

# Custom port
python run.py --port 8888
```

### 4. Install the CA certificate (required for HTTPS interception)

After first run, mitmproxy generates a CA cert at `~/.mitmproxy/mitmproxy-ca-cert.pem`.

**macOS**
```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain \
  ~/.mitmproxy/mitmproxy-ca-cert.pem
```

**Linux (Ubuntu/Debian)**
```bash
sudo cp ~/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/guardian.crt
sudo update-ca-certificates
```

**Windows (PowerShell as Admin)**
```powershell
Import-Certificate -FilePath "$env:USERPROFILE\.mitmproxy\mitmproxy-ca-cert.pem" `
  -CertStoreLocation Cert:\LocalMachine\Root
```

**Firefox** (uses its own cert store)
Settings → Privacy & Security → Certificates → View Certificates → Import

### 5. Point your OS proxy to Guardian

**macOS** (System Settings → Network → Proxies)
- HTTP Proxy:  127.0.0.1 : 8080
- HTTPS Proxy: 127.0.0.1 : 8080

**Linux (GNOME)**
Settings → Network → Network Proxy → Manual
- HTTP/HTTPS: 127.0.0.1 : 8080

**Windows**
Settings → Network → Proxy → Manual proxy setup
- Address: 127.0.0.1  Port: 8080

**VS Code / terminal (env vars)**
```bash
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080
```

---

## Threat Detection

### Outbound (Prompt Scanning)

| Threat              | What it detects                                      |
|---------------------|------------------------------------------------------|
| `pii_leak`          | Emails, Aadhaar, PAN, phone numbers, credit cards    |
| `secret_key_leak`   | AWS keys, GitHub tokens, OpenAI keys, JWT, RSA keys  |
| `source_code_leak`  | Python/JS/SQL code patterns (≥2 signals)             |
| `internal_domain`   | Private IPs (192.168.x, 10.x), internal. subdomains |
| `financial_data`    | IBAN, SWIFT, bank account numbers, revenue mentions  |

### Inbound (Response Scanning)

| Threat                | What it detects                                      |
|-----------------------|------------------------------------------------------|
| `prompt_injection`    | "Ignore previous instructions", DAN, jailbreaks      |
| `hallucinated_cred`   | AI fabricating API keys / secrets in its response    |
| `malicious_code`      | Reverse shells, `eval()`, `rm -rf /`, curl-pipe      |
| `social_engineering`  | "Enter your password", fake account suspension       |
| `cross_session_bleed` | AI referencing another user's conversation           |
| `data_exfil_attempt`  | AI instructing to POST data to external URLs         |

### Risk Levels & Actions

| Score | Level    | Default Action      |
|-------|----------|---------------------|
| 80–100 | critical | Blocked             |
| 55–79  | high     | Warned (or Blocked if `POLICY_THRESHOLD=block`) |
| 30–54  | medium   | Sanitized / Warned  |
| 1–29   | low      | Allowed + Logged    |
| 0      | safe     | Allowed silently    |

---

## Supported AI Platforms

| Platform  | Hosts intercepted                                             |
|-----------|---------------------------------------------------------------|
| chatgpt   | `api.openai.com`, `chat.openai.com`                          |
| claude    | `api.anthropic.com`, `claude.ai`                             |
| gemini    | `generativelanguage.googleapis.com`, `gemini.google.com`     |
| copilot   | `copilot.microsoft.com`, `api.githubcopilot.com`, Azure OAI  |
| other     | Mistral, Cohere, HuggingFace, Perplexity, Grok, Together AI  |

---

## Running Tests

```bash
cd proxy
python -m pytest tests/ -v
```

---

## Docker

```bash
# Build and run standalone (backend must be reachable at BACKEND_URL)
docker build -t guardian-proxy .
docker run -p 8080:8080 \
  -e PROXY_SECRET_KEY=your_secret \
  -e BACKEND_URL=http://host.docker.internal:4000 \
  guardian-proxy
```

Or use the root `docker-compose.yml` to run all 3 services together.

---

## Environment Variables

| Variable           | Default              | Description                              |
|--------------------|----------------------|------------------------------------------|
| `PROXY_SECRET_KEY` | *required*           | Shared secret with backend               |
| `BACKEND_URL`      | `http://localhost:4000` | Guardian backend base URL             |
| `PROXY_HOST`       | `0.0.0.0`            | Proxy listen host                        |
| `PROXY_PORT`       | `8080`               | Proxy listen port                        |
| `POLICY_THRESHOLD` | `warn`               | `warn` or `block`                        |
| `DRY_RUN`          | `0`                  | `1` = scan only, no blocking/reporting   |
| `LOG_LEVEL`        | `INFO`               | `DEBUG`/`INFO`/`WARNING`/`ERROR`         |
| `LOG_BODIES`       | `0`                  | `1` = log full request/response bodies   |
| `MAX_BODY_BYTES`   | `512000`             | Max body size to scan                    |
| `DEVICE_ID`        | hostname             | Tag incidents with device identifier     |
| `BYPASS_HOSTS`     | *(empty)*            | Comma-separated hosts to never scan      |
| `SSL_CA_CERT`      | *(empty)*            | Custom CA cert path (optional)           |
| `SSL_CA_KEY`       | *(empty)*            | Custom CA key path (optional)            |
