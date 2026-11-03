// 글 상세 보기 (post.html?id=...)
import {
    storage, renderHeader, getParam, formatDate, createVisibilityBadge, showMessage
} from "../common.js";

const user = await renderHeader("");

const article = document.querySelector("#entry");
const pageMessage = document.querySelector("#page-message");
const id = getParam("id");

async function init() {
    const entry = id ? await storage.get(id) : null;
    if (!entry) {
        showMessage(pageMessage, "글을 찾을 수 없거나 볼 수 있는 권한이 없어요.", "error-state");
        return;
    }

    document.title = `${entry.title} - Dearly`;
    document.querySelector("#entry-category").textContent = entry.category;
    document.querySelector("#entry-visibility").replaceWith(createVisibilityBadge(entry.isPublic));
    document.querySelector("#entry-title").textContent = entry.mood ? `${entry.mood} ${entry.title}` : entry.title;

    let meta = formatDate(entry.createdAt);
    if (entry.updatedAt && entry.updatedAt !== entry.createdAt) meta += ` (수정됨 ${formatDate(entry.updatedAt)})`;
    if (storage.needsAuth) meta += ` · ${entry.authorName}`;
    document.querySelector("#entry-meta").textContent = meta;

    // white-space: pre-wrap 덕분에 줄바꿈이 그대로 보입니다.
    document.querySelector("#entry-content").textContent = entry.content;

    if (user && entry.authorId === user.id) {
        document.querySelector("#owner-actions").hidden = false;
        document.querySelector("#edit-link").href = `write.html?id=${encodeURIComponent(entry.id)}`;
        document.querySelector("#delete-button").addEventListener("click", async () => {
            if (!confirm("이 글을 삭제할까요? 되돌릴 수 없어요.")) return;
            try {
                await storage.remove(entry.id);
                location.href = "diary.html";
            } catch (error) {
                alert(error.message);
            }
        });
    }

    article.hidden = false;
}

init().catch((error) => showMessage(pageMessage, error.message, "error-state"));
