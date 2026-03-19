import { v4 as Uuid } from "uuid";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import { Transaction } from "../core/transaction/domain/Transaction";
import type { TransactionRepository } from "../core/transaction/domain/TransactionRepository";
import { TransactionApiRepository } from "../core/transaction/infrastructure/TransactionApiRepository";
import { Account } from "../core/account/domain/Account";
import type { AccountRepository } from "../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../core/account/infrastructure/AccountApiRepository"; 
import { Category } from "../core/category/domain/Category";
import type { CategoryRepository } from "../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../core/category/infrastructure/CategoryApiRepository";

import { Pagination } from "../core/shared/domain/Pagination";
import { Attach, Notify } from "../core/shared/domain/Subject";
import { FormatNumber } from "../core/shared/domain/FormatNumber";

dayjs.extend(dayjsUtc);

const transactionRepository: TransactionRepository = new TransactionApiRepository();
const accountRepository: AccountRepository = new AccountApiRepository();
const categoryRepository: CategoryRepository = new CategoryApiRepository();

let transaction: Transaction | undefined = undefined;
let accounts: Account[] = [];
let categories: Category[] = [];

const addTransaction = document.getElementById("btnAddTransaction") as HTMLButtonElement;

const modalAddTransaction = document.getElementById("modalAddTransaction") as HTMLDivElement;
const matTitle = modalAddTransaction.querySelector(".modal-card-title") as HTMLParagraphElement;
const matClose = modalAddTransaction.querySelector(".delete") as HTMLButtonElement;
const matSection1 = document.getElementById("sMAT1") as HTMLElement;
const matAccount = document.getElementById("sMATAccount") as HTMLSelectElement;
const matAccountBalance = document.getElementById("lMATAccountBalance") as HTMLLabelElement;
const matSection2 = document.getElementById("sMAT2") as HTMLElement;
const matType = document.getElementById("sMATType") as HTMLSelectElement;
const matValue = document.getElementById("iMATValue") as HTMLInputElement;
const matSection3 = document.getElementById("sMAT3") as HTMLElement;
const matDate = document.getElementById("iMATDate") as HTMLInputElement;
const matCategory = document.getElementById("sMATCategory") as HTMLSelectElement;
const matDescription = document.getElementById("taMATDescription") as HTMLTextAreaElement;
const matSection4 = document.getElementById("sMAT4") as HTMLElement;
const matAccountConfirm = document.getElementById("pMATAccountConfirm") as HTMLParagraphElement;
const matTypeConfirm = document.getElementById("pMATTypeConfirm") as HTMLParagraphElement;
const matValueConfirm = document.getElementById("pMATValueConfirm") as HTMLParagraphElement;
const matDateConfirm = document.getElementById("pMATDateConfirm") as HTMLParagraphElement;
const dmatCategoryConfirm = document.getElementById("dMATCategoryConfirm") as HTMLDivElement;
const matCategoryConfirm = document.getElementById("pMATCategoryConfirm") as HTMLParagraphElement;
const dmatDescriptionConfirm = document.getElementById("dMATDescriptionConfirm") as HTMLDivElement;
const matDescriptionConfirm = document.getElementById("pMATDescriptionConfirm") as HTMLParagraphElement;
const matSection5 = document.getElementById("sMAT5") as HTMLDivElement;
const matMessage = document.getElementById("pMATMessage") as HTMLParagraphElement;
const matCancel = document.getElementById("btnMATCancel") as HTMLButtonElement;
const matAccept = document.getElementById("btnMATAccept") as HTMLButtonElement;

const modalTransaction = document.getElementById("modalTransaction") as HTMLDivElement;
const mtClose = modalTransaction.querySelector(".delete") as HTMLButtonElement;
const mtAccount = document.getElementById("pMTAccount") as HTMLParagraphElement;
const mtType = document.getElementById("pMTType") as HTMLParagraphElement;
const mtValue = document.getElementById("pMTValue") as HTMLParagraphElement;
const mtDate = document.getElementById("pMTDate") as HTMLParagraphElement;
const dmtCategory = document.getElementById("dMTCategory") as HTMLDivElement;
const mtCategory = document.getElementById("pMTCategory") as HTMLParagraphElement;
const dmtDescription = document.getElementById("dMTDescription") as HTMLDivElement;
const mtDescription = document.getElementById("pMTDescription") as HTMLParagraphElement;
const mtOk = document.getElementById("btnMTOk") as HTMLButtonElement;

