import { Category, CategoryDto } from "../domain/Category";
import { CategoryRepository } from "../domain/CategoryRepository";
import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { UserAuthenticate } from "../../user/infrastructure/UserAuthenticate";
import { Pagination } from "../../shared/domain/Pagination";

export class CategoryController extends ControllerBase {
    private readonly repository: CategoryRepository;

    constructor(repository: CategoryRepository) {
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
                const id: string | undefined = req.body.id ?? undefined;

                const category = new Category(name, id, idUser);
                
                await this.repository.add(category);
                res.status(201).send("Category add success.");
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
                if (!req.body.name) message += ((lineBreak > 0) ? "\n" : "") + 
                    "The name is required.";
                
                return res.status(400).send(message);
            }

            try {
                const idUser: string = req.user!.id;
                const id: string = req.body.id;
                const name: string = req.body.name;

                const category = new Category(name, id, idUser);
                    
                await this.repository.update(category);
                res.send("Category update success.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.delete("/delete/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                await this.repository.delete(idUser, id);
                res.send("Category delete success.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        
        this.router.get("/get/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                const category: Category = await this.repository.get(idUser, id);
                res.json(category.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/search/:name", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const name: string = this.getQueryString(req.params.name!);

                const category: Category | undefined = await this.repository.search(idUser, name);
                if (!category) return res.json({});
                res.json(category.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/list", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;

                const categories: Pagination<Category> = await this.repository.getList(idUser);
                const list: CategoryDto[] = categories.list.map(ac => ac.toDto());
                const pages: number = categories.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit!);

                const categories: Pagination<Category> = await this.repository.getList(idUser, limit);
                const list: CategoryDto[] = categories.list.map(ac => ac.toDto());
                const pages: number = categories.pages;
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

                const categories: Pagination<Category> = await this.repository.getList(idUser, limit, page);
                const list: CategoryDto[] = categories.list.map(ac => ac.toDto());
                const pages: number = categories.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
    }
}