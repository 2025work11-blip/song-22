# 공통 화면 개발 규칙

- 상단 스티키배너, Drawer 메뉴, 하단 다크모드 버튼은 모든 기존·신규 페이지에 동일하게 적용한다.
- 공통 마크업은 `js/layout.js`, 스타일은 `css/style.css`와 `css/theme.css`, 동작은 기존 공통 스크립트에서 관리한다. 공통 영역 변경을 특정 페이지에만 반영하지 않는다.
- 모든 새 HTML 페이지에 `<div data-site-header></div>`, `<div data-site-drawer></div>`, `<div data-site-footer></div>`를 넣는다. 헤더와 Drawer는 본문 앞, 푸터는 본문 뒤에 배치한다.
- `js/layout.js`를 `defer`로 연결하고 다른 모든 defer 스크립트보다 먼저 둔다. 공통 영역은 초기화 전에 생성되어야 한다.
- `js/theme.js`는 기존 페이지처럼 head에서 CSS보다 먼저 연결하고, 공통 CSS·설정·common.js·language.js·Supabase·auth.js 등의 순서는 기존 페이지를 따른다.
- 다크모드 버튼은 각 페이지의 푸터에 같은 모양으로 표시하며 테마 선택은 페이지 이동과 새로고침 후에도 유지한다.
- 공통 영역 변경 후 모든 HTML 페이지의 연결과 중복 여부를 확인하고 로그인 상태 표시, 언어 전환, Drawer, 테마 동작을 보존한다.
- HTML + CSS + 일반 JavaScript 정적 구조를 유지한다. 별도 빌드 도구나 프레임워크를 추가하지 않는다.

- 공통 푸터에는 다크모드 버튼 옆의 링크 공유 버튼도 포함한다. 모든 페이지에서 js/share.js를 layout.js·config.js 뒤에 defer로 연결하며 공유 대상은 항상 메인 index.html로 유지한다.
