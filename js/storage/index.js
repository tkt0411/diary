// =====================================================
// 저장소 선택기
// 모든 화면은 이 파일의 storage 객체만 사용합니다.
// 어떤 구현(local / api / firebase)이든 아래 메서드를 똑같이 제공합니다.
//
//   mode, needsAuth
//   getCurrentUser()            -> { id, name } | null
//   signup({ email, password, name }), login({ email, password }), logout()
//   listPublic()                -> 공개 글 목록 (최신순)
//   listMine()                  -> 내 글 목록 (최신순)
//   get(id)                     -> 글 하나 | null (없거나 볼 권한이 없을 때)
//   create(data) / update(id, data) -> 저장된 글
//   remove(id)
// =====================================================
import { STORAGE_MODE } from "../config.js";

const loaders = {
    local: () => import("./local.js"),
    api: () => import("./api.js"),
    firebase: () => import("./firebase.js")
};

async function loadStorage() {
    const loader = loaders[STORAGE_MODE];
    if (!loader) {
        throw new Error(`알 수 없는 STORAGE_MODE: "${STORAGE_MODE}" (local / api / firebase 중 하나여야 해요)`);
    }
    const module = await loader();
    return module.default;
}

let storage;
try {
    storage = await loadStorage();
} catch (error) {
    // 설정 오류는 화면 맨 위에 바로 보여줍니다.
    const banner = document.createElement("div");
    banner.className = "config-error";
    banner.textContent = `저장소를 불러오지 못했어요: ${error.message}`;
    document.body.prepend(banner);
    throw error;
}

export { storage };
