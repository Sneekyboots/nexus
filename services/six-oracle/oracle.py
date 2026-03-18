#!/usr/bin/env python3
"""
NEXUS SIX Financial Oracle
===========================
Python sidecar that fetches live FX rates from SIX Group API using mTLS,
serves them on http://localhost:7070/rates for the Vite frontend.

Auth   : mTLS — place your SIX-issued certificate files in certs/ before running.
           certs/signed-certificate.pem
           certs/private-key.pem
         Certificate files are NOT committed (see .gitignore).
         Contact SIX Group to obtain credentials for your team.

Endpoint: GET https://api.six-group.com/web/v2/listings/marketData/intradaySnapshot
Scheme  : VALOR_BC  |  BC code: 149 (Forex Calculated Rates)

FX pairs with real SIX VALORs:
  EUR/USD  946681_149
  GBP/USD  275017_149
  CHF/USD  275164_149
  CHF/EUR  968880_149

Fixed-peg fallback (SIX does not carry these):
  AED/USD  0.2723  (USD peg)
  SGD/USD  0.7481
  HKD/USD  0.1282  (USD peg)

Usage:
  python3 oracle.py [--port 7070] [--once]

  --port   Port to listen on (default 7070)
  --once   Fetch once, print JSON, exit (useful for testing / curl smoke-test)
"""

import os
import ssl
import json
import time
import argparse
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).parent
CERT_PATH = Path(os.environ.get("SIX_CERT_PATH", str(BASE_DIR / "certs" / "signed-certificate.pem")))
KEY_PATH  = Path(os.environ.get("SIX_KEY_PATH",  str(BASE_DIR / "certs" / "private-key.pem")))
# If your private-key.pem is passphrase-protected, set SIX_CERT_PASSWORD env var.
CERT_PASSWORD = os.environ.get("SIX_CERT_PASSWORD") or None

SIX_BASE_URL = "https://api.six-group.com/web/v2"
INTRADAY_ENDPOINT = f"{SIX_BASE_URL}/listings/marketData/intradaySnapshot"

# VALOR_BC identifiers for each pair (BC=149 Forex Calculated Rates)
SIX_VALORS = {
    "EUR/USD": "946681_149",
    "GBP/USD": "275017_149",
    "CHF/USD": "275164_149",
    "CHF/EUR": "968880_149",
}

# Fixed-peg / estimated rates for pairs SIX doesn't carry
FIXED_PEGS = {
    "AED/USD": {"rate": 0.2723, "bid": 0.2722, "ask": 0.2724, "change24h": 0.0},
    "SGD/USD": {"rate": 0.7481, "bid": 0.7479, "ask": 0.7483, "change24h": -0.03},
    "HKD/USD": {"rate": 0.1282, "bid": 0.1281, "ask": 0.1283, "change24h": 0.01},
}

# Seed rates used as final fallback when SIX is unreachable
SEED_RATES = {
    "EUR/USD": {"rate": 1.0847, "bid": 1.0845, "ask": 1.0849, "change24h": 0.12},
    "GBP/USD": {"rate": 1.2651, "bid": 1.2649, "ask": 1.2653, "change24h": -0.08},
    "CHF/USD": {"rate": 1.1203, "bid": 1.1200, "ask": 1.1206, "change24h": 0.05},
    "CHF/EUR": {"rate": 1.0326, "bid": 1.0324, "ask": 1.0328, "change24h": 0.03},
    **FIXED_PEGS,
}

CACHE_TTL_SECONDS = 30          # re-fetch from SIX every 30 s
_rate_cache: dict = {}          # {"rates": [...], "fetched_at": float}

# ---------------------------------------------------------------------------
# mTLS SSL context
# ---------------------------------------------------------------------------

def build_ssl_context() -> ssl.SSLContext:
    """Create an mTLS context using the SIX client certificate."""
    ctx = ssl.create_default_context()
    if CERT_PASSWORD:
        ctx.load_cert_chain(str(CERT_PATH), str(KEY_PATH), password=CERT_PASSWORD)
    else:
        ctx.load_cert_chain(str(CERT_PATH), str(KEY_PATH))
    return ctx

# ---------------------------------------------------------------------------
# SIX API fetch
# ---------------------------------------------------------------------------

def fetch_six_rate(valor: str, ssl_ctx: ssl.SSLContext) -> dict | None:
    """
    Fetch intraday snapshot for a single VALOR_BC identifier.
    Returns raw JSON or None on error.
    SIX query param is `ids=`, not `valor=`.
    Example: .../intradaySnapshot?scheme=VALOR_BC&ids=946681_149
    """
    url = f"{INTRADAY_ENDPOINT}?scheme=VALOR_BC&ids={valor}&preferredLanguage=EN"
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "NEXUS-Oracle/1.0",
    })
    try:
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"[SIX] HTTP {e.code} for {valor}: {e.reason}")
        return None
    except Exception as e:
        print(f"[SIX] Error fetching {valor}: {e}")
        return None


