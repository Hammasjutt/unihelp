import os
import logging
import secrets
import string
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx
import requests
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client, create_client

try:
    from ml.predict import LocalTicketClassifier, ModelPredictionError, ModelUnavailableError
except ModuleNotFoundError:
    from backend.ml.predict import LocalTicketClassifier, ModelPredictionError, ModelUnavailableError

app = FastAPI(title="UniHelp API")
logger = logging.getLogger(__name__)


def load_env_file() -> None:
    env_candidates = [
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parents[1] / ".env",
        Path.cwd() / ".env",
    ]
    for env_path in env_candidates:
        if not env_path.exists():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_env_file()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must all be set "
        "(see backend/.env). This backend has no in-memory fallback mode -- "
        "org-scoped RLS is the only source of truth."
    )

DEFAULT_N8N_WEBHOOK_URL = "http://localhost:5678/webhook/a667897b-2cca-4247-83d4-6ff8bf8b8f81"
N8N_WEBHOOK_URL = (
    os.getenv("N8N_WEBHOOK_URL")
    or os.getenv("N8N_WEBHOOK")
    or os.getenv("WEBHOOK_URL")
    or DEFAULT_N8N_WEBHOOK_URL
)
LOCAL_CLASSIFIER = LocalTicketClassifier()

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


class StaffInvitePayload(BaseModel):
    email: str
    role: str
    name: Optional[str] = None
    department: Optional[str] = None
    roll_number: Optional[str] = None
    academic_department: Optional[str] = None
    batch: Optional[str] = None
    temporary_password: Optional[str] = None


def extract_bearer_token(authorization: Optional[str]) -> str:
    prefix = "Bearer "
    if not authorization or not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
    token = authorization[len(prefix):].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return token


