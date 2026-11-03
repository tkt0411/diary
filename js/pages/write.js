// 글쓰기 / 수정 (write.html?id=... 이면 수정 모드)
import { storage, renderHeader, requireUser, getParam, showMessage } from "../common.js";
import { CATEGORIES, MOODS } from "../config.js";

const user = await renderHeader("");

const form = document.querySelector("#entry-form");
const fields = form.elements; // form.title 은 폼 자체 속성이라 elements로 접근
const pageTitle = document.querySelector("#page-title");
const pageMessage = document.querySelector("#page-message");
const categorySelect = document.querySelector("#category");
const moodPicker = document.querySelector("#mood-picker");
const formError = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-button");
const cancelLink = document.querySelector("#cancel-link");

const editId = getParam("id");
let selectedMood = "";

CATEGORIES.forEach((name) => categorySelect.add(new Option(name, name)));

// 기분 선택 버튼 (한 번 더 누르면 선택 해제)
MOODS.forEach((mood) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mood-button";
    button.textContent = mood;
    button.dataset.mood = mood;
    button.addEventListener("click", () => setMood(selectedMood === mood ? "" : mood));
    moodPicker.append(button);
});

function setMood(mood) {
    selectedMood = mood;
    moodPicker.querySelectorAll(".mood-button").forEach((button) => {
        button.classList.toggle("selected", button.dataset.mood === mood);
    });
}

async function init() {
    if (!requireUser(user)) return;

    if (editId) {
        pageTitle.textContent = "일기 수정하기";
        cancelLink.href = `post.html?id=${encodeURIComponent(editId)}`;

        const entry = await storage.get(editId);
        if (!entry || entry.authorId !== user.id) {
            showMessage(pageMessage, "수정할 수 있는 글이 아니에요.", "error-state");
            return;
        }
        fields.title.value = entry.title;
        fields.content.value = entry.content;
        fields.category.value = entry.category;
        fields.isPublic.checked = entry.isPublic;
        setMood(entry.mood);
    }

    form.hidden = false;
    fields.title.focus();
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.textContent = "";
    submitButton.disabled = true;

    const data = {
        title: fields.title.value,
        content: fields.content.value,
        category: fields.category.value,
        mood: selectedMood,
        isPublic: fields.isPublic.checked
    };

    try {
        const saved = editId ? await storage.update(editId, data) : await storage.create(data);
        location.href = `post.html?id=${encodeURIComponent(saved.id)}`;
    } catch (error) {
        formError.textContent = error.message;
        submitButton.disabled = false;
    }
});

init().catch((error) => showMessage(pageMessage, error.message, "error-state"));
