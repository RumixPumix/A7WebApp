import uuid
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class EmailVerificationSystem:
    def __init__(self):
        self.smtp_server = 'smtp.zoho.eu'
        self.smtp_port = 587
        self.sender_email = os.getenv('SMTP_USERNAME')
        self.sender_password = os.getenv('SMTP_PASSWORD')

    def send_verification_email(self, recipient_email, verification_link):
        """Send verification email with generated link"""
        
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as smtp:
                smtp.ehlo()
                smtp.starttls()
                smtp.login(self.sender_email, self.sender_password)
                
                msg = self._create_email_message(recipient_email, verification_link)
                smtp.sendmail(self.sender_email, recipient_email, msg.as_string())
                
            return True
        except Exception as e:
            print(f"Failed to send verification email: {e}")
            return None

    def _create_email_message(self, recipient_email, verification_link):
        """Create HTML email message with verification code"""
        msg = MIMEMultipart()
        msg['Subject'] = 'Verify your email address'
        msg['From'] = f'Ace7Esports <{self.sender_email}>'
        msg['To'] = recipient_email
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ 
                    font-family: 'Helvetica Neue', Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 0;
                }}
                .container {{
                    padding: 25px;
                }}
                .header {{ 
                    font-size: 24px; 
                    color: #000000; 
                    margin-bottom: 20px; 
                    font-weight: 500; 
                }}
                .verify-button {{
                    display: inline-block;
                    background-color: #3366cc;
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 12px 24px;
                    margin: 20px 0;
                    border-radius: 4px;
                    font-weight: 500;
                    text-align: center;
                }}
                .verify-button:hover {{
                    background-color: #2a56b0;
                }}
                .footer {{ 
                    font-size: 12px; 
                    color: #999999; 
                    margin-top: 30px; 
                    border-top: 1px solid #eeeeee; 
                    padding-top: 20px; 
                }}
                a {{ 
                    color: #3366cc; 
                    text-decoration: none; 
                }}
                .small-text {{
                    font-size: 14px;
                    color: #666666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Ace7Esports</div>
                <p>Hello,</p>
                <p>To complete your registration, please click the button below:</p>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{verification_link}" class="verify-button">Verify My Account</a>
                </div>
                
                <p class="small-text">Or copy and paste this link into your browser:<br>
                <a href="{verification_link}">{verification_link}</a></p>
                
                <p>This link will expire in {self.code_expiry_minutes} minutes. Please do not share it with anyone.</p>
                
                <p>If you didn't request this verification, please ignore this email or contact our support team.</p>
                
                <p>Best regards,<br>
                <strong>The Ace7Esports Team</strong></p>
                
                <div class="footer">
                    © 2024 Ace7Esports. All rights reserved.<br>
                    <a href="https://ace7esports.com">ace7esports.com</a> | 
                    <a href="https://ace7esports.com/privacy">Privacy Policy</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_content, 'html'))
        return msg

# Example usage
if __name__ == "__main__":
    email_system = EmailVerificationSystem()
    recipient = 'filip.horvatinovic@gmail.com'
    verification_code = str(uuid.uuid4())  # Generate a unique verification code
    email_system.code_expiry_minutes = 10  # Set expiration time in minutes
    verification_link = f'https://www.ace7esports.com/verify/{verification_code}'  # Example link
    
    # Send verification email
    sent_code = email_system.send_verification_email(recipient, verification_link)
    if sent_code:
        print(f"Verification code sent to {recipient}")
    else:
        print("Failed to send verification email")