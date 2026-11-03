// =====================================================
// Dearly 설정 파일
// 저장 방식을 바꾸려면 STORAGE_MODE 한 줄만 바꾸면 됩니다.
//   "local"    : 브라우저 localStorage (서버 필요 없음, 1단계)
//   "api"      : 직접 만든 Node/Express 서버 (2단계, server/ 폴더)
//   "firebase" : Firebase Auth + Firestore (3단계)
// =====================================================
export const STORAGE_MODE = "local";

// "api" 모드에서 사용할 백엔드 주소
export const API_BASE = "http://localhost:3000";

// "firebase" 모드에서 사용할 설정
// Firebase 콘솔 > 프로젝트 설정 > 내 앱 > SDK 설정에서 복사해 붙여넣으세요.
export const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// 카테고리와 기분 목록 (화면과 검증에서 같이 사용)
export const CATEGORIES = ["일상", "생각", "여행", "기타"];
export const MOODS = ["😊", "😐", "😢", "😡", "😴"];
