import { v4 as Uuid } from "uuid";
import path from "path";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import "dayjs/plugin/utc";

import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { User } from "../domain/User";
import type { UserConfig } from "../domain/User";
import { UserRepository } from "../domain/UserRepository";
import { UserAuthenticate } from "./UserAuthenticate";
import { FileStorage } from "../../shared/infrastructure/FileStorage";

const transporter = nodemailer.createTransport({
    host: "mailpit", 
    port: 1025, 
    secure: false,
    tls: { rejectUnauthorized: false }
});

export class UserController extends ControllerBase {
    private readonly repository: UserRepository;

    private static CodesVerifications: Map<string, {
        code: number, 
        expires: number
    }> = new Map();

    constructor(repository: UserRepository) {
        super();
        this.repository = repository;
    }

    private cleanExpiresCodesVerificatons() {
        const now: number = new Date().getTime();

        for (const [id, code] of UserController.CodesVerifications.entries()) {
            if (now > code.expires) 
                UserController.CodesVerifications.delete(id);
        }
    }
    private generateCodeVerification(id: string): number {
        UserController.CodesVerifications.delete(id);

        const code = Math.floor(100000 + Math.random() * 900000);
        UserController.CodesVerifications.set(id, {
            code: code, 
            expires: dayjs.utc().add(10, "minutes").toDate().getTime()
        });

        return code;
    }
    private validateCodeVerification(id: string, code: number): boolean {
        this.cleanExpiresCodesVerificatons();
        const item = UserController.CodesVerifications.get(id);
        if (!item) throw new Error("Verification code not found or not exists.");
        if (code !== item.code) 
            throw new Error("The code entered does not match the verification code.");

        UserController.CodesVerifications.delete(id);
        return true;
    }

