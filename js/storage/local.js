// =====================================================
// 1단계: localStorage 저장소
// 서버 없이 브라우저에만 저장합니다. 사용자는 "나" 한 명뿐이에요.
// =====================================================
import { normalizeEntryInput, byNewest } from "./entry.js";

const KEY = "dearly:entries";
const USER = { id: "local", name: "나" };

// 처음 실행할 때 보여줄 예시 글
const SAMPLE_ENTRIES = [
    {
        id: "sample-1",
        category: "일상",
        mood: "😊",
        title: "오늘의 노을이 정말 예뻤다",
        content: "하루가 끝나가는 시간이 이렇게 아름다울 줄이야. 오랜만에 마음이 편안해졌다.",
        isPublic: true,
        createdAt: "2026-10-25T19:00:00.000Z"
    },
    {
        id: "sample-2",
        category: "생각",
        mood: "😐",
        title: "새로운 시작을 준비하며",
        content: "지금까지 해온 것들을 돌아보며 앞으로 더 좋은 방향으로 나아가고 싶다.",
        isPublic: true,
        createdAt: "2026-10-24T13:00:00.000Z"
    },
    {
        id: "sample-3",
        category: "여행",
        mood: "😊",
        title: "주말에 다녀온 작은 여행",
        content: "맑은 공기와 푸른 나무 덕분에 일상의 스트레스를 잠시 잊을 수 있었다.",
        isPublic: true,
        createdAt: "2026-10-22T09:00:00.000Z"
    }
].map((entry) => ({
    ...entry,
    authorId: USER.id,
    authorName: USER.name,
    updatedAt: entry.createdAt
}));

function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw === null) {
            save(SAMPLE_ENTRIES);
            return [...SAMPLE_ENTRIES];
        }
        return JSON.parse(raw) ?? [];
    } catch {
        return [];
    }
}

function save(entries) {
    localStorage.setItem(KEY, JSON.stringify(entries));
}

function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default {
    mode: "local",
    needsAuth: false,

    async getCurrentUser() {
        return USER;
    },
    async signup() {
        return USER;
    },
    async login() {
        return USER;
    },
    async logout() {},

    async listPublic() {
        return load().filter((entry) => entry.isPublic).sort(byNewest);
    },

    async listMine() {
        return load().filter((entry) => entry.authorId === USER.id).sort(byNewest);
    },

    async get(id) {
        return load().find((entry) => entry.id === id) ?? null;
    },

    async create(data) {
        const now = new Date().toISOString();
        const entry = {
            id: makeId(),
            ...normalizeEntryInput(data),
            authorId: USER.id,
            authorName: USER.name,
            createdAt: now,
            updatedAt: now
        };
        const entries = load();
        entries.push(entry);
        save(entries);
        return entry;
    },

    async update(id, data) {
        const entries = load();
        const index = entries.findIndex((entry) => entry.id === id);
        if (index === -1) throw new Error("글을 찾을 수 없어요.");
        entries[index] = {
            ...entries[index],
            ...normalizeEntryInput(data),
            updatedAt: new Date().toISOString()
        };
        save(entries);
        return entries[index];
    },

    async remove(id) {
        save(load().filter((entry) => entry.id !== id));
    }
};
