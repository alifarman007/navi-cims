"""Minimal async email sender. Logs the mail when SMTP is not configured (dev)."""

from __future__ import annotations

import logging
from email.message import EmailMessage

from app.core.config import settings

log = logging.getLogger("cims.email")


async def send_email(*, to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        log.info("[email not configured] To: %s | Subject: %s\n%s", to, subject, body)
        return
    import aiosmtplib

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER or None,
        password=settings.SMTP_PASSWORD or None,
        start_tls=settings.SMTP_TLS,
    )
