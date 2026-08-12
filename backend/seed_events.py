"""
One-time seed: populates the events table with the same events shown on the
frontend (frontend/lib/events-data.ts), so the registration API and admin
panel have real event_ids to work with from day one.

Posters aren't set here (no files to upload from a script) — upload them
from the admin panel's Events tab after seeding.

Safe to re-run: skips any event whose name already exists.
Run: python seed_events.py
"""
from app import app
from services.event_service import list_events, create_event

EVENTS = [
    {"name": "CAPTURE THE FLAG", "category": "TECHNICAL", "tag": "COMPETITION", "fee": "₹250 PER TEAM", "venue": "SRM RAMAPURAM", "date": "7 — 8 OCTOBER"},
    {"name": "BUG BOUNTY", "category": "TECHNICAL", "tag": "COMPETITION", "fee": "₹200 PER TEAM", "min_team_size": 2, "max_team_size": 2, "venue": "SRM RAMAPURAM", "date": "7 — 8 OCTOBER", "prize": "₹3000"},
    {"name": "RED TEAM × BLUE TEAM", "category": "TECHNICAL", "tag": "LIVE EXERCISE", "fee": "₹250 PER TEAM", "venue": "SRM RAMAPURAM", "date": "7 — 8 OCTOBER"},
    {"name": "PAPER PRESENTATION", "category": "TECHNICAL", "tag": "RESEARCH", "venue": "SRM RAMAPURAM", "date": "7 — 8 OCTOBER"},
    {"name": "CYBER CONCLAVE", "category": "TECHNICAL", "tag": "PANEL", "venue": "SRM RAMAPURAM", "date": "7 — 8 OCTOBER"},
    {"name": "TOOL EXPO", "category": "TECHNICAL", "tag": "EXHIBITION", "fee": "₹250 PER TEAM", "venue": "SRM RAMAPURAM", "date": "7 — 8 OCTOBER"},
    {"name": "WORKSHOPS", "category": "TECHNICAL", "tag": "HANDS-ON", "venue": "SRM RAMAPURAM", "date": "7 OCTOBER", "time": "10:00 — 1:00"},
    {"name": "SHARK TANK", "category": "NON-TECHNICAL", "tag": "NON-TECHNICAL", "fee": "₹250 PER TEAM", "venue": "SRM RAMAPURAM", "date": "7 — 8 OCTOBER"},
    {"name": "SHIPWRECK", "category": "NON-TECHNICAL", "tag": "NON-TECHNICAL", "fee": "₹200 PER TEAM", "min_team_size": 1, "max_team_size": 2, "venue": "SRM RAMAPURAM", "date": "7 — 8 OCTOBER", "prize": "₹3000"},
    {"name": "BEHIND THE CRIME", "category": "NON-TECHNICAL", "tag": "NON-TECHNICAL", "fee": "₹250 PER TEAM", "venue": "SRM", "date": "7 OCTOBER", "time": "10:00 — 1:00"},
    {"name": "CYBER AWARENESS RALLY", "category": "NON-TECHNICAL", "tag": "NON-TECHNICAL", "venue": "TBA", "date": "7 — 8 OCTOBER"},
]

if __name__ == "__main__":
    with app.app_context():
        existing_names = {e.name for e in list_events(include_inactive=True)}
        created = 0
        for e in EVENTS:
            if e["name"] in existing_names:
                continue
            create_event(e)
            created += 1
        total = len(list_events(include_inactive=True))
        print(f"Seeded {created} new event(s). {total} total in the events table.")
