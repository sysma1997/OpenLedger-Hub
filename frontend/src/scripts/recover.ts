import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc.js";

import { User } from "../core/user/domain/User";
import type { UserRepository } from "../core/user/domain/UserRepository";
import { UserApiRepository } from "../core/user/infrastructure/UserApiRepository";

dayjs.extend(dayjsUtc);

const repository: UserRepository = new UserApiRepository();

const email = document.getElementById("inEmail") as HTMLInputElement;
const recover = document.getElementById("btnRecover") as HTMLButtonElement;

email.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        recover.click();
    }
});
recover.onclick = async () => {
    if (!email.value) {
        window.showAlert("Please fill in all fields.");
        return;
    }
    if (!User.IsValidEmail(email.value)) {
        window.showAlert("Please enter a valid email.");
        return;
    }

    recover.classList.add("is-loading");
    recover.disabled = true;
    try {
        const result = await repository.requestRecoverPassword(email.value);

        window.showAlert(result, "Request recover email");
        recover.classList.remove("is-loading");
        recover.disabled = false;
    } catch (err: any) {
        if (err instanceof Error) {
            console.error(err);
            window.showAlert(err.message);
        }

        recover.classList.remove("is-loading");
        recover.disabled = false;
    }
};

const search = new URLSearchParams(window.location.search);
if (search.get("token")) {
    const token: string = search.get("token")!;
    const password = document.getElementById("inPassword") as HTMLInputElement;
    const confirmPassword = document.getElementById("inConfirmPassword") as HTMLInputElement;

    document.getElementById("dEmail")!.style.display = "none";
    document.getElementById("dPassword")!.style.display = "block";
    document.getElementById("dConfirmPassword")!.style.display = "block";
    recover.innerText = "Update password";

    password.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            confirmPassword.focus();
        }
    });
    confirmPassword.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            recover.click();
        }
    });
    recover.onclick = async () => {
        if (!password.value || !confirmPassword.value) {
            let message = "";
            let lineBreak = 0;

            if (!password.value) {
                message += "Password is required.";
                lineBreak++;
            }
            if (!confirmPassword.value) message += (lineBreak++ > 0 ? "</br>" : "") + 
                "Confirm password is required.";

            window.showAlert(message);
            return;
        }
        if (password.value !== confirmPassword.value) {
            window.showAlert("Passwords do not match.");
            return;
        }

        recover.classList.add("is-loading");
        recover.disabled = true;
        try {
            const result = await repository.recoverPassword(token, password.value);
            
            window.showAlert(result, "Recover password", () => {
                window.location.href = "/login";
            });
            recover.classList.remove("is-loading");
            recover.disabled = false;
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }

            recover.classList.remove("is-loading");
            recover.disabled = false;
        }
    };
}