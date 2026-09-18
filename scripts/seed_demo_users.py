"""One-off local demo seeding: creates auth.users + profiles + sample tickets
for the 'demo-university' org from supabase/seed.sql.

Requires the service-role key (bypasses RLS deliberately -- this is an
admin-only bootstrap script, never expose SUPABASE_SERVICE_ROLE_KEY to a client).

Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python scripts/seed_demo_users.py
"""
import os
import sys

from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ORG_SLUG = "demo-university"
ORG_DOMAIN = "demo-university.test"
DEMO_PASSWORD = "DemoPass123!"

DEMO_USERS = [
    {"email": f"admin@{ORG_DOMAIN}", "name": "Alex Admin", "role": "admin", "department": "Student Services"},
    {"email": f"mina@{ORG_DOMAIN}", "name": "Mina Patel", "role": "staff", "department": "IT Support"},
    {"email": f"noah@{ORG_DOMAIN}", "name": "Noah Kim", "role": "staff", "department": "Facilities"},
    {"email": f"aisha@{ORG_DOMAIN}", "name": "Aisha Khan", "role": "student", "department": None},
    {"email": f"daniel@{ORG_DOMAIN}", "name": "Daniel Mwangi", "role": "student", "department": None},
]

SAMPLE_TICKETS = [
    {
        "student_email": f"aisha@{ORG_DOMAIN}",
        "assigned_staff_email": f"mina@{ORG_DOMAIN}",
        "title": "Wi-Fi outage in hostel",
        "description": "The internet connection in Block B hostel has been down for two days.",
        "category": "IT Support",
        "department": "IT Support",
        "priority": "High",
        "status": "New",
    },
    {
        "student_email": f"daniel@{ORG_DOMAIN}",
        "assigned_staff_email": f"noah@{ORG_DOMAIN}",
        "title": "Broken AC in lecture hall",
        "description": "The air conditioning in the engineering lecture hall is not working.",
        "category": "Facilities",
        "department": "Facilities",
        "priority": "Medium",
        "status": "Assigned",
    },
]


def main() -> None:
    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment first.", file=sys.stderr)
        sys.exit(1)

    client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    org = client.table("organizations").select("id").eq("slug", ORG_SLUG).single().execute().data
    if not org:
        print(f"Organization '{ORG_SLUG}' not found -- run supabase/seed.sql first.", file=sys.stderr)
        sys.exit(1)
    org_id = org["id"]

    profile_ids: dict[str, str] = {}

    for user in DEMO_USERS:
        created = client.auth.admin.create_user({
            "email": user["email"],
            "password": DEMO_PASSWORD,
            "email_confirm": True,
        })
        user_id = created.user.id
        profile_ids[user["email"]] = user_id

        client.table("profiles").upsert({
            "id": user_id,
            "organization_id": org_id,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "department": user["department"],
        }).execute()
        print(f"Created {user['role']}: {user['email']} / {DEMO_PASSWORD}")

    for ticket in SAMPLE_TICKETS:
        client.table("tickets").insert({
            "organization_id": org_id,
            "student_name": next(u["name"] for u in DEMO_USERS if u["email"] == ticket["student_email"]),
            "student_id": ticket["student_email"].split("@")[0].upper(),
            "title": ticket["title"],
            "description": ticket["description"],
            "category": ticket["category"],
            "department": ticket["department"],
            "priority": ticket["priority"],
            "status": ticket["status"],
            "assigned_staff_id": profile_ids[ticket["assigned_staff_email"]],
            "submitted_by": profile_ids[ticket["student_email"]],
        }).execute()
        print(f"Created ticket: {ticket['title']}")

    print("\nDone. All demo accounts share the password:", DEMO_PASSWORD)


if __name__ == "__main__":
    main()
