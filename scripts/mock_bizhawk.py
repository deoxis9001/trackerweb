#!/usr/bin/env python3
"""
Mock BizHawk bridge — remplace bizhawk_tracker.lua pour tester le tracker sans BizHawk.

Lance un serveur HTTP sur http://localhost:65399 (meme port que le vrai bridge Lua)
et deverrouille 1 item ou location par intervalle — mais UNIQUEMENT apres la premiere
connexion du tracker (premier GET recu). Ainsi tu peux lancer le script a l'avance
sans que les items ne s'accumulent.

Usage :
    py scripts/mock_bizhawk.py
    py scripts/mock_bizhawk.py --interval 1   # plus rapide
    py scripts/mock_bizhawk.py --shuffle       # ordre aleatoire
"""
import argparse
import json
import re
import random
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

PORT     = 65399
LUA_FILE = Path(__file__).parent.parent / "connector" / "bizhawk_tracker.lua"

ITEM_MAX = {
    "GUST_JAR": 1, "CANE_OF_PACCI": 1, "MOLE_MITTS": 1,
    "ROCS_CAPE": 1, "PEGASUS_BOOTS": 1, "OCARINA": 1,
    "TINGLE_TROPHY": 1, "CARLOV_MEDAL": 1, "GRIP_RING": 1,
    "POWER_BRACELETS": 1, "FLIPPERS": 1,
    "SPIN_ATTACK": 1, "ROLL_ATTACK": 1, "DASH_ATTACK": 1,
    "ROCK_BREAKER": 1, "SWORD_BEAM": 1, "GREATSPIN": 1,
    "DOWNTHRUST": 1, "PERIL_BEAM": 1,
    "FAST_SPIN_SCROLL": 1, "FAST_SPLIT_SCROLL": 1, "LONG_SPIN": 1,
    "EARTH_ELEMENT": 1, "FIRE_ELEMENT": 1, "WATER_ELEMENT": 1, "WIND_ELEMENT": 1,
    "REMOTE_BOMB": 1, "BOW_BUTTERFLY": 1, "MITTS_BUTTERFLY": 1, "FLIPPERS_BUTTERFLY": 1,
    "JABBER_NUT": 1, "DOG_FOOD": 1, "LONLON_KEY": 1,
    "GRAVEYARD_KEY": 1, "WAKEUP_MUSHROOM": 1, "LANTERN": 1,
    "PROGRESSIVE_SWORD": 5, "PROGRESSIVE_BOW": 2,
    "PROGRESSIVE_BOOMERANG": 2, "PROGRESSIVE_SHIELD": 2,
    "BOTTLE": 4, "PROGRESSIVE_BOMB_BAG": 3,
    "PROGRESSIVE_WALLET": 2, "HEART_TOTAL": 14,
    "PROGRESSIVE_BOOK": 3,
}

def load_locations(lua_path: Path) -> list[int]:
    if not lua_path.exists():
        print(f"[!] Fichier Lua introuvable : {lua_path}")
        return []
    text = lua_path.read_text(encoding="utf-8")
    ids = [int(m) for m in re.findall(r'\{(\d+),0x[0-9a-f]+,0x[0-9a-f]+\}', text)]
    print(f"[i] {len(ids)} locations lues depuis {lua_path.name}")
    return ids

lock            = threading.Lock()
ticker_started  = threading.Event()   # signale au ticker de demarrer
state: dict     = {"_ready": True, "_checked": [], "_room_area": 0}
for k in ITEM_MAX:
    state[k] = 0

queue: list = []

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/stop":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"stopping")
            print("\n[i] Arret via /stop")
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return

        # Demarre le ticker a la premiere connexion du tracker
        if not ticker_started.is_set():
            ticker_started.set()
            print("[i] Tracker connecte — debut du deverrouillage progressif.\n")

        with lock:
            body = json.dumps(state).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass

def ticker(interval: float):
    # Attend que le tracker se connecte avant de commencer
    ticker_started.wait()

    unlocked = 0
    total = len(queue)
    while queue:
        time.sleep(interval)
        with lock:
            if not queue:
                break
            key, kind = queue.pop(0)
            if kind == "item":
                current = state.get(key, 0)
                nxt = min(current + 1, ITEM_MAX[key])
                state[key] = nxt
                print(f"  [{unlocked+1}/{total}] item     {key:30s}  {current} -> {nxt}", flush=True)
            else:
                state["_checked"].append(key)
                print(f"  [{unlocked+1}/{total}] location {key}", flush=True)
        unlocked += 1
    print("\n[OK] Tout deverrouille.")

def kill_existing():
    """Kill any other mock_bizhawk.py processes already running on PORT."""
    import os
    import signal
    import subprocess
    my_pid = os.getpid()
    killed = 0
    try:
        result = subprocess.run(
            ["python", "-c",
             "import psutil, sys; "
             f"[print(p.pid) for p in psutil.process_iter(['pid','name','cmdline']) "
             f"if p.pid != {my_pid} and 'mock_bizhawk' in ' '.join(p.info.get('cmdline') or [])]"],
            capture_output=True, timeout=5
        )
        pids = [int(l) for l in result.stdout.decode('utf-8', errors='replace').splitlines()
                if l.strip().isdigit()]
    except Exception:
        pids = []

    if not pids:
        # fallback: netstat approach on Windows
        try:
            import subprocess as sp
            r = sp.run(["netstat", "-ano"], capture_output=True, timeout=5)
            stdout = r.stdout.decode('utf-8', errors='replace')
            pids = []
            for line in stdout.splitlines():
                if f":{PORT}" in line and "LISTENING" in line:
                    parts = line.split()
                    pid = int(parts[-1])
                    if pid != my_pid:
                        pids.append(pid)
        except Exception:
            pids = []

    for pid in pids:
        try:
            if os.name == "nt":
                subprocess.run(["taskkill", "/F", "/PID", str(pid)],
                               capture_output=True, timeout=5)
            else:
                os.kill(pid, signal.SIGTERM)
            print(f"[i] Processus zombie tue (PID {pid})")
            killed += 1
        except Exception:
            pass

    if killed:
        import time as _t
        _t.sleep(0.5)


def main():
    parser = argparse.ArgumentParser(description="Mock BizHawk bridge pour TMC Tracker")
    parser.add_argument("--interval", type=float, default=1.0,
                        help="Secondes entre chaque deverrouillage (defaut: 1)")
    parser.add_argument("--shuffle", action="store_true",
                        help="Ordre aleatoire (sinon items d'abord, puis locations)")
    parser.add_argument("--stop", action="store_true",
                        help="Arreter l'instance en cours sur le port 65399")
    args = parser.parse_args()

    if args.stop:
        import urllib.request
        try:
            urllib.request.urlopen(f"http://localhost:{PORT}/stop", timeout=2)
            print("[i] Instance arretee.")
        except Exception:
            print("[!] Aucune instance en cours (ou deja arretee).")
        return

    kill_existing()

    locations = load_locations(LUA_FILE)

    item_entries = [(k, "item") for k in ITEM_MAX for _ in range(ITEM_MAX[k])]
    loc_entries  = [(loc_id, "loc") for loc_id in locations]

    if args.shuffle:
        combined = item_entries + loc_entries
        random.shuffle(combined)
        queue.extend(combined)
    else:
        queue.extend(item_entries + loc_entries)

    total = len(queue)
    print(f"[i] {len(item_entries)} tokens items + {len(loc_entries)} locations = {total} etapes")
    print(f"[i] Intervalle : {args.interval}s")
    print(f"[i] Serveur sur http://localhost:{PORT}")
    print(f"[i] En attente de connexion du tracker (bouton BizHawk Lua)...\n")

    t = threading.Thread(target=ticker, args=(args.interval,), daemon=True)
    t.start()

    server = HTTPServer(("localhost", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[i] Arret.")

if __name__ == "__main__":
    main()