def extract_rate(data: dict | None) -> dict | None:
    """
    Parse the SIX intradaySnapshot response.
    Real shape:
      {
        "data": {
          "listings": [{
            "lookupStatus": "FOUND",
            "marketData": {
              "intradaySnapshot": {
                "last":    {"value": 1.154135, ...},
                "bestBid": {"value": 1.153935, ...},
                "bestAsk": {"value": 1.154335, ...},
                "percentageChangeLast": {"value": 0.363555, ...}
              }
            }
          }]
        }
      }
    """
    if not data:
        return None
    try:
        listing = data["data"]["listings"][0]
        if listing.get("lookupStatus") != "FOUND":
            return None
        snap = listing["marketData"]["intradaySnapshot"]
        rate = float(snap["last"]["value"])
        bid  = float(snap.get("bestBid", {}).get("value", rate - 0.0002))
        ask  = float(snap.get("bestAsk", {}).get("value", rate + 0.0002))
        chg  = float(snap.get("percentageChangeLast", {}).get("value", 0) or 0)
        if rate == 0:
            return None
        return {
            "rate": round(rate, 6),
            "bid":  round(bid,  6),
            "ask":  round(ask,  6),
            "change24h": round(chg, 4),
        }
    except (KeyError, IndexError, TypeError, ValueError) as e:
        print(f"[SIX] Parse error: {e} — raw keys: {list(data.keys()) if data else 'None'}")
        return None

# ---------------------------------------------------------------------------
# Rate builder
# ---------------------------------------------------------------------------

def build_rates() -> list[dict]:
    """
    Fetch all pairs from SIX, fall back to seed rates where unavailable.
    Returns list of FxRate objects ready for JSON serialisation.
    """
    now = datetime.now(timezone.utc).isoformat()
    ssl_ctx = build_ssl_context()
    results = []

    # SIX-sourced pairs
    for pair, valor in SIX_VALORS.items():
        raw  = fetch_six_rate(valor, ssl_ctx)
        data = extract_rate(raw)
        if data:
            print(f"[SIX] {pair} = {data['rate']} (live)")
            results.append({
                "pair": pair,
                "rate": data["rate"],
                "bid":  data["bid"],
                "ask":  data["ask"],
                "change24h": data["change24h"],
                "lastUpdated": now,
                "stale": False,
                "source": "SIX Financial",
            })
        else:
            seed = SEED_RATES.get(pair, {"rate": 1.0, "bid": 1.0, "ask": 1.0, "change24h": 0})
            print(f"[SIX] {pair} — SIX unavailable, using seed {seed['rate']}")
            results.append({
                "pair": pair,
                "rate": seed["rate"],
                "bid":  seed["bid"],
                "ask":  seed["ask"],
                "change24h": seed["change24h"],
                "lastUpdated": now,
                "stale": True,
                "source": "SIX Financial (fallback)",
            })

    # Fixed-peg pairs
    for pair, peg in FIXED_PEGS.items():
        results.append({
            "pair": pair,
            "rate": peg["rate"],
            "bid":  peg["bid"],
            "ask":  peg["ask"],
            "change24h": peg["change24h"],
            "lastUpdated": now,
            "stale": False,
            "source": "SIX Financial (peg)",
        })

    return results


def get_cached_rates() -> list[dict]:
    """Return cached rates, refreshing if TTL has elapsed."""
    now = time.time()
    if not _rate_cache or (now - _rate_cache.get("fetched_at", 0)) > CACHE_TTL_SECONDS:
        print(f"[Cache] Refreshing rates from SIX...")
        try:
            rates = build_rates()
            _rate_cache["rates"] = rates
            _rate_cache["fetched_at"] = now
        except Exception as e:
            print(f"[Cache] Fetch failed: {e}")
            if not _rate_cache.get("rates"):
                # First-ever fetch failed — use seeds
                iso = datetime.now(timezone.utc).isoformat()
                _rate_cache["rates"] = [
                    {"pair": p, **v, "lastUpdated": iso, "stale": True,
                     "source": "SIX Financial (fallback)"}
                    for p, v in SEED_RATES.items()
                ]
                _rate_cache["fetched_at"] = now
    return _rate_cache["rates"]

# ---------------------------------------------------------------------------
# HTTP handler
# ---------------------------------------------------------------------------

class OracleHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):  # noqa: A002
        print(f"[HTTP] {self.address_string()} — {format % args}")

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path in ("/rates", "/rates/"):
            rates = get_cached_rates()
            body = json.dumps({"rates": rates, "count": len(rates),
                               "timestamp": datetime.now(timezone.utc).isoformat()},
                              indent=2).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(body)

        elif self.path in ("/health", "/"):
            body = b'{"status":"ok","service":"NEXUS SIX Oracle"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(body)

        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error":"not found"}')

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="NEXUS SIX Oracle sidecar")
    parser.add_argument("--port", type=int, default=7070, help="HTTP port (default 7070)")
    parser.add_argument("--once", action="store_true",
                        help="Fetch rates once, print JSON, then exit")
    args = parser.parse_args()

    if args.once:
        rates = build_rates()
        print(json.dumps({"rates": rates, "count": len(rates)}, indent=2))
        return

    # Warm the cache before accepting connections
    print(f"[Oracle] Starting — warming cache...")
    get_cached_rates()

    server = HTTPServer(("0.0.0.0", args.port), OracleHandler)
    print(f"[Oracle] Listening on http://localhost:{args.port}/rates")
    print(f"[Oracle] Cache TTL: {CACHE_TTL_SECONDS}s")
    print(f"[Oracle] Certs: {CERT_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[Oracle] Stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
