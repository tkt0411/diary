// 로그인 / 회원가입 (api, firebase 모드에서 사용)
import { storage, renderHeader, getParam } from "../common.js";

const user = await renderHeader("");

// 로그인 후 돌아갈 페이지 (같은 사이트의 .html 파일만 허용)
const next = getParam("next");
const redirectTo = next && /^[\w-]+\.html(\?[^#]*)?$/.test(next) ? next : "index.html";

if (!storage.needsAuth || user) {
    location.replace(redirectTo);
}

const form = document.querySelector("#auth-form");
const fields = form.elements; // form.name 은 폼 자체 속성이라 elements로 접근
const nameField = document.querySelector("#name-field");
const formError = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-button");
let tab = "login";

document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
        tab = button.dataset.tab;
        document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === button));
        nameField.hidden = tab !== "signup";
        fields.name.required = tab === "signup";
        fields.password.autocomplete = tab === "signup" ? "new-password" : "current-password";
        submitButton.textContent = tab === "signup" ? "가입하기" : "로그인";
        formError.textContent = "";
    });
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.textContent = "";
    submitButton.disabled = true;

    const email = fields.email.value.trim();
    const password = fields.password.value;

    try {
        if (tab === "signup") {
            await storage.signup({ email, password, name: fields.name.value.trim() });
        } else {
            await storage.login({ email, password });
        }
        location.href = redirectTo;
    } catch (error) {
        formError.textContent = error.message;
        submitButton.disabled = false;
    }
});
