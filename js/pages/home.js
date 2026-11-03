// 홈: 최신 공개 글 목록
import { storage, renderHeader, createEntryCard, showMessage } from "../common.js";

await renderHeader("home");

const postList = document.querySelector("#post-list");
const postCount = document.querySelector("#post-count");

try {
    const posts = await storage.listPublic();
    postCount.textContent = `총 ${posts.length}개의 글`;

    if (posts.length === 0) {
        showMessage(postList, "아직 공개된 글이 없어요. 첫 글을 남겨 보세요!");
    } else {
        posts.forEach((post) => {
            postList.append(createEntryCard(post, { showAuthor: storage.needsAuth }));
        });
    }
} catch (error) {
    showMessage(postList, error.message, "error-state");
}