try {
    accountRepository.getList().then((pagination: Pagination<Account>) => {
        accounts = pagination.list
        if (accounts.length === 0) return;

        accounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account.id!;
            option.innerText = account.name;
            matAccount.appendChild(option);
        });
        matAccountBalance.innerText = `Balance: ${FormatNumber(accounts[0].balance)}`;
    });
    categoryRepository.getList().then((pagination: Pagination<Category>) => {
        categories = pagination.list;
        if (categories.length === 0) return;

        {
            const option = document.createElement("option");
            option.value = "";
            option.innerText = "Without category";
            matCategory.appendChild(option);
        }
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id!;
            option.innerText = category.name;
            matCategory.appendChild(option);
        });
    });
} catch (err: any) {
    if (err instanceof Error) {
        console.error(err);
        window.showAlert(err.message);
    }
}

const transactionShowUpdate = (_transaction: Transaction) => {
    transaction = _transaction;
    const account: Account | undefined = accounts.find(a => a.name === transaction!.account);
    if (account) {
        matAccount.value = account.id!;
        matAccountBalance.innerText = `Balance: ${FormatNumber(account.balance)}`;
    }
    else {
        matAccount.value = accounts[0].id!;
        matAccountBalance.innerText = `Balance: ${FormatNumber(accounts[0].balance)}`;
    }
    matType.value = transaction.type ? "true" : "false";
    matValue.value = transaction.value.toString();
    if (transaction.category) {
        const category: Category | undefined = categories.find(c => c.name === transaction!.category);
        matCategory.value = (category) ? category.id! : "";
    }
    else matCategory.value = "";
    if (transaction.description)
        matDescription.value = transaction.description;
    else matDescription.value = "";
    
    modalAddTransaction.classList.add("is-active");
    matTitle.innerText = "Update Transaction";
};
const transactionShowView = (_transaction: Transaction) => {
    transaction = _transaction;
    
    mtAccount.innerText = transaction.account;
    mtType.innerText = (transaction.type) ? "Ingress" : "Egress";
    mtValue.innerText = FormatNumber(transaction.value);
    mtDate.innerText = dayjs(transaction.date).format("DD/MM/YYYY HH:mm:ss");
    if (transaction.category) {
        dmtCategory.style.display = "flex";
        mtCategory.innerText = transaction.category;
    }
    else dmtCategory.style.display = "none";
    if (transaction.description) {
        dmtDescription.style.display = "block";
        mtDescription.innerText = transaction.description;
    }
    else dmtDescription.style.display = "none";
    
    modalTransaction.classList.add("is-active");
};
Attach("transaction:showUpdate", transactionShowUpdate);
Attach("transaction:showView", transactionShowView);

const matClickClose = () => {
    matSection5.style.display = "none";
    matSection4.style.display = "none";
    dmatDescriptionConfirm.style.display = "none";
    dmatCategoryConfirm.style.display = "none";
    matSection3.style.display = "none";
    matDescription.value = "";
    if (categories.length > 0) 
        matCategory.value = "";
    matSection2.style.display = "none";
    matValue.value = "";
    matType.value = "true";
    matSection1.style.display = "block";
    if (accounts.length > 0) {
        matAccount.value = accounts[0].id!;
        matAccountBalance.innerText = `Balance: ${FormatNumber(accounts[0].balance)}`;
    }
    matCancel.innerText = "Cancel";
    matAccept.innerText = "Next";
    matCancel.style.display = "block";
    matClose.style.display = "block";
    modalAddTransaction.classList.remove("is-active");
};
const mtClickClose = () => {
    transaction = undefined;
    modalTransaction.classList.remove("is-active");
}

