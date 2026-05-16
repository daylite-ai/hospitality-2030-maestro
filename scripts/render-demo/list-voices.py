#!/usr/bin/env python3
"""List the user's ElevenLabs premade voice catalog so we can pick a cast."""
import json, os, sys, urllib.request

key = os.environ.get("ELEVENLABS_API_KEY")
if not key:
    print("ELEVENLABS_API_KEY missing", file=sys.stderr)
    sys.exit(2)

req = urllib.request.Request("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": key})
with urllib.request.urlopen(req, timeout=20) as r:
    data = json.load(r)

for v in data.get("voices", []):
    labels = v.get("labels") or {}
    print(f'{v["voice_id"][:10]}  {v["name"]:22s}  gender={labels.get("gender","?"):6s}  age={labels.get("age","?"):12s}  use={labels.get("use_case","?"):16s}  desc={labels.get("description","")[:30]}')
