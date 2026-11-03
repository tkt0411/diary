// =====================================================
// 2단계: 직접 만든 Node/Express 서버에 저장
// 로그인하면 받은 JWT 토큰을 localStorage에 보관하고
// 요청할 때마다 Authorization 헤더로 보냅니다.
// =====================================================
import { API_BASE } from "../config.js";

const TOKEN_KEY = "dearly:token";

function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let response;
    try {
        response = await fetch(API_BASE + path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch {
        throw new Error("서버에 연결할 수 없어요. 백엔드 서버(server 폴더)가 켜져 있는지 확인하세요.");
    }

    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));

    // 토큰이 만료됐으면 지워서 로그아웃 상태로 만듭니다.
    if (response.status === 401 && token) setToken(null);

    if (!response.ok) {
        const error = new Error(data.error ?? `요청에 실패했어요. (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return data;
}

let currentUser;

export default {
    mode: "api",
    needsAuth: true,

    async getCurrentUser() {
        if (currentUser !== undefined) return currentUser;
        if (!getToken()) return (currentUser = null);
        try {
            const data = await request("/api/auth/me");
            currentUser = data.user;
        } catch (error) {
            if (error.status !== 401) throw error;
            currentUser = null;
        }
        return currentUser;
    },

    async signup({ email, password, name }) {
        const data = await request("/api/auth/signup", { method: "POST", body: { email, password, name } });
        setToken(data.token);
        return (currentUser = data.user);
    },

    async login({ email, password }) {
        const data = await request("/api/auth/login", { method: "POST", body: { email, password } });
        setToken(data.token);
        return (currentUser = data.user);
    },

    async logout() {
        setToken(null);
        currentUser = null;
    },

    async listPublic() {
        return (await request("/api/entries/public")).entries;
    },

    async listMine() {
        return (await request("/api/entries/mine")).entries;
    },

    async get(id) {
        try {
            return (await request(`/api/entries/${encodeURIComponent(id)}`)).entry;
        } catch (error) {
            if (error.status === 404) return null;
            throw error;
        }
    },

    async create(data) {
        return (await request("/api/entries", { method: "POST", body: data })).entry;
    },

    async update(id, data) {
        return (await request(`/api/entries/${encodeURIComponent(id)}`, { method: "PUT", body: data })).entry;
    },

    async remove(id) {
        await request(`/api/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
    }
};
