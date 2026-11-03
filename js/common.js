// 모든 페이지에서 같이 쓰는 기능: 헤더, 로그인 확인, 카드 만들기 등
import { storage } from "./storage/index.js";

export { storage };

// 상단 메뉴를 그리고, 현재 로그인한 사용자를 돌려줍니다.
export async function renderHeader(activeKey) {
    const header = document.querySelector("#app-header");
    header.className = "header";
    header.innerHTML = `
        <h1 class="logo"><a href="index.html">Dearly.</a></h1>
        <nav class="menu">
            <a href="index.html" data-key="home">홈</a>
            <a href="diary.html" data-key="diary">내 일기</a>
            <a href="index.html#posts" data-key="public">공개 글</a>
        </nav>
        <div class="header-actions"></div>
    `;

    const activeLink = header.querySelector(`[data-key="${activeKey}"]`);
    if (activeLink) activeLink.classList.add("active");

    const actions = header.querySelector(".header-actions");
    let user = null;
    try {
        user = await storage.getCurrentUser();
    } catch (error) {
        console.error(error);
    }

    if (storage.needsAuth) {
        if (user) {
            const name = document.createElement("span");
            name.className = "user-name";
            name.textContent = `${user.name}님`;

            const logoutButton = document.createElement("button");
            logoutButton.className = "text-button";
            logoutButton.textContent = "로그아웃";
            logoutButton.addEventListener("click", async () => {
                await storage.logout();
                location.href = "index.html";
            });
            actions.append(name, logoutButton);
        } else {
            const loginLink = document.createElement("a");
            loginLink.className = "text-button";
            loginLink.href = loginUrl();
            loginLink.textContent = "로그인";
            actions.append(loginLink);
        }
    }

    const writeButton = document.createElement("a");
    writeButton.className = "write-button";
    writeButton.href = "write.html";
    writeButton.textContent = "+ 글쓰기";
    actions.append(writeButton);

    return user;
}

// 로그인이 필요한 페이지에서 호출. 로그인 안 했으면 로그인 페이지로 보냅니다.
export function requireUser(user) {
    if (storage.needsAuth && !user) {
        location.replace(loginUrl());
        return false;
    }
    return true;
}

function loginUrl() {
    const current = location.pathname.split("/").pop() + location.search;
    return `login.html?next=${encodeURIComponent(current || "index.html")}`;
}

export function getParam(name) {
    return new URLSearchParams(location.search).get(name);
}

export function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

// 글 카드 하나 만들기 (textContent만 사용해서 HTML 주입을 막습니다)
export function createEntryCard(entry, { showVisibility = false, showAuthor = false } = {}) {
    const card = document.createElement("a");
    card.className = "post-card";
    card.href = `post.html?id=${encodeURIComponent(entry.id)}`;

    const top = document.createElement("div");
    top.className = "card-top";

    const category = document.createElement("span");
    category.className = "category";
    category.textContent = entry.category;
    top.append(category);

    if (showVisibility) {
        top.append(createVisibilityBadge(entry.isPublic));
    }

    const title = document.createElement("h3");
    title.textContent = entry.mood ? `${entry.mood} ${entry.title}` : entry.title;

    const content = document.createElement("p");
    content.className = "post-content";
    content.textContent = entry.content.length > 90 ? entry.content.slice(0, 90) + "…" : entry.content;

    const date = document.createElement("p");
    date.className = "post-date";
    date.textContent = showAuthor
        ? `${formatDate(entry.createdAt)} · ${entry.authorName}`
        : formatDate(entry.createdAt);

    card.append(top, title, content, date);
    return card;
}

export function createVisibilityBadge(isPublic) {
    const badge = document.createElement("span");
    badge.className = isPublic ? "badge badge-public" : "badge badge-private";
    badge.textContent = isPublic ? "공개" : "비공개";
    return badge;
}

export function showMessage(container, text, className = "empty-state") {
    container.replaceChildren();
    const box = document.createElement("div");
    box.className = className;
    box.textContent = text;
    container.append(box);
}
