import base64, hashlib, hmac, json, os, time
from fastapi import Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from . import config, db

bearer = HTTPBearer(auto_error=False)

def hash_pin(pin: str, salt: str | None = None) -> str:
    salt = salt or os.urandom(8).hex()
    h = hashlib.pbkdf2_hmac("sha256", pin.encode(), salt.encode(), 50_000).hex()
    return f"{salt}${h}"

def verify_pin(pin: str, stored: str) -> bool:
    salt, h = stored.split("$")
    return hmac.compare_digest(hash_pin(pin, salt).split("$")[1], h)

def make_token(user_id: int, role: str, ttl: int = 12 * 3600) -> str:
    payload = base64.urlsafe_b64encode(json.dumps({"uid": user_id, "role": role, "exp": int(time.time()) + ttl}).encode()).decode()
    sig = hmac.new(config.secret().encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"

def parse_token(token: str) -> dict:
    try:
        payload, sig = token.rsplit(".", 1)
        good = hmac.new(config.secret().encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, good):
            raise ValueError("bad signature")
        data = json.loads(base64.urlsafe_b64decode(payload.encode()))
        if data["exp"] < time.time():
            raise ValueError("expired")
        return data
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

def current_user(cred: HTTPAuthorizationCredentials | None = Depends(bearer), token: str | None = Query(None)) -> dict:
    raw = cred.credentials if cred else token
    if not raw:
        raise HTTPException(401, "Login required")
    data = parse_token(raw)
    if data.get("role") == "student":
        with db.conn() as c:
            row = c.execute("SELECT id, school_id, label AS username, 'student' AS role, teacher_id, current_reading_level AS level FROM children WHERE id=?", (data["uid"],)).fetchone()
        if row is None:
            raise HTTPException(401, "Student not found")
        return dict(row)
    with db.conn() as c:
        row = c.execute("SELECT id, school_id, username, role FROM users WHERE id=?", (data["uid"],)).fetchone()
    if row is None:
        raise HTTPException(401, "User not found")
    return dict(row)

def require(*roles: str):
    def dep(user: dict = Depends(current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(403, f"Allowed roles: {', '.join(roles)}")
        return user
    return dep
