import { Router } from "express";

interface IControllerBase {
    setup(): void;
    getRouter(): Router;
}
export class ControllerBase implements IControllerBase {
    protected readonly router: Router;

    constructor() {
        this.router = Router();
    }

    protected getQueryString = (param: string | string[] | undefined): string => {
        if (!param) return "";

        return Array.isArray(param) ? param[0]! : param;
    }

    setup(): void {
        throw new Error("Method not implemented.");
    }
    getRouter(): Router {
        return this.router;
    }
}