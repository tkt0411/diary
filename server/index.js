// =====================================================
// Dearly 백엔드 서버 (2단계)
//   npm install && npm start  →  http://localhost:3000
// 프론트엔드 파일도 같이 서빙하므로 브라우저에서 바로 열 수 있어요.
// =====================================================
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const PORT = Number(process.env.PORT ?? 3000);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me";
if (!process.env.JWT_SECRET) {
    console.warn("⚠️  JWT_SECRET 환경변수가 없어서 개발용 기본값을 사용합니다. 배포할 땐 꼭 설정하세요.");
}

const CATEGORIES = ["일상", "생각", "여행", "기타"];
const MOODS = ["😊", "😐", "😢", "😡", "😴"];
const TITLE_MAX = 100;
const CONTENT_MAX = 10000;

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// ---------- 도우미 함수 ----------

// DB 행(snake_case) → 프론트에서 쓰는 모양(camelCase)
function toEntry(row) {
    return {
        id: String(row.id),
        title: row.title,
        content: row.content,
        category: row.category,
        mood: row.mood,
        isPublic: row.is_public === 1,
        authorId: String(row.user_id),
        authorName: row.author_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function toUser(row) {
    return { id: String(row.id), name: row.name, email: row.email };
}

function makeToken(user) {
    return jwt.sign({ sub: String(user.id) }, JWT_SECRET, { expiresIn: "7d" });
}

// 요청 본문 검증. 문제가 있으면 에러 메시지 문자열을 돌려줍니다.
function validateEntry(body) {
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!title) return { error: "제목을 입력해 주세요." };
    if (title.length > TITLE_MAX) return { error: `제목은 ${TITLE_MAX}자 이하로 써 주세요.` };
    if (!content) return { error: "내용을 입력해 주세요." };
    if (content.length > CONTENT_MAX) return { error: `내용은 ${CONTENT_MAX}자 이하로 써 주세요.` };
    return {
        value: {
            title,
            content,
            category: CATEGORIES.includes(body.category) ? body.category : CATEGORIES[0],
            mood: MOODS.includes(body.mood) ? body.mood : "",
            isPublic: body.isPublic ? 1 : 0
        }
    };
}

const SELECT_ENTRY = `
    SELECT entries.*, users.name AS author_name
    FROM entries JOIN users ON users.id = entries.user_id
`;

function findEntry(id) {
    return db.prepare(`${SELECT_ENTRY} WHERE entries.id = ?`).get(Number(id));
}

// ---------- 인증 미들웨어 ----------

// Authorization: Bearer <token> 이 있으면 req.userId 를 채워 줍니다.
function readAuth(req, res, next) {
    const header = req.get("Authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            const exists = db.prepare("SELECT id FROM users WHERE id = ?").get(Number(payload.sub));
            if (exists) req.userId = Number(payload.sub);
        } catch {
            return res.status(401).json({ error: "로그인이 만료되었어요. 다시 로그인해 주세요." });
        }
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.userId) return res.status(401).json({ error: "로그인이 필요해요." });
    next();
}

app.use("/api", readAuth);

// ---------- 회원 ----------

app.post("/api/auth/signup", (req, res) => {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const name = String(req.body.name ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "이메일 형식이 올바르지 않아요." });
    if (password.length < 6) return res.status(400).json({ error: "비밀번호는 6자 이상이어야 해요." });
    if (!name || name.length > 20) return res.status(400).json({ error: "닉네임은 1~20자로 입력해 주세요." });

    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
        return res.status(409).json({ error: "이미 가입된 이메일이에요." });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db
        .prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)")
        .run(email, hash, name, new Date().toISOString());
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);

    res.status(201).json({ token: makeToken(user), user: toUser(user) });
});

app.post("/api/auth/login", (req, res) => {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: "이메일 또는 비밀번호가 맞지 않아요." });
    }
    res.json({ token: makeToken(user), user: toUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    res.json({ user: toUser(user) });
});

// ---------- 일기 ----------

// 공개 글 목록 (로그인 없이 볼 수 있음)
app.get("/api/entries/public", (req, res) => {
    const rows = db
        .prepare(`${SELECT_ENTRY} WHERE entries.is_public = 1 ORDER BY entries.created_at DESC LIMIT 100`)
        .all();
    res.json({ entries: rows.map(toEntry) });
});

// 내 글 목록
app.get("/api/entries/mine", requireAuth, (req, res) => {
    const rows = db
        .prepare(`${SELECT_ENTRY} WHERE entries.user_id = ? ORDER BY entries.created_at DESC`)
        .all(req.userId);
    res.json({ entries: rows.map(toEntry) });
});

// 글 하나 (비공개 글은 작성자만)
app.get("/api/entries/:id", (req, res) => {
    const row = findEntry(req.params.id);
    if (!row || (!row.is_public && row.user_id !== req.userId)) {
        return res.status(404).json({ error: "글을 찾을 수 없어요." });
    }
    res.json({ entry: toEntry(row) });
});

app.post("/api/entries", requireAuth, (req, res) => {
    const { value, error } = validateEntry(req.body);
    if (error) return res.status(400).json({ error });

    const now = new Date().toISOString();
    const result = db
        .prepare(`INSERT INTO entries (user_id, title, content, category, mood, is_public, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(req.userId, value.title, value.content, value.category, value.mood, value.isPublic, now, now);

    res.status(201).json({ entry: toEntry(findEntry(result.lastInsertRowid)) });
});

app.put("/api/entries/:id", requireAuth, (req, res) => {
    const row = findEntry(req.params.id);
    if (!row) return res.status(404).json({ error: "글을 찾을 수 없어요." });
    if (row.user_id !== req.userId) return res.status(403).json({ error: "내 글만 수정할 수 있어요." });

    const { value, error } = validateEntry(req.body);
    if (error) return res.status(400).json({ error });

    db.prepare(`UPDATE entries SET title = ?, content = ?, category = ?, mood = ?, is_public = ?, updated_at = ?
                WHERE id = ?`)
        .run(value.title, value.content, value.category, value.mood, value.isPublic, new Date().toISOString(), row.id);

    res.json({ entry: toEntry(findEntry(row.id)) });
});

app.delete("/api/entries/:id", requireAuth, (req, res) => {
    const row = findEntry(req.params.id);
    if (!row) return res.status(404).json({ error: "글을 찾을 수 없어요." });
    if (row.user_id !== req.userId) return res.status(403).json({ error: "내 글만 삭제할 수 있어요." });

    db.prepare("DELETE FROM entries WHERE id = ?").run(row.id);
    res.status(204).end();
});

app.use("/api", (req, res) => res.status(404).json({ error: "없는 API 경로예요." }));

// ---------- 프론트엔드 파일 서빙 ----------
// 상위 폴더(index.html 등)를 서빙하되, server/ 폴더(DB 파일 포함)와
// .git 같은 점(.)으로 시작하는 경로는 막습니다.
const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
app.use((req, res, next) => {
    const blocked = /^\/server(\/|$)/i.test(req.path) || /(^|\/)\./.test(req.path);
    return blocked ? res.status(404).end() : next();
});
app.use(express.static(webRoot, { dotfiles: "deny" }));

// 예상 못 한 에러 처리 (잘못된 JSON 등)
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "잘못된 요청 형식이에요." });
    console.error(err);
    res.status(500).json({ error: "서버 오류가 발생했어요." });
});

app.listen(PORT, () => {
    console.log(`Dearly 서버 실행 중 → http://localhost:${PORT}`);
});
