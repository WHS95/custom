# Claude Code 작업 규칙

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
