import uuid
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv
import datetime

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
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email address</title>
            <style type="text/css">
                /* Base styles */
                body, html {{
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    background-color: #f7f7f7;
                }}
                
                /* Main container */
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 0;
                    background-color: #ffffff;
                }}
                
                /* Content container */
                .content {{
                    padding: 30px;
                }}
                
                /* Header */
                .header {{
                    font-size: 24px;
                    color: #000000;
                    margin-bottom: 25px;
                    font-weight: 600;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eeeeee;
                }}
                
                /* Button styles */
                .verify-button {{
                    display: block;
                    width: 200px;
                    background-color: #3366cc;
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 14px 0;
                    margin: 25px auto;
                    border-radius: 4px;
                    font-weight: 500;
                    text-align: center;
                    font-size: 16px;
                }}
                
                .verify-button:hover {{
                    background-color: #2a56b0;
                }}
                
                /* Footer */
                .footer {{
                    font-size: 12px;
                    color: #999999;
                    margin-top: 30px;
                    border-top: 1px solid #eeeeee;
                    padding-top: 20px;
                    text-align: center;
                }}
                
                /* Link styles */
                a {{
                    color: #3366cc;
                    text-decoration: none;
                }}
                
                .small-text {{
                    font-size: 14px;
                    color: #666666;
                    line-height: 1.5;
                }}
                
                .link-box {{
                    word-break: break-all;
                    padding: 10px;
                    background-color: #f5f5f5;
                    border-radius: 4px;
                    margin: 15px 0;
                }}
                
                /* Responsive adjustments */
                @media screen and (max-width: 480px) {{
                    .content {{
                        padding: 20px;
                    }}
                    
                    .header {{
                        font-size: 20px;
                    }}
                    
                    .verify-button {{
                        width: 100%;
                        box-sizing: border-box;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="content">
                    <div class="header">Ace7Esports</div>
                    
                    <p>Hello,</p>
                    
                    <p>Thank you for registering with Ace7Esports. To complete your registration, please verify your email address by clicking the button below:</p>
                    
                    <a href="{verification_link}" class="verify-button">Verify Email Address</a>
                    
                    <p class="small-text">If the button doesn't work, copy and paste this link into your browser:</p>
                    
                    <div class="small-text link-box">
                        <a href="{verification_link}">{verification_link}</a>
                    </div>
                    
                    <p class="small-text">This verification link will expire in {self.code_expiry_minutes} minutes. For your security, please do not share this link with anyone.</p>
                    
                    <p class="small-text">If you didn't request this verification, please ignore this email or contact our support team immediately.</p>
                    
                    <p>Best regards,<br>
                    <strong>The Ace7Esports Team</strong></p>
                    
                    <div class="footer">
                        © {datetime.datetime.utcnow().year} Ace7Esports. All rights reserved.<br>
                        <a href="https://ace7esports.com">ace7esports.com</a> | 
                        <a href="https://ace7esports.com/privacy">Privacy Policy</a> | 
                        <a href="https://ace7esports.com/contact">Contact Us</a>
                    </div>
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