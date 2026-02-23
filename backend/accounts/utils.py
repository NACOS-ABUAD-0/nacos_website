# backend/accounts/utils.py
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from .models import User


def generate_verification_token(user):
    """Generate a verification token for the user"""
    return default_token_generator.make_token(user)


def send_verification_email(user, request=None):
    """Send email verification email to user"""
    token = generate_verification_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Get frontend URL from settings or use default
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verification_url = f"{frontend_url}/verify-email/{uid}/{token}/"
    
    subject = "Verify your NACOS ABUAD account"
    message = f"""
Hello {user.full_name},

Thank you for registering with NACOS ABUAD!

Please verify your email address by clicking the link below:

{verification_url}

If you didn't create an account, please ignore this email.

Best regards,
NACOS ABUAD Team
"""
    
    # HTML version of the email
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .button:hover {{ background: #059669; }}
        .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to NACOS ABUAD!</h1>
        </div>
        <div class="content">
            <p>Hello {user.full_name},</p>
            <p>Thank you for registering with NACOS ABUAD!</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
                <a href="{verification_url}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #059669;">{verification_url}</p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>NACOS ABUAD Team</p>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nacosabuad.org'),
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def verify_email_token(uidb64, token):
    """Verify email token and activate user"""
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None
    
    if default_token_generator.check_token(user, token):
        user.is_email_verified = True
        user.save()
        return user
    return None

