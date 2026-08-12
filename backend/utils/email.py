"""
Sends OTP/credential emails over SMTP (Gmail app password, per .env). When
EMAIL_DEV_MODE=true (the default until real SMTP creds are set), nothing is
sent over the network — the message is written to the app log instead, so
the signup flow can be exercised end-to-end with no email account configured.
"""
import smtplib
from email.mime.text import MIMEText

import config
from utils.logger import get_logger

logger = get_logger("email")


def send_email(to: str, subject: str, body: str) -> None:
    if config.EMAIL_DEV_MODE:
        logger.info("EMAIL_DEV_MODE — not sending. to=%s subject=%r\n%s", to, subject, body)
        return

    if not config.EMAIL_SMTP_USER or not config.EMAIL_SMTP_PASSWORD:
        raise RuntimeError(
            "EMAIL_DEV_MODE is false but EMAIL_SMTP_USER/EMAIL_SMTP_PASSWORD are not set."
        )

    host, _, port = config.EMAIL_SMTP_URL.partition(":")
    port = int(port) if port else 587

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = f"{config.EMAIL_FROM_NAME} <{config.EMAIL_FROM}>"
    msg["To"] = to

    with smtplib.SMTP(host, port, timeout=10) as server:
        server.starttls()
        server.login(config.EMAIL_SMTP_USER, config.EMAIL_SMTP_PASSWORD)
        server.sendmail(config.EMAIL_FROM, [to], msg.as_string())

    logger.info("email sent to=%s subject=%r", to, subject)


def send_otp_email(to: str, otp_code: str) -> None:
    send_email(
        to,
        "Your CyberCarnival verification code",
        f"Your CyberCarnival OTP is: {otp_code}\n\n"
        f"It expires in {config.OTP_TTL_SECONDS // 60} minutes. "
        "If you didn't request this, you can ignore this email.",
    )


def send_credentials_email(to: str, token: str, username: str, temp_password: str) -> None:
    send_email(
        to,
        "Your CyberCarnival account is ready",
        "You're verified! Here are your CyberCarnival credentials:\n\n"
        f"CyberCarnival Token: {token}\n"
        f"Username: {username}\n"
        f"Temporary password: {temp_password}\n\n"
        "Share your token with teammates so they can add you to their team when "
        "registering for an event. You'll be asked to set a new password on first login.",
    )