def get_user_scoped_client(access_token: str) -> Client:
    """A Supabase client whose Postgrest/Storage requests carry the caller's own
    JWT, so RLS evaluates auth.uid() as that specific user -- never the
    service-role key for anything reachable from the browser's request path."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.options.headers["Authorization"] = f"Bearer {access_token}"
    return client


def get_service_role_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def verify_caller(authorization: str) -> Any:
    """Validates the bearer token against Supabase Auth and returns the user."""
    access_token = extract_bearer_token(authorization)
    anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    try:
        user_response = anon_client.auth.get_user(access_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if not user_response or not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return access_token, user_response.user


def derive_title(description: str, limit: int = 60) -> str:
    text = " ".join(description.split())
    if not text:
        return "New complaint"
    if len(text) <= limit:
        return text
    truncated = text[:limit].rsplit(" ", 1)[0] or text[:limit]
    return f"{truncated}..."


def get_department_names(client: Client, organization_id: str) -> list[str]:
    response = client.table("departments").select("name").eq("organization_id", organization_id).execute()
    return [row["name"] for row in (response.data or []) if row.get("name")]


def generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    body = "".join(secrets.choice(alphabet) for _ in range(length - 2))
    return f"{body}1!"


def find_auth_user_id_by_email(client: Client, email: str) -> Optional[str]:
    target_email = email.strip().lower()
    page = 1
    while True:
        users_response = client.auth.admin.list_users(page=page, per_page=100)
        users = getattr(users_response, "users", users_response) or []
        if not users:
            return None
        for auth_user in users:
            if (auth_user.email or "").strip().lower() == target_email:
                return auth_user.id
        if len(users) < 100:
            return None
        page += 1


class ClassificationError(Exception):
    """Raised when a complaint cannot be classified by any configured route."""


def classify_ticket_locally(payload: dict[str, Any], department_names: list[str]) -> dict[str, Any]:
    """Last-resort deterministic classifier used only after model and n8n failures."""
    text = " ".join(
        str(payload.get(key) or "")
        for key in ("title", "description", "category")
    ).lower()

    department_keywords = {
        "IT Support": ["wifi", "wi-fi", "internet", "portal", "password", "login", "computer", "network"],
        "Facilities": ["ac", "air conditioner", "class room", "classroom", "fan", "light", "room", "water", "washroom"],
        "Academic Office": ["exam", "grade", "result", "transcript", "course", "timetable", "class schedule", "enrollment"],
        "Student Finance": ["fee", "voucher", "challan", "payment", "refund", "scholarship", "dues"],
        "Student Services": ["admission", "student card", "id card", "hostel", "transport", "certificate", "documents"],
        "Library": ["library", "book", "books"],
    }

    normalized_departments = {department.lower(): department for department in department_names}
    selected_department = department_names[0]
    best_score = 0
    for preferred_department, keywords in department_keywords.items():
        actual_department = normalized_departments.get(preferred_department.lower())
        if not actual_department:
            continue
        score = sum(1 for keyword in keywords if keyword in text)
        if score > best_score:
            selected_department = actual_department
            best_score = score

    high_keywords = ["urgent", "emergency", "not working", "broken", "disconnecting", "can't login", "cannot login"]
    low_keywords = ["confirm", "question", "query", "holiday", "date", "schedule"]
    if any(keyword in text for keyword in high_keywords):
        priority = "High"
    elif any(keyword in text for keyword in low_keywords):
        priority = "Low"
    else:
        priority = "Medium"

    return {
        "department": selected_department,
        "priority": priority,
        "source": "keyword_fallback",
        "confidence": None,
    }


def classify_ticket_with_n8n(payload: dict[str, Any], department_names: list[str]) -> dict[str, Any]:
    """Ask n8n to classify a ticket and raise when its result cannot be used."""
    webhook_url = (N8N_WEBHOOK_URL or "").strip()
    if not webhook_url:
        raise ClassificationError("n8n webhook is not configured")

    webhook_payload = {
        "source": "unihelp",
        "event": "ticket.classify",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "departments": department_names,
        "ticket": payload,
    }

    try:
        response = requests.post(
            webhook_url,
            json=webhook_payload,
            headers={"Content-Type": "application/json"},
            timeout=45,
        )
        response.raise_for_status()
        if not response.text.strip():
            raise ClassificationError("n8n returned an empty response")
        data = response.json() or {}
    except requests.RequestException as exc:
        raise ClassificationError(f"n8n request failed: {exc}") from exc
    except ValueError as exc:
        raise ClassificationError("n8n returned invalid JSON") from exc

    department = data.get("department")
    if department not in department_names:
        raise ClassificationError(f"n8n returned unavailable department '{department}'")

    priority = data.get("priority")
    if priority not in {"Low", "Medium", "High"}:
        raise ClassificationError(f"n8n returned invalid priority '{priority}'")

    confidence = data.get("confidence")
    try:
        confidence = round(float(confidence), 4) if confidence is not None else None
    except (TypeError, ValueError):
        confidence = None

    return {
        "department": department,
        "priority": priority,
        "source": "n8n",
        "confidence": confidence,
    }


def classify_ticket_with_ai(payload: dict[str, Any], department_names: list[str]) -> dict[str, Any]:
    """Classify via local model, then n8n, then deterministic keywords.

    Keeping this public function name avoids changing the ticket creation call
    site while making the trained local model the primary route.
    """
    if not department_names:
        raise ClassificationError("This organization has no departments configured for classification.")

    try:
        return LOCAL_CLASSIFIER.predict(payload, department_names)
    except (ModelUnavailableError, ModelPredictionError) as exc:
        logger.info("Local ticket classifier skipped: %s", exc)

    try:
        return classify_ticket_with_n8n(payload, department_names)
    except ClassificationError as exc:
        logger.warning("n8n ticket classification skipped: %s", exc)

    return classify_ticket_locally(payload, department_names)


@app.get("/health")
def health_check():
    metadata = LOCAL_CLASSIFIER.metadata
    return {
        "status": "ok",
        "local_model_available": LOCAL_CLASSIFIER.is_available,
        "local_model_trained_at": metadata.get("trained_at"),
        "n8n_configured": bool(N8N_WEBHOOK_URL),
        "classification_order": ["local_model", "n8n", "keyword_fallback"],
    }


@app.get("/tickets")
def list_tickets(authorization: Optional[str] = Header(None)):
    _access_token, user = verify_caller(authorization)
    service_client = get_service_role_client()
    profile = (
        service_client.table("profiles")
        .select("organization_id, role, department")
        .eq("id", user.id)
        .single()
        .execute()
        .data
    )
    if not profile:
        raise HTTPException(status_code=403, detail="No profile found for this account")

    tickets = (
        service_client.table("tickets")
        .select("*, assigned:profiles!assigned_staff_id(id,name)")
        .eq("organization_id", profile["organization_id"])
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )

    if profile["role"] == "student":
        return [ticket for ticket in tickets if ticket.get("submitted_by") == user.id]
    elif profile["role"] == "staff":
        department = profile.get("department") or ""
        return [
            ticket
            for ticket in tickets
            if ticket.get("department") == department or ticket.get("assigned_staff_id") == user.id
        ]

    return tickets


@app.post("/tickets", status_code=201)
async def create_ticket(
    authorization: Optional[str] = Header(None),
    studentName: str = Form(...),
    studentId: str = Form(...),
    title: str = Form(""),
    description: str = Form(...),
    category: str = Form("General"),
    file: Optional[UploadFile] = File(None),
):
    access_token, user = verify_caller(authorization)
    client = get_user_scoped_client(access_token)

    profile = client.table("profiles").select("organization_id, name").eq("id", user.id).single().execute().data
    if not profile:
        raise HTTPException(status_code=403, detail="No profile found for this account")
    organization_id = profile["organization_id"]

    ticket_id = str(uuid.uuid4())
    attachment_path = None
    attachment_url = None

    if file and file.filename:
        safe_name = Path(file.filename).name
        storage_path = f"{organization_id}/{ticket_id}/{safe_name}"
        file_bytes = await file.read()
        client.storage.from_("attachments").upload(
            storage_path,
            file_bytes,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )
        attachment_path = storage_path
        signed = client.storage.from_("attachments").create_signed_url(storage_path, 300)
        attachment_url = signed.get("signedURL") or signed.get("signed_url")

    final_title = title.strip() or derive_title(description)
    department_names = get_department_names(client, organization_id)

    try:
        classification = classify_ticket_with_ai(
            {
                "studentName": studentName,
                "title": final_title,
                "description": description,
                "category": category,
                "attachmentUrl": attachment_url,
            },
            department_names,
        )
    except ClassificationError as exc:
        if attachment_path:
            client.storage.from_("attachments").remove([attachment_path])
        raise HTTPException(status_code=502, detail=f"Could not classify complaint: {exc}")

    ticket = {
        "id": ticket_id,
        "organization_id": organization_id,
        "student_name": studentName,
        "student_id": studentId,
        "title": final_title,
        "description": description,
        "category": category,
        "department": classification["department"],
        "priority": classification["priority"],
        "predicted_department": classification["department"],
        "predicted_priority": classification["priority"],
        "classification_source": classification["source"],
        "classification_confidence": classification.get("confidence"),
        "status": "New",
        "submitted_by": user.id,
        "attachment_path": attachment_path,
    }

    inserted = client.table("tickets").insert(ticket).execute()
    if not inserted.data:
        raise HTTPException(status_code=500, detail="Ticket insert failed")
   
    created_ticket = inserted.data[0]

    # Organization ka readable name hasil karein
    organization_name = str(organization_id)

    try:
        organization_result = (
            client.table("organizations")
            .select("name")
            .eq("id", organization_id)
            .single()
            .execute()
        )

        if organization_result.data:
            organization_name = organization_result.data.get(
                "name",
                organization_name,
            )
    except Exception as exc:
        logger.warning(
            "Could not load organization name for email notification: %s",
            exc,
        )

    # Ticket creation fail na ho agar n8n/email temporarily unavailable ho
    email_webhook_url = os.getenv(
        "N8N_EMAIL_WEBHOOK_URL",
        "",
    ).strip()

    if email_webhook_url:
        notification_payload = {
            "ticket_id": created_ticket.get("id"),
            "title": created_ticket.get("title"),
            "description": created_ticket.get("description"),
            "category": created_ticket.get("category"),
            "department": created_ticket.get("department"),
            "priority": created_ticket.get("priority"),
            "student_name": created_ticket.get("student_name"),
            "student_email": getattr(user, "email", "") or "",
            "organization_name": organization_name,
            "classification_source": created_ticket.get(
                "classification_source"
            ),
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as email_client:
                email_response = await email_client.post(
                    email_webhook_url,
                    json=notification_payload,
                )
                email_response.raise_for_status()

            logger.info(
                "Department email notification sent for ticket %s",
                created_ticket.get("id"),
            )
        except Exception as exc:
            logger.warning(
                "Department email notification failed for ticket %s: %s",
                created_ticket.get("id"),
                exc,
            )
    else:
        logger.warning(
            "N8N_EMAIL_WEBHOOK_URL is not configured; email skipped"
        )

    return created_ticket

@app.post("/admin/staff-invite", status_code=201)
async def invite_staff(payload: StaffInvitePayload, authorization: Optional[str] = Header(None)):
    if payload.role not in {"student", "staff", "admin"}:
        raise HTTPException(status_code=400, detail="role must be 'student', 'staff', or 'admin'")

    access_token, user = verify_caller(authorization)
    caller_client = get_user_scoped_client(access_token)

    caller_profile = (
        caller_client.table("profiles").select("organization_id, role").eq("id", user.id).single().execute().data
    )
    if not caller_profile or caller_profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create staff or student accounts")

    organization_id = caller_profile["organization_id"]
    invite_email = payload.email.strip().lower()
    if not invite_email:
        raise HTTPException(status_code=400, detail="Email is required")
    department = None

    if payload.role == "staff":
        department = (payload.department or "").strip()
        if not department:
            raise HTTPException(status_code=400, detail="Staff must be invited into a department")
        valid_departments = get_department_names(caller_client, organization_id)
        if department not in valid_departments:
            raise HTTPException(
                status_code=400,
                detail=f"'{department}' is not one of this organization's departments: {', '.join(valid_departments)}",
            )

    roll_number = None
    academic_department = None
    batch = None
    if payload.role == "student":
        roll_number = (payload.roll_number or "").strip()
        academic_department = (payload.academic_department or "").strip()
        batch = (payload.batch or "").strip()
        if not roll_number or not academic_department or not batch:
            raise HTTPException(status_code=400, detail="Students need roll number, department, and batch")

        academic_departments = caller_client.table("academic_departments").select("name").eq(
            "organization_id", organization_id
        ).execute()
        valid_academic_departments = [
            row["name"] for row in (academic_departments.data or []) if row.get("name")
        ]
        if academic_department not in valid_academic_departments:
            raise HTTPException(
                status_code=400,
                detail=f"'{academic_department}' is not one of this organization's academic departments.",
            )

        batches = caller_client.table("batches").select("name").eq("organization_id", organization_id).execute()
        valid_batches = [row["name"] for row in (batches.data or []) if row.get("name")]
        if batch not in valid_batches:
            raise HTTPException(status_code=400, detail=f"'{batch}' is not one of this organization's batches.")

    service_client = get_service_role_client()
    temporary_password = (payload.temporary_password or "").strip() or generate_temporary_password()
    if len(temporary_password) < 6:
        raise HTTPException(status_code=400, detail="Temporary password must be at least 6 characters")
    try:
        service_client.table("pending_invites").upsert(
            {
                "email": invite_email,
                "organization_id": organization_id,
                "role": payload.role,
                "department": department if payload.role == "staff" else None,
                "invited_by": user.id,
            }
        ).execute()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not prepare account invite: {exc}")

    auth_user_id = None
    created_new_auth_user = False
    try:
        created_user = service_client.auth.admin.create_user(
            {
                "email": invite_email,
                "password": temporary_password,
                "email_confirm": True,
                "user_metadata": {"name": payload.name or invite_email.split("@")[0]},
            }
        )
        auth_user_id = created_user.user.id
        created_new_auth_user = True
    except Exception as exc:
        message = str(exc)
        if "already registered" in message.lower() or "already been registered" in message.lower():
            auth_user_id = find_auth_user_id_by_email(service_client, invite_email)
            if not auth_user_id:
                raise HTTPException(status_code=409, detail="An account already exists for this email.")
            service_client.auth.admin.update_user_by_id(
                auth_user_id,
                {"password": temporary_password, "email_confirm": True, "user_metadata": {"name": payload.name or invite_email.split("@")[0]}},
            )
        else:
            raise HTTPException(status_code=502, detail=f"Could not create account: {message}")

    try:
        service_client.table("profiles").upsert(
            {
                "id": auth_user_id,
                "organization_id": organization_id,
                "name": payload.name or invite_email.split("@")[0],
                "email": invite_email,
                "role": payload.role,
                "department": department if payload.role == "staff" else None,
                "roll_number": roll_number,
                "academic_department": academic_department,
                "batch": batch,
            }
        ).execute()
        service_client.table("pending_invites").delete().eq("email", invite_email).execute()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not save account profile: {exc}")

    return {
        "created": True,
        "email": invite_email,
        "temporaryPassword": temporary_password,
        "role": payload.role,
        "existingUser": not created_new_auth_user,
    }


@app.delete("/admin/accounts/{profile_id}")
async def delete_account(profile_id: str, authorization: Optional[str] = Header(None)):
    access_token, user = verify_caller(authorization)
    if profile_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot remove your own admin account")

    caller_client = get_user_scoped_client(access_token)
    caller_profile = (
        caller_client.table("profiles").select("organization_id, role").eq("id", user.id).single().execute().data
    )
    if not caller_profile or caller_profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can remove accounts")

    organization_id = caller_profile["organization_id"]
    service_client = get_service_role_client()
    target = (
        service_client.table("profiles")
        .select("id, email, role, organization_id")
        .eq("id", profile_id)
        .single()
        .execute()
        .data
    )
    if not target or target.get("organization_id") != organization_id:
        raise HTTPException(status_code=404, detail="Account not found in this organization")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Admin accounts cannot be removed from this screen")

    service_client.table("tickets").update({"assigned_staff_id": None}).eq("assigned_staff_id", profile_id).execute()
    service_client.table("tickets").update({"submitted_by": None}).eq("submitted_by", profile_id).execute()
    service_client.table("profiles").delete().eq("id", profile_id).execute()
    service_client.auth.admin.delete_user(profile_id)

    return {"removed": True, "email": target.get("email"), "role": target.get("role")}
