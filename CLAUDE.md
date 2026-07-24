# Claude Code 작업 규칙

## 개발 컨텍스트

- **이 프로젝트는 1인 개발이다.** 과도한 프로세스·추상화·조직적 오버헤드를 전제하지 말고, 1인 개발자가 유지보수·이해하기 쉬운 실용적 선택을 우선한다. 문서/코드 모두 "한 사람이 전체 맥락을 빠르게 되짚을 수 있는가"를 기준으로 작성한다.

## 아키텍처 문서 규칙 (IEEE 42010 기반)

**아키텍처 문서는 `docs/architecture/`에 IEEE 42010(ISO/IEC/IEEE 42010) 기준으로 관리한다.**

- 구조: `00-overview`(stakeholders/concerns/viewpoints) · `01-domain` · `02-data` · `03-process` · `04-interface` · `05-architecture`(C4) · `06-quality`
- 다이어그램 표기법은 **Mermaid**를 사용한다.
- **개발을 진행할 때마다(기능 추가·수정·리팩토링·스키마 변경 등) 영향을 받는 아키텍처 문서를 함께 업데이트한다.** 코드와 문서가 어긋난 채로 커밋하지 않는다.
- 예: 도메인/비즈니스 룰 변경 → `01-domain`, DB 스키마·마이그레이션 변경 → `02-data`, API/서버액션 변경 → `04-interface`, 컴포넌트·배포 구조 변경 → `05-architecture`.

## 커밋 규칙

**작업 단위마다 커밋을 생성한다.**

### 커밋 타이밍
- 하나의 기능/수정/리팩토링이 완료될 때마다 즉시 커밋
- 여러 작업을 묶어서 한 번에 커밋하지 않는다
- 작업 도중 다른 작업으로 넘어가기 전에 반드시 커밋

### 커밋 메시지 형식
```
<이모지> <한 줄 요약>

- 변경사항 1
- 변경사항 2

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
```

### 커밋 이모지 가이드
| 이모지 | 용도 |
|--------|------|
| ✨ | 새 기능 추가 |
| 🐛 | 버그 수정 |
| ♻️ | 리팩토링 |
| 💄 | UI/스타일 변경 |
| 🔧 | 설정/환경 변경 |
| 📦 | 패키지/의존성 변경 |
| 🗑️ | 코드/파일 삭제 |
| 🔒 | 보안 관련 수정 |
| ⚡ | 성능 개선 |
| 📝 | 문서 수정 |

### 커밋 범위
- 관련 없는 파일을 같은 커밋에 포함하지 않는다
- `.cursor/`, `images/`, `screenshots/`, `response.txt` 등 임시 파일은 커밋에 포함하지 않는다
