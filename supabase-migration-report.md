# Supabase 서울 이전 검증 기록

확인일: 2026-11-05 (한국 시간)

- 원본: `2025work11-blip's Project`, `jhrygpmughystzskasaq`, 런던 `eu-west-2`.
- 대상: `jeileye-2`, `yzrpwqkcpkqimfpuexqd`, 서울 `ap-northeast-2`.
- 원본 프로젝트는 유지했으며 원본에는 조회만 수행했습니다.
- 대상에 스키마 마이그레이션 `migrate_london_schema_to_seoul`을 적용했습니다.

| 대상 | 원본 | 서울 | 검증 |
| --- | ---: | ---: | --- |
| doctors | 4 | 4 | 전체 내용 해시 일치 |
| doctor_weekly_schedules | 15 | 15 | 전체 내용 해시 일치 |
| doctor_date_schedules | 0 | 0 | 전체 내용 해시 일치 |
| doctor_closures | 3 | 3 | 전체 내용 해시 일치 |
| notices | 2 | 2 | 전체 내용 해시 일치 |
| blog_posts | 2 | 2 | 전체 내용 해시 일치 |
| profiles | 2 | 2 | 전체 내용 해시 일치 |
| auth.users | 2 | 2 | 전체 내용 해시 일치 |
| auth.identities | 2 | 2 | 전체 내용 해시 일치 |
| storage.buckets | 1 | 1 | 전체 내용 해시 일치 |
| storage.objects | 0 | 0 | 원본 파일 없음 |

업무 테이블은 7개, 총 28행입니다. 계정 ID, 비밀번호 해시, 이메일 인증 상태, 관리자 역할을 보존했습니다. 기존 세션은 복사하지 않았으므로 서울로 전환하면 다시 로그인해야 합니다.

공지의 image_url은 모두 비어 있고 블로그 content_html에 img 요소가 없습니다. Supabase 저장소에는 사진 파일이 없습니다. 저장소 `blog-images`의 공개 여부, 크기·형식 제한과 접근 정책을 복사했습니다. 저장소의 정적 사진 assets는 변경하지 않았습니다.

정책 37개, 제약 조건, 함수와 트리거의 정의·함수 권한 해시가 원본과 일치합니다. 자동 증가 시퀀스도 원본 값으로 맞췄습니다.

검증 결과:

- 서울 REST API에서 공개 데이터 6개 테이블 조회 HTTP 200 및 행 수 확인.
- 익명 사용자 쓰기 차단, 일반 회원의 타인 프로필 조회·관리자 데이터 수정 차단 확인.
- 관리자 계정의 profiles.role 조회와 업무 데이터 수정 허용 확인.
- 신규 auth.users 삽입 시 user 역할의 profiles가 자동 생성됨을 확인.
- 쓰기 검증은 롤백했으며 테스트 계정과 업무 데이터 변경은 남기지 않았습니다.
- 공개 Auth 설정의 이메일 로그인·회원가입·인증메일 요구 여부가 양쪽에서 같습니다.
- 실제 비밀번호 로그인은 수행하지 않았습니다.
- 보안 점검은 유출 비밀번호 보호 비활성 경고 1건을 반환했습니다. 기존 정책은 변경하지 않았습니다. 참고: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- 성능 점검은 기존 SELECT 허용 정책 중복과 아직 사용되지 않은 블로그 인덱스를 알렸습니다. 참고: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

홈페이지 변경:

- `js/supabase-client.js`의 URL과 공개 키를 서울 프로젝트로 교체했습니다.
- 공유 링크·미리보기의 홈페이지 주소를 사용자가 확인한 `https://jeileye.vercel.app/`로 맞췄습니다.
- 공통 레이아웃과 인증 스크립트의 포함 구조를 보존했습니다.
- 운영 배포 및 서울 Auth의 Site URL/Redirect URLs 대시보드 확인은 아직 완료하지 못했습니다.
- 마지막 운영 확인에서 `https://jeileye.vercel.app/js/supabase-client.js`는 원본 런던 프로젝트를 사용했습니다.

배포 전 남은 작업:

1. 서울 Auth의 Site URL이 실제 홈페이지이고, Redirect URLs가 `https://jeileye.vercel.app/login.html`을 허용하는지 확인합니다.
2. 이 저장소 변경을 실제 Vercel 프로젝트에 배포합니다.
3. 운영 스크립트가 서울 URL을 사용하는지 확인하고 기존 계정으로 로그인·관리자 진입을 확인합니다.
4. 운영 사이트가 런던에 계속 쓰는 동안 데이터가 바뀌었다면 전환 직전에 추가 변경분을 다시 대조합니다.

원본 유지 및 복구:

원본 프로젝트는 삭제·중단하지 않았습니다. 전환 이후 서울에 새 데이터가 생기면 런던으로 복구하기 전에 변경분을 확인해야 합니다. 연결을 되돌릴 때는 `js/supabase-client.js`의 projectUrl 및 publishableKey를 이전 버전 값으로 함께 복원해 재배포합니다. 비밀번호 해시·개인 계정 데이터·서버 비밀 키는 이 저장소에 저장하지 않았습니다.

