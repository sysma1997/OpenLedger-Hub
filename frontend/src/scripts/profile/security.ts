import { User } from "../../core/user/domain/User";
import type { UserConfig } from "../../core/user/domain/User";
import type { UserRepository } from "../../core/user/domain/UserRepository";

const updatePassword = document.getElementById("btnSUpdatePassword") as HTMLButtonElement;
const updateTwoStep = document.getElementById("btnSUpdateTwoStep") as HTMLButtonElement;

const modalUpdatePassword = document.getElementById("mUpdatePassword") as HTMLDivElement;
const mupClose = modalUpdatePassword.querySelector('.delete') as HTMLButtonElement;
const mupCurrentPassword = document.getElementById("iMUPCurrentPassword") as HTMLInputElement;
const mupNewPassword = document.getElementById("iMUPNewPassword") as HTMLInputElement;
const mupConfirmPassword = document.getElementById("iMUPConfirmPassword") as HTMLInputElement;
const mupCancel = document.getElementById("btnMUPCancel") as HTMLButtonElement;
const mupAccept = document.getElementById("btnMUPAccept") as HTMLButtonElement;

const modalUpdateTwoStep = document.getElementById("mUpdateTwoStep") as HTMLDivElement;
const mutsClose = modalUpdateTwoStep.querySelector('.delete') as HTMLButtonElement;
const mutsActive = document.getElementById("iMUTSActive") as HTMLInputElement;
const mutsType = document.getElementById("sMUTSType") as HTMLSelectElement;
const mutsCancel = document.getElementById("btnMUTSCancel") as HTMLButtonElement;
const mutsAccept = document.getElementById("btnMUTSAccept") as HTMLButtonElement;

const mupClickCancel = () => {
    modalUpdatePassword.classList.remove("is-active");
    mupCurrentPassword.value = "";
    mupNewPassword.value = "";
    mupConfirmPassword.value = "";
};
const mutsClickCancel = () => {
    modalUpdateTwoStep.classList.remove("is-active");
}

export const setup = (user: User, repository: UserRepository) => {
    if (user.config) 
        if (user.config.twoStep.active) 
            mutsActive.checked = user.config.twoStep.active;

    updatePassword.onclick = () => {
        modalUpdatePassword.classList.add("is-active");
    };
    mupClose.onclick = () => mupClickCancel();
    mupCurrentPassword.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            mupNewPassword.focus();
        }
    });
    mupNewPassword.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            mupConfirmPassword.focus();
        }
    });
    mupConfirmPassword.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            mupAccept.click();
        }
    });
    mupCancel.onclick = () => mupClickCancel();
    mupAccept.onclick = async () => {
        if (!mupCurrentPassword.value || !mupNewPassword.value || !mupConfirmPassword.value) {
            let message = "";
            let lineBreak = 0;

            if (!mupCurrentPassword.value) {
                message += "Current password is required.";
                lineBreak++;
            }
            if (!mupNewPassword.value) message += ((lineBreak++ > 0) ? "</br>" : "") + 
                "New password is required.";
            if (!mupConfirmPassword.value) message += ((lineBreak > 0) ? "</br>" : "") + 
                "Confirm password is required."

            window.showAlert(message);
            return;
        }
        if (mupNewPassword.value !== mupConfirmPassword.value) {
            window.showAlert("New password and confirm password do not match.");
            return;
        }

        mupAccept.classList.add("is-loading");
        mupAccept.disabled = true;
        try {
            const result = await repository.updatePassword(mupCurrentPassword.value, mupNewPassword.value);

            window.showAlert(result, "Update password", () => {
                mupAccept.classList.remove("is-loading");
                mupAccept.disabled = false;
                mupClickCancel();
            });
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }

            mupAccept.classList.remove("is-loading");
            mupAccept.disabled = false;
        }
    };

    updateTwoStep.onclick = () => {
        modalUpdateTwoStep.classList.add("is-active");
    };
    mutsClose.onclick = () => mutsClickCancel();
    mutsCancel.onclick = () => mutsClickCancel();
    mutsAccept.onclick = () => {
        const active = mutsActive.checked;
        const type = mutsType.value;

        mutsAccept.classList.add("is-loading");
        mutsAccept.disabled = true;
        let message =  `${((active) ? "Active" : "Disable")} two step?</br>` + 
            `Then you can ${((active) ? "activate" : "deactivate")} it again.`
        window.showConfirm(message, "Update two step", async () => {
            try {
                const config: UserConfig = {
                    twoStep: {
                        active: active, 
                        type: type
                    }
                };
                const result = await repository.updateTwoStep(config);

                window.showAlert(result, "Update two step", () => {
                    user = user.setConfig(config);
                    mutsActive.checked = config.twoStep.active;
                    mutsAccept.classList.remove("is-loading");
                    mutsAccept.disabled = false;
                    mutsClickCancel();
                });
            } catch (err: any) {
                if (err instanceof Error) {
                    console.error(err);
                    window.showAlert(err.message);
                }
                
                mutsAccept.classList.remove("is-loading");
                mutsAccept.disabled = false;
            }
        });
    };
};