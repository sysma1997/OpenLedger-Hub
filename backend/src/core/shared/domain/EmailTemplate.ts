const FRONTEND_URL = (process.env.FRONTEND_URL) ?
    process.env.FRONTEND_URL : "http://localhost:8000";

export class EmailTemplates {
    private static Style = `* {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.5;
        color: #1e293b;
        background-color: #f1f5f9;
        margin: 0;
        padding: 20px 16px;
    }
    .container {
        max-width: 520px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 20px;
        padding: 28px 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    h1 {
        font-size: 26px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 8px;
        line-height: 1.3;
    }
    .greeting {
        font-size: 18px;
        color: #334155;
        margin-bottom: 20px;
        border-left: 3px solid #151b22;
        padding-left: 14px;
    }
    p {
        font-size: 15px;
        color: #334155;
        margin-bottom: 20px;
    }
    .btn {
        display: inline-block;
        background: #00d1b2;
        color: white !important;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        margin: 8px 0 20px;
        text-align: center;
        transition: background 0.2s;
    }
    .btn:hover {
        background: #1a9e8a;
    }
    .link-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px;
        margin: 16px 0;
        word-break: break-all;
    }
    .link-box strong {
        font-size: 13px;
        color: #475569;
        display: block;
        margin-bottom: 8px;
    }
    .link-box a {
        color: #06816f;
        text-decoration: none;
        font-size: 13px;
        word-break: break-all;
    }
    .warning {
        background: #fffbeb;
        border-left: 4px solid #f59e0b;
        padding: 14px;
        border-radius: 10px;
        font-size: 13px;
        color: #92400e;
        margin: 20px 0;
    }
    hr {
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 24px 0 16px;
    }
    .footer {
        font-size: 12px;
        color: #64748b;
        text-align: center;
        line-height: 1.5;
    }
    .footer p {
        margin-bottom: 6px;
        font-size: 12px;
    }
    @media (max-width: 480px) {
        body {
            padding: 12px;
        }
        .container {
            padding: 20px;
        }
        h1 {
            font-size: 22px;
        }
        .greeting {
            font-size: 16px;
        }
        p, .btn {
            font-size: 14px;
        }
        .btn {
            padding: 12px 24px;
            width: 100%;
            text-align: center;
        }
        .link-box {
            padding: 12px;
        }
        .link-box a {
            font-size: 12px;
        }
    }`;

    static VerificationEmail(name: string, link: string): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
                    <title>Confirm your account - OpenLedger Hub</title>
                    <style>${this.Style}</style>
                </head>
                <body>
                <div class="container">
                    <h1>Welcome to OpenLedger Hub</h1>
                    <div class="greeting">👋 Hi ${name}!</div>
                    <p>Thanks for signing up. Please confirm your email address to start managing your finances.</p>
                    <div style="text-align: center;">
                        <a href="${link}" class="btn">Confirm my account</a>
                    </div>
                    <div class="link-box">
                        <strong>🔗 Or copy this link:</strong>
                        <a href="${link}">${link}</a>
                    </div>
                    <div class="warning">⚠️ <strong>Security notice:</strong> This link expires in 24 hours.</div>
                    <hr>
                    <div class="footer">
                        <p>OpenLedger Hub — Your personal finance control</p>
                        <p style="margin-top: 8px;">If you didn't create an account, you can safely ignore this email.</p>
                    </div>
                </div>
                </body>
            </html>`;
    }
    static WelcomeEmail(name: string): string {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reset password - OpenLedger Hub</title>
                    <style>${this.Style}</style>
                </head>
                <body>
                <div class="container">
                    <h1>Welcome to OpenLedger Hub</h1>
                    <div class="greeting">👋 Hi ${name}!</div>
                    <p>Your OpenLedger Hub account has been successfully verified.</p>
                    <p>Now you can start to:</p>
                    <ul style="margin: 16px; list-style: none;">
                        <li>📝 Track your income and expenses</li>
                        <li>📊 View your financial statistics</li>
                        <li>🏦 Manage multiple accounts</li>
                        <li>📤 Export your data to CSV</li>
                    </ul>
                    <div style="text-align: center;">
                        <a href="${FRONTEND_URL}" class="btn">Go to dashboard</a>
                    </div>
                    <hr>
                    <div class="footer">
                        <p>OpenLedger Hub — Your personal finance control</p>
                        <p style="margin-top: 8px;">If you didn't create an account, you can safely ignore this email.</p>
                    </div>
                </div>
                </body>
            </html>`;
    }
    static PasswordRecoveryEmail(name: string, link: string): string {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reset password - OpenLedger Hub</title>
                    <style>${this.Style}</style>
                </head>
                <body>
                <div class="container">
                    <h1>Reset your password</h1>
                    <div class="greeting">🔐 Hi ${name}!</div>
                    <p>We received a request to reset your password. Click the button below to create a new one.</p>
                    <div style="text-align: center;">
                        <a href="${link}" class="btn">Reset password</a>
                    </div>
                    <div class="link-box">
                        <strong>🔗 Or copy this link:</strong>
                        <a href="${link}">${link}</a>
                    </div>
                    <div class="warning">⚠️ This link expires in 1 hour for security.</div>
                    <hr>
                    <div class="footer">
                        <p>If you didn't request this, ignore this email. Your password will remain unchanged.</p>
                        <p style="margin-top: 8px;">OpenLedger Hub — Your personal finance control</p>
                    </div>
                </div>
                </body>
            </html>`;
    }
    static TwoFactorCodeEmail(name: string, code: string): string {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>2FA Code - OpenLedger Hub</title>
                    <style>
                        ${this.Style}
                        .code-box {
                            background: #f1f5f9;
                            font-size: 28px;
                            letter-spacing: 4px;
                            font-weight: 700;
                            text-align: center;
                            padding: 20px;
                            border-radius: 14px;
                            font-family: monospace;
                            margin: 20px 0;
                            color: #0f172a;
                            border: 1px solid #e2e8f0;
                        }
                        @media (max-width: 480px) {
                            .code-box {
                                font-size: 22px;
                                letter-spacing: 3px;
                                padding: 16px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Verification Code</h1>
                        <div class="greeting">🔑 Hi ${name}!</div>
                        <p>Use the code below to complete your login. This code is valid for 10 minutes.</p>
                        <div class="code-box">${code}</div>
                        <div class="warning">🔒 <strong>Security notice:</strong> If you didn't try to log in, change your password immediately.</div>
                        <hr>
                        <div class="footer">
                            <p>Never share this code with anyone.</p>
                            <p style="margin-top: 8px;">OpenLedger Hub — Your personal finance control</p>
                        </div>
                    </div>
                </body>
            </html>`;
    }
}