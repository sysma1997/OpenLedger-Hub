import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import multer from "multer";

import { ControllerBase } from "./core/shared/infrastructure/ControllerBase";

import { UserRepository } from "./core/user/domain/UserRepository";
import { UserPrismaRepository } from "./core/user/infrastructure/UserPrismaRepository";
import { UserController } from "./core/user/infrastructure/UserController";
import { TransactionRepository } from "./core/transaction/domain/TransactionRepository";
import { TransactionPrismaRepository } from "./core/transaction/infrastructure/TransactionPrismaRepository";
import { TransactionService } from "./core/transaction/application/TransactionService";
import { TransactionController } from "./core/transaction/infrastructure/TransactionController";
import { AccountRepository } from "./core/account/domain/AccountRepository";
import { AccountPrismaRepository } from "./core/account/infrastructure/AccountPrismaRepository";
import { AccountController } from "./core/account/infrastructure/AccountController";
import { CategoryRepository } from "./core/category/domain/CategoryRepository";
import { CategoryPrismaRepository } from "./core/category/infrastructure/CategoryPrismaRepository";
import { CategoryController } from "./core/category/infrastructure/CategoryController";

const PORT = process.env.PORT;
const FRONTEND_URL = (process.env.FRONTEND_URL) ? 
    process.env.FRONTEND_URL : "http://localhost:8000";

dayjs.extend(dayjsUtc);

const allowedOrigins = [
    "http://localhost:5678",
    FRONTEND_URL,
];

const corsOptions = {
    origin: (origin: any, callback: any) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) 
            callback(null, true);
        else callback(new Error("Not allowed by CORS"));
    },
    credentials: true, 
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

const app = express();
const prisma = new PrismaClient();

const userRepository: UserRepository = new UserPrismaRepository(prisma);
const userController: ControllerBase = new UserController(userRepository);
const transactionRepository: TransactionRepository = new TransactionPrismaRepository(prisma);
const accountRepository: AccountRepository = new AccountPrismaRepository(prisma);
const accountController: ControllerBase = new AccountController(accountRepository);
const categoryRepository: CategoryRepository = new CategoryPrismaRepository(prisma);
const categoryController: ControllerBase = new CategoryController(categoryRepository);
const transactionService: TransactionService = new TransactionService(transactionRepository, accountRepository, categoryRepository);
const transactionController: ControllerBase = new TransactionController(transactionRepository, transactionService);

userController.setup();
transactionController.setup();
accountController.setup();
categoryController.setup();

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (_, res) => {
    res.send("OpenLedger Hub Api: v1.0.0");
});

app.use("/api/user", userController.getRouter());
app.use("/api/transaction", transactionController.getRouter());
app.use("/api/account", accountController.getRouter());
app.use("/api/category", categoryController.getRouter());

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") 
            return res.status(400).send("The file is too large, the limit is 5 MB.");
    }

    next(err);
});

app.listen(PORT, () => {
    console.log(`Listen to port: ${PORT}`);
    console.log(`CORS Allowed Origins: ${allowedOrigins.join(", ")}`);
});