// 글 입력값 검증/정리 (local, firebase 구현에서 공통 사용)
// api 모드는 서버가 같은 규칙으로 다시 검증합니다.
import { CATEGORIES, MOODS } from "../config.js";

export const TITLE_MAX = 100;
export const CONTENT_MAX = 10000;

export function normalizeEntryInput(data) {
    const title = String(data.title ?? "").trim();
    const content = String(data.content ?? "").trim();
    const category = CATEGORIES.includes(data.category) ? data.category : CATEGORIES[0];
    const mood = MOODS.includes(data.mood) ? data.mood : "";

    if (!title) throw new Error("제목을 입력해 주세요.");
    if (title.length > TITLE_MAX) throw new Error(`제목은 ${TITLE_MAX}자 이하로 써 주세요.`);
    if (!content) throw new Error("내용을 입력해 주세요.");
    if (content.length > CONTENT_MAX) throw new Error(`내용은 ${CONTENT_MAX}자 이하로 써 주세요.`);

    return { title, content, category, mood, isPublic: Boolean(data.isPublic) };
}

export function byNewest(a, b) {
    return b.createdAt.localeCompare(a.createdAt);
}