addTransaction.onclick = () => {
    modalAddTransaction.classList.add("is-active");
};
matClose.onclick = matClickClose;
matAccount.onchange = (event: Event) => {
    const id = (event.target as HTMLSelectElement).value;
    
    const account: Account | undefined = accounts.find(a => a.id === id);
    if (!account) return;

    matAccountBalance.innerText = `Balance: ${FormatNumber(account.balance)}`;
};
matValue.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        matAccept.click();
    }
});
matDescription.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        matAccept.click();
    }
});
matCancel.onclick = () => {
    if (matSection1.style.display === "block") matClickClose();
    if (matSection2.style.display === "block") {
        matSection2.style.display = "none";
        matSection1.style.display = "block";
        matCancel.innerText = "Cancel";
    }
    if (matSection3.style.display === "block") {
        matSection3.style.display = "none";
        matSection2.style.display = "block";
        matCancel.innerText = "Back";
        matAccept.innerText = "Next";
    }
    if (matSection4.style.display === "block") {
        matSection4.style.display = "none";
        matSection3.style.display = "block";
        matCancel.innerText = "Back";
        matAccept.innerText = "Next";
    }
};
matAccept.onclick = async () => {
    if (matSection1.style.display === "block") {
        matSection1.style.display = "none";
        matSection2.style.display = "block";
        matCancel.innerText = "Back";
        return;
    }
    if (matSection2.style.display === "block") {
        if (matValue.value === "" || isNaN(Number(matValue.value)) || Number(matValue.value) <= 0) {
            window.showAlert("Please enter a valid value for the transaction.");
            return;
        }
        const account = accounts.find(a => a.id === matAccount.value)!;
        
        matDate.value = (!transaction) ? 
            dayjs().format("YYYY-MM-DD HH:mm:ss") : 
            matDate.value = dayjs.utc(transaction.date).format("YYYY-MM-DD HH:mm:ss");
        matSection2.style.display = "none";
        matSection3.style.display = "block";
        matCancel.innerText = "Back";
        matAccept.innerText = "Next";
        return;
    }
    if (matSection3.style.display === "block") {
        matSection3.style.display = "none";
        matSection4.style.display = "block";

        const account = accounts.find(a => a.id === matAccount.value)!;
        matAccountConfirm.innerText = account.name;
        matTypeConfirm.innerText = matType.value === "true" ? "Ingress" : "Egress";
        matValueConfirm.innerText = FormatNumber(Number(matValue.value));
        matDateConfirm.innerText = dayjs(matDate.value).format("DD/MM/YYYY HH:mm:ss");
        if (matCategory.value) {
            dmatCategoryConfirm.style.display = "flex";
            matCategoryConfirm.innerText = categories.find(c => c.id === matCategory.value)!.name;
        }
        else dmatCategoryConfirm.style.display = "none";
        if (matDescription.value) {
            dmatDescriptionConfirm.style.display = "block";
            matDescriptionConfirm.innerText = matDescription.value;
        }
        else dmatDescriptionConfirm.style.display = "none";
        matCancel.innerText = "Back";
        matAccept.innerText = (!transaction) ? "Add" : "Update";
        return;
    }
    if (matSection4.style.display === "block") {
        matAccept.classList.add("is-loading");
        matAccept.disabled = true;

        const id: string = (!transaction) ? Uuid() : transaction.id!;
        const account: string = accounts.find(a => a.id === matAccount.value)!.name;
        const type: boolean = matType.value === "true" ? true : false;
        const value: number = Number(matValue.value);
        const date: Date = dayjs.utc(matDate.value).toDate();
        const category: string | undefined = (matCategory.value) ? categories.find(c => c.id === matCategory.value)!.name : undefined;
        const description: string | undefined = matDescription.value ?? undefined;

        try {
            const _transaction = new Transaction(date, type, account, value, 
                id, undefined, 
                category, description);
            if (!transaction){
                await transactionRepository.add(_transaction);
                Notify("transaction:add", _transaction);
            }
            else {
                await transactionRepository.update(_transaction);
                Notify("transaction:update", _transaction);
            }
            accounts = accounts.map(a => {
                if (a.name === account) {
                    if (!transaction) {
                        a = (type) ? a.ingressBalance(value) : a.egressBalance(value);
                    }
                    else {
                        a = (transaction.type) ? a.egressBalance(transaction.value) : a.ingressBalance(transaction.value);
                        a = (type) ? a.ingressBalance(value) : a.egressBalance(value);
                    }
                }

                return a;
            });
            matMessage.innerText = (!transaction) ? 
                "The transaction has been created successfully." : 
                "The transaction has been updated successfully.";

            matSection4.style.display = "none";
            matSection5.style.display = "block";
            matClose.style.display = "none";
            matCancel.style.display = "none";
            matAccept.innerText = "Ok";
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }
        }
        matAccept.classList.remove("is-loading");
        matAccept.disabled = false;
        return;
    }
    if (matSection5.style.display === "block") {
        if (transaction) transaction = undefined;
        matClickClose();
    }
};

mtClose.onclick = mtClickClose;
mtOk.onclick = mtClickClose;