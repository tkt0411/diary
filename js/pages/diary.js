// 내 일기: 내가 쓴 글 전체 + 검색/필터
import { storage, renderHeader, requireUser, createEntryCard, showMessage } from "../common.js";
import { CATEGORIES } from "../config.js";

const user = await renderHeader("diary");

const postList = document.querySelector("#post-list");
const postCount = document.querySelector("#post-count");
const searchInput = document.querySelector("#search");
const categoryFilter = document.querySelector("#category-filter");
const visibilityFilter = document.querySelector("#visibility-filter");

CATEGORIES.forEach((name) => categoryFilter.add(new Option(name, name)));

let entries = [];

function render() {
    const keyword = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const visibility = visibilityFilter.value;

    const filtered = entries.filter((entry) => {
        if (category && entry.category !== category) return false;
        if (visibility === "public" && !entry.isPublic) return false;
        if (visibility === "private" && entry.isPublic) return false;
        if (keyword) {
            const text = `${entry.title} ${entry.content}`.toLowerCase();
            if (!text.includes(keyword)) return false;
        }
        return true;
    });

    postCount.textContent = `${filtered.length} / ${entries.length}개`;

    if (entries.length === 0) {
        showMessage(postList, "아직 쓴 일기가 없어요. 오른쪽 위 \"+ 글쓰기\"로 시작해 보세요.");
    } else if (filtered.length === 0) {
        showMessage(postList, "조건에 맞는 글이 없어요.");
    } else {
        postList.replaceChildren(...filtered.map((entry) => createEntryCard(entry, { showVisibility: true })));
    }
}

if (requireUser(user)) {
    try {
        entries = await storage.listMine();
        render();
    } catch (error) {
        showMessage(postList, error.message, "error-state");
    }

    searchInput.addEventListener("input", render);
    categoryFilter.addEventListener("change", render);
    visibilityFilter.addEventListener("change", render);
}
