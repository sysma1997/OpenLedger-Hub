import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc.js";

import { User } from "../core/user/domain/User";
import type { UserRepository } from "../core/user/domain/UserRepository";
import { UserApiRepository } from "../core/user/infrastructure/UserApiRepository";

dayjs.extend(dayjsUtc);

const repository: UserRepository = new UserApiRepository();

const name = document.getElementById("inName") as HTMLInputElement;
const email = document.getElementById("inEmail") as HTMLInputElement;
const password = document.getElementById("inPassword") as HTMLInputElement;
const confirmPassword = document.getElementById("inConfirmPassword") as HTMLInputElement;
const register = document.getElementById("btnRegister") as HTMLButtonElement;

repository.get().then((user: User | undefined) => {
    if (!user) return;
    window.location.href = "/";
});

name.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        email.focus();
    }
});
email.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        password.focus();
    }
});
password.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        confirmPassword.focus();
    }
});
confirmPassword.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        register.click();
    }
});
register.onclick = async () => {
    if (!name.value || !email.value || !password.value || !confirmPassword.value) {
        let message = "";
        let lineBreak = 0;

        if (!name.value) {
            message += "Name is required.";
            lineBreak++;
        }
        if (!email.value) message += (lineBreak++ > 0 ? "</br>" : "") + "Email is required.";
        if (!password.value) message += (lineBreak++ > 0 ? "</br>" : "") + "Password is required.";
        if (!confirmPassword.value) message += (lineBreak++ > 0 ? "</br>" : "") + "Confirm password is required.";

        window.showAlert(message);
        return;
    }
    if (!User.IsValidEmail(email.value)) {
        window.showAlert("Please enter a valid email.");
        return;
    }
    if (password.value !== confirmPassword.value) {
        window.showAlert("Passwords do not match.");
        return;
    }

    try {
        register.classList.add("is-loading");
        register.disabled = true;
        const user: User = new User(name.value, email.value, 
            dayjs.utc().toDate(), undefined, 
            password.value);

        await repository.register(user);
        window.showAlert("We have sent you an email to confirm your registration.", "Register", () => {
            window.location.href = "/login";
        });
    } catch (err: any) {
        if (err instanceof Error) {
            console.error(err);
            window.showAlert(`Error: ${err.message}`);
        }
        
        register.classList.remove("is-loading");
        register.disabled = false;
    }
};