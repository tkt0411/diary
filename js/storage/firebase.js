// =====================================================
// 3단계: Firebase (Authentication + Cloud Firestore)
// 서버 코드 없이 로그인과 DB를 해결합니다.
// 권한 검사는 firestore.rules 파일의 보안 규칙이 담당해요.
// =====================================================
import { firebaseConfig } from "../config.js";
import { normalizeEntryInput, byNewest } from "./entry.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("js/config.js 의 firebaseConfig 를 Firebase 콘솔에서 복사한 값으로 채워 주세요.");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const entriesRef = collection(db, "entries");

// Firebase 에러 코드를 한국어로
const AUTH_ERRORS = {
    "auth/email-already-in-use": "이미 가입된 이메일이에요.",
    "auth/invalid-email": "이메일 형식이 올바르지 않아요.",
    "auth/weak-password": "비밀번호는 6자 이상이어야 해요.",
    "auth/invalid-credential": "이메일 또는 비밀번호가 맞지 않아요.",
    "auth/wrong-password": "이메일 또는 비밀번호가 맞지 않아요.",
    "auth/user-not-found": "이메일 또는 비밀번호가 맞지 않아요.",
    "auth/too-many-requests": "시도가 너무 많아요. 잠시 후 다시 해 주세요.",
    "auth/operation-not-allowed": "Firebase 콘솔에서 이메일/비밀번호 로그인을 켜 주세요.",
    "permission-denied": "권한이 없어요."
};

function translate(error) {
    return new Error(AUTH_ERRORS[error.code] ?? error.message);
}

function toUser(firebaseUser) {
    if (!firebaseUser) return null;
    return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email.split("@")[0]
    };
}

function toEntry(snapshot) {
    return { id: snapshot.id, ...snapshot.data() };
}

export default {
    mode: "firebase",
    needsAuth: true,

    async getCurrentUser() {
        // 페이지가 열리면 Firebase가 저장된 로그인 상태를 복원할 때까지 기다립니다.
        await auth.authStateReady();
        return toUser(auth.currentUser);
    },

    async signup({ email, password, name }) {
        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            if (name) await updateProfile(user, { displayName: name });
            return toUser(user);
        } catch (error) {
            throw translate(error);
        }
    },

    async login({ email, password }) {
        try {
            const { user } = await signInWithEmailAndPassword(auth, email, password);
            return toUser(user);
        } catch (error) {
            throw translate(error);
        }
    },

    async logout() {
        await signOut(auth);
    },

    // 정렬은 브라우저에서 해서 Firestore 복합 색인을 따로 만들 필요가 없게 했어요.
    async listPublic() {
        const snapshot = await getDocs(query(entriesRef, where("isPublic", "==", true)));
        return snapshot.docs.map(toEntry).sort(byNewest);
    },

    async listMine() {
        const user = auth.currentUser;
        if (!user) return [];
        const snapshot = await getDocs(query(entriesRef, where("authorId", "==", user.uid)));
        return snapshot.docs.map(toEntry).sort(byNewest);
    },

    async get(id) {
        try {
            const snapshot = await getDoc(doc(db, "entries", id));
            return snapshot.exists() ? toEntry(snapshot) : null;
        } catch (error) {
            // 남의 비공개 글은 보안 규칙에서 거절됩니다.
            if (error.code === "permission-denied") return null;
            throw error;
        }
    },

    async create(data) {
        const user = toUser(auth.currentUser);
        if (!user) throw new Error("로그인이 필요해요.");
        const now = new Date().toISOString();
        const entry = {
            ...normalizeEntryInput(data),
            authorId: user.id,
            authorName: user.name,
            createdAt: now,
            updatedAt: now
        };
        try {
            const ref = await addDoc(entriesRef, entry);
            return { id: ref.id, ...entry };
        } catch (error) {
            throw translate(error);
        }
    },

    async update(id, data) {
        const changes = { ...normalizeEntryInput(data), updatedAt: new Date().toISOString() };
        try {
            await updateDoc(doc(db, "entries", id), changes);
        } catch (error) {
            throw translate(error);
        }
        return this.get(id);
    },

    async remove(id) {
        try {
            await deleteDoc(doc(db, "entries", id));
        } catch (error) {
            throw translate(error);
        }
    }
};
