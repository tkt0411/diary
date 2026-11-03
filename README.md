# Dearly. — 나의 기록

일기를 쓰고, 원하는 글만 공개해서 다른 사람과 나누는 다이어리 웹앱입니다.
순수 HTML/CSS/JavaScript(ES Modules)로 만들었고, **저장 방식을 3가지 중에서 골라 쓸 수 있게** 설계했습니다.

| 단계 | 모드 | 저장 위치 | 로그인 | 필요한 것 |
|---|---|---|---|---|
| 1 | `local` | 브라우저 localStorage | 없음 (나 혼자) | 정적 서버만 있으면 됨 |
| 2 | `api` | 직접 만든 Node/Express + SQLite 서버 | 이메일/비밀번호 (JWT) | Node.js 22.5 이상 |
| 3 | `firebase` | Firebase Firestore | Firebase Authentication | Firebase 프로젝트 |

모드는 `js/config.js`의 `STORAGE_MODE` 한 줄로 바꿉니다. 화면 코드는 그대로예요.

## 기능

- 홈: 최신 공개 글 목록
- 내 일기: 내가 쓴 글 전체(공개/비공개), 검색, 카테고리·공개 여부 필터
- 글쓰기 / 수정 / 삭제: 제목, 내용, 카테고리, 오늘의 기분(이모지), 공개 여부
- 글 상세 보기: 비공개 글은 작성자만 볼 수 있음
- 로그인 / 회원가입 (`api`, `firebase` 모드)

## 폴더 구조

```
index.html  diary.html  write.html  post.html  login.html
style.css
js/
  config.js            ← 저장 방식 선택, API 주소, Firebase 설정
  common.js            ← 헤더, 로그인 확인, 카드 만들기 등 공통 기능
  pages/               ← 페이지별 스크립트 (home, diary, write, post, login)
  storage/
    index.js           ← config에 따라 아래 셋 중 하나를 불러옴
    local.js           ← 1단계
    api.js             ← 2단계 (서버와 통신)
    firebase.js        ← 3단계
    entry.js           ← 입력값 검증 공통 함수
server/                ← 2단계 백엔드 (Express + SQLite)
firestore.rules        ← 3단계 Firestore 보안 규칙
```

모든 저장소는 같은 메서드를 제공합니다:
`getCurrentUser, signup, login, logout, listPublic, listMine, get, create, update, remove`

## 실행 방법

> ES Modules를 쓰기 때문에 `index.html`을 더블클릭(file://)으로 열면 동작하지 않아요. 아래처럼 서버로 열어 주세요.

### 1단계: local

`js/config.js`에서 `STORAGE_MODE = "local"`로 설정한 뒤 정적 서버로 엽니다.

- VS Code **Live Server** 확장 → `index.html` 우클릭 → Open with Live Server
- 또는 터미널: `npx serve .`

처음 열면 예시 글 3개가 들어 있어요. 데이터는 그 브라우저에만 저장됩니다.

### 2단계: api (Node/Express + SQLite)

```bash
cd server
npm install
npm start          # 개발 중에는 npm run dev (파일 바꾸면 자동 재시작)
```

`js/config.js`에서 `STORAGE_MODE = "api"`로 바꾸고 http://localhost:3000 을 엽니다.
(서버가 프론트엔드 파일도 같이 서빙해요. Live Server로 열어도 `API_BASE`로 통신합니다.)

- DB 파일: `server/data/dearly.db` (git에는 올라가지 않음)
- 배포할 때는 환경변수 `JWT_SECRET`을 꼭 설정하세요.

| 메서드 | 경로 | 설명 | 로그인 |
|---|---|---|---|
| POST | `/api/auth/signup` | 회원가입 → `{ token, user }` | |
| POST | `/api/auth/login` | 로그인 → `{ token, user }` | |
| GET | `/api/auth/me` | 내 정보 | ✅ |
| GET | `/api/entries/public` | 공개 글 목록 | |
| GET | `/api/entries/mine` | 내 글 목록 | ✅ |
| GET | `/api/entries/:id` | 글 하나 (비공개는 작성자만) | |
| POST | `/api/entries` | 글 작성 | ✅ |
| PUT | `/api/entries/:id` | 글 수정 (작성자만) | ✅ |
| DELETE | `/api/entries/:id` | 글 삭제 (작성자만) | ✅ |

로그인이 필요한 요청은 `Authorization: Bearer <token>` 헤더를 붙입니다.

### 3단계: firebase

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트를 만듭니다.
2. **Authentication** → 로그인 방법 → **이메일/비밀번호** 사용 설정
3. **Firestore Database** 만들기 → **규칙** 탭에 `firestore.rules` 내용을 붙여넣고 게시
4. 프로젝트 설정 → 내 앱 → 웹 앱 추가 → 나오는 `firebaseConfig` 값을 `js/config.js`에 붙여넣기
5. `STORAGE_MODE = "firebase"`로 바꾸고 Live Server 등으로 열기

> `firebaseConfig`의 apiKey는 공개돼도 괜찮은 값이에요. 데이터 보호는 `firestore.rules`가 담당합니다.

## 배포

- `local` / `firebase` 모드: 정적 파일만 있으면 되므로 **GitHub Pages**, Firebase Hosting, Netlify 등에 바로 올릴 수 있어요.
- `api` 모드: 서버가 필요하므로 Render, Railway, fly.io 같은 Node 호스팅에 `server/`를 배포하고 `API_BASE`를 그 주소로 바꿉니다.
