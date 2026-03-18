import { Account, AccountDto } from "../domain/Account";
import { AccountRepository } from "../domain/AccountRepository";
import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { UserAuthenticate } from "../../user/infrastructure/UserAuthenticate";
import { Pagination } from "../../shared/domain/Pagination";

export class AccountController extends ControllerBase {
    private readonly repository: AccountRepository;

    constructor(repository: AccountRepository) {
        super();
        this.repository = repository;
    }

    setup(): void {
        this.router.post("/add", UserAuthenticate, async (req, res) => {
            if (!req.body.name) 
                return res.status(400).send("The name is required.");

            try {
                const idUser: string = req.user!.id;
                const name: string = req.body.name;
                const balance: number = req.body.balance ?? 0.0;
                const id: string | undefined = req.body.id ?? undefined;

                const account = new Account(name, balance, 
                    id, idUser);
                
                await this.repository.add(account);
                res.status(201).send("Account add success.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update", UserAuthenticate, async (req, res) => {
            if (!req.body.id || 
                !req.body.name) {
                let message = "";
                let lineBreak = 0;

                if (!req.body.id) {
                    message += "The id is required.";
                    lineBreak++;
                }
                if (!req.body.name) message += ((lineBreak++ > 0) ? "\n" : "") + 
                    "The name is required.";
                
                return res.status(400).send(message);
            }

            try {
                const idUser: string = req.user!.id;
                const id: string = req.body.id;
                const name: string = req.body.name;

                let account: Account = await this.repository.get(idUser, id);
                account = account.setName(name);
                    
                await this.repository.update(account);
                res.send("Account update success.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.delete("/delete/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                await this.repository.delete(idUser, id);
                res.send("Account delete success.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        
        this.router.get("/get/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                const account: Account = await this.repository.get(idUser, id);
                res.json(account.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/search/:name", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const name: string = this.getQueryString(req.params.name!);

                const account: Account | undefined = await this.repository.search(idUser, name);
                if (!account) return res.json({});
                res.json(account.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/list", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;

                const accounts: Pagination<Account> = await this.repository.getList(idUser);
                const list: AccountDto[] = accounts.list.map(ac => ac.toDto());
                const pages: number = accounts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit!);

                const accounts: Pagination<Account> = await this.repository.getList(idUser, limit);
                const list: AccountDto[] = accounts.list.map(ac => ac.toDto());
                const pages: number = accounts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit/:page", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit!);
                const page: number = Number(req.params.page!);

                const accounts: Pagination<Account> = await this.repository.getList(idUser, limit, page);
                const list: AccountDto[] = accounts.list.map(ac => ac.toDto());
                const pages: number = accounts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
    }
}