
const posts = [
    {
        id: 1,
        category: "일상",
        title: "오늘의 노을이 정말 예뻤다",
        content: "하루가 끝나가는 시간이 이렇게 아름다울 줄이야. 오랜만에 마음이 편안해졌다.",
        date: "2026.10.25"
    },
    {
        id: 2,
        category: "생각",
        title: "새로운 시작을 준비하며",
        content: "지금까지 해온 것들을 돌아보며 앞으로 더 좋은 방향으로 나아가고 싶다.",
        date: "2026.10.24"
    },
    {
        id: 3,
        category: "여행",
        title: "주말에 다녀온 작은 여행",
        content: "맑은 공기와 푸른 나무 덕분에 일상의 스트레스를 잠시 잊을 수 있었다.",
        date: "2026.10.22"
    }
];

// HTML 요소 선택
const postList = document.querySelector("#post-list");
const postCount = document.querySelector("#post-count");

// 게시글 개수 표시
postCount.textContent = `총 ${posts.length}개의 글`;

// 게시글 카드 생성
posts.forEach(function(post) {
    // 카드 요소 생성
    const card = document.createElement("article");
    card.className = "post-card";

    // 카테고리
    const category = document.createElement("span");
    category.className = "category";
    category.textContent = post.category;

    // 제목
    const title = document.createElement("h3");
    title.textContent = post.title;

    // 본문
    const content = document.createElement("p");
    content.className = "post-content";
    content.textContent = post.content;

    // 작성일
    const date = document.createElement("p");
    date.className = "post-date";
    date.textContent = post.date;

    // 카드에 요소 추가
    card.append(category, title, content, date);

    // 게시글 목록에 카드 추가
    postList.appendChild(card);
});