    setup() {
        this.router.post("/register", async (req, res) => {
            if (!req.body.name || 
                !req.body.email || 
                !req.body.password) {
                let message = "";
                let lineBreak = 0;

                if (!req.body.name) {
                    message += "Name is required.";
                    lineBreak++;
                }
                if (!req.body.email) message += ((lineBreak++ > 0) ? "\n" : "") + 
                    "Email is required.";
                if (!req.body.password) message += ((lineBreak > 0) ? "\n" : "") + 
                    "Password is required.";
                
                return res.status(400).send(message);
            }

            const { name, email, password, id } = req.body;

            try {
                const user = new User(name, email, password, dayjs.utc().toDate(), id ?? Uuid());
                const jwtParams: any = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                };
                const token = jwt.sign(jwtParams, process.env.JWT_SECRET!, {
                    expiresIn: "1d"
                });
                await transporter.sendMail({
                    from: "no-reply@sysmafinances.com", 
                    to: email, 
                    subject: "Sysma Finances - Confirm your registeration", 
                    html: `Please confirm your user account by clicking on the following <a href="` + 
                        `http://localhost:8000/validation?token=${token}` + 
                        `">link</a>.`,
                });

                res.send(`We have sent an email to ${email} to confirm your registration.`);
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/validate/:token", async (req, res) => {
            const { token } = req.params;
            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
                const user = new User(payload.name, payload.email, payload.password, dayjs.utc().toDate());
                
                await this.repository.register(user);
                res.status(201).send("User register success.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.post("/login", async (req, res) => {
            const { email, password, code } = req.body;

            if (!email || !password) {
                let message = "";
                let lineBreak = 0;

                if (!email) {
                    message += "Email is required.";
                    lineBreak++;
                }
                if (!password) message += ((lineBreak > 0) ? "\n" : "") + 
                    "Password is required.";

                return res.status(400).send(message);
            }
            if (!User.IsValidEmail(email)) 
                return res.status(400).send(`The '${email}' is not a valid email.`);

            try {
                const user: User = await this.repository.login(email, password);

                if (!code && user.config && user.config.twoStep && user.config.twoStep.active) {
                    if (user.config.twoStep.type === "Email") {
                        const codeV = this.generateCodeVerification(user.id!);
    
                        await transporter.sendMail({
                            from: "no-reply@sysmafinances.com", 
                            to: email, 
                            subject: "Sysma Finances - Two step", 
                            html: "Ingress the next code for login: </br>" + 
                                `<h2><b>${codeV}</b></h2>` + "</br>" + 
                                "The code has 10 minutes to expired.",
                        });
                        return res.json({ 
                            token: undefined, 
                            message: `We have sent an email to ${email} to update to your new email address.` 
                        });
                    }
                }
                else if (user.config && user.config.twoStep && user.config.twoStep.active) 
                    this.validateCodeVerification(user.id!, code);
    
                const jwtParams: any = {
                    id: user.id, 
                    expiresToken: dayjs.utc().add(7, "days").toDate().toString()
                };
                const token = jwt.sign(
                    jwtParams, 
                    process.env.JWT_SECRET!, {
                    expiresIn: "7d"
                });
    
                res.json({ token });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/recover/password/:email", async (req, res) => {
            const { email } = req.params;
            
            if (!User.IsValidEmail(email)) 
                return res.status(400).send(`The '${email}' is not a valid email.`);

            try {
                const user: User | undefined = await this.repository.getWithEmail(email);
                if (!user) 
                    return res.status(400).send(`The user with the email '${email}' doesn't exist.`);

                const token = jwt.sign({ 
                    id: user.id 
                    }, process.env.JWT_SECRET!, {
                        expiresIn: "1d"
                    });
                
                await transporter.sendMail({
                    from: "no-reply@sysmafinances.com", 
                    to: email, 
                    subject: "Sysma Finances - Recover your user", 
                    html: `To recover your username, click on the following <a href="` + 
                        `http://localhost:8000/recover?token=${token}` + 
                        `">link</a>.`,
                });
                res.send(`We have sent an email to ${email} to recover your user.`);
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/recover/password", async (req, res) => {
            const { token, password } = req.body;

            if (!token || !password) {
                let message = "";
                let lineBreak = 0;

                if (!token) {
                    message += "Token is required.";
                    lineBreak++;
                }
                if (!password) message += ((lineBreak > 0) ? "\n" : "") + 
                    "Password is required.";

                return res.status(400).send(message);
            }

            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
                const id: string = payload.id;
                
                await this.repository.recoverPassword(id, password);
                res.status(201).send("User updating password success.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/request/update/email/:email", UserAuthenticate, async (req, res) => {
            const { pEmail } = req.params;
            const email: string = this.getQueryString(pEmail);
            if (!email) 
                return res.status(400).send("The email is required.");
            if (!User.IsValidEmail(email)) 
                return res.status(400).send(`The email '${email}' is not valid.`);

            try {
                const code = this.generateCodeVerification(req.user!.id);

                await transporter.sendMail({
                    from: "no-reply@sysmafinances.com", 
                    to: email, 
                    subject: "Sysma Finances - Updating email", 
                    html: "Ingress the next code for update your email: </br>" + 
                        `<h2><b>${code}</b></h2>` + "</br>" + 
                        "The code has 10 minutes to expired.",
                });
                res.send(`We have sent an email to ${email} to update to your new email address.`);
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.put("/update/profile", UserAuthenticate, FileStorage.single("image"), async (req, res) => {
            try {
                if (!req.file) return res.status(400).send("The image file is required.");

                const ext = path.extname(req.file!.originalname).toLocaleLowerCase();
                const filePath = `/uploads/${req.user!.id}/profile${ext}`;
                await this.repository.updateProfile(req.user!.id, filePath);

                res.status(201).send(filePath);
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/name", UserAuthenticate, async (req, res) => {
            const { name } = req.body;
            if (!name) res.status(400).send("Name is required");

            try {
                await this.repository.updateName(req.user!.id, name);
                res.status(201).send("User updating name successful.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/email", UserAuthenticate, async (req, res) => {
            const { email, code } = req.body;
            if (!email || !code) {
                let message = "";
                let lineBreak = 0;

                if (!email) {
                    message += "The email is required.";
                    lineBreak++;
                }
                if (!code) message += ((lineBreak > 0) ? "\n" : "") + 
                    "The code verification is required."
                
                return res.status(400).send(message);
            }
            if (!User.IsValidEmail(email)) return res.status(400).send(`The '${email}' is not valid email.`);
            if (code.toString().length !== 6) return res.status(400).send("The code does not have 6 digits.");
            
            try {
                this.validateCodeVerification(req.user!.id, code);
                await this.repository.updateEmail(req.user!.id, email);

                res.status(201).send("Email update successful.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/password", UserAuthenticate, async (req, res) => {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                let message = "";
                let lineBreak = 0;

                if (!currentPassword) {
                    message += "The current password is required.";
                    lineBreak++;
                }
                if (!newPassword) message += ((lineBreak > 0) ? "\n" : "") + 
                    "The new password is required.";

                return res.status(400).send(message);
            }

            try {
                await this.repository.updatePassword(req.user!.id, currentPassword, newPassword);

                res.status(201).send("Password update successful.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/two-step", UserAuthenticate, async (req, res) => {
            const { active, type } = req.body;
            if ((active === undefined || active === null) || !type) {
                let message = "";
                let lineBreak = 0;

                if (active === undefined || active === null) {
                    message += "Active is required.";
                    lineBreak++;
                }
                if (!type) message += ((lineBreak > 0) ? "\n" : "") + 
                    "The type is required.";

                return res.status(400).send(message);
            }

            try {
                const config: UserConfig = {
                    twoStep: {
                        active: active, 
                        type: type
                    }
                };
                await this.repository.updateTwoStep(req.user!.id, config);

                res.status(201).send("Two step update successful.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/", UserAuthenticate, async (req, res) => {
            const expireIn = dayjs.utc(req.user!.expiresToken);
            const current = dayjs.utc();
            const diff = expireIn.diff(current, "days");
            
            const user: User = await this.repository.get(req.user!.id);
            if (!user) throw new Error("Error to get current user.");

            let token: string | undefined = undefined;
            if (diff <= 3) {
                const jwtParams: any = {
                    id: user.id, 
                    expiresToken: dayjs.utc().add(7, "days").toDate().toString()
                };
                token = jwt.sign(
                    jwtParams, 
                    process.env.JWT_SECRET!, {
                    expiresIn: "7d"
                });
            }
            
            const result: any = user.toDto();
            if (token) result.newToken = token;
            res.json(result);
        });
    }
}