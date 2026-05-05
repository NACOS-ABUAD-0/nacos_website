import os
from dotenv import load_dotenv
from pathlib import Path
import smtplib

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "").strip()

print(f"User: {EMAIL_HOST_USER}")
print(f"Password length: {len(EMAIL_HOST_PASSWORD)}")

try:
    server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
    server.starttls()
    server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
    print("✅ LOGIN SUCCESSFUL!")
    server.quit()
except Exception as e:
    print(f"❌ FAILED: {e}")