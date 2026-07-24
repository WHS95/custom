# 관점 (Viewpoints)

**Viewpoint**은 특정 관심사를 표현하기 위한 규칙(표기법·대상 독자·모델 종류)이다.
**View**는 이 규칙을 실제 시스템에 적용해 만든 문서다. 이 프로젝트는 표기법으로 **Mermaid**를
기본 사용한다.

| Viewpoint | 대응 Concern | 표기법/모델 | 산출 View |
|-----------|--------------|-------------|-----------|
| 도메인 관점 | C1, C2, C3 | 용어집 + 규칙표 + 유스케이스 목록 | `01-domain/glossary.md`, `business-rule.md`, `usecase.md` |
| 데이터 관점 | C4 | Mermaid ERD + 테이블 명세표 | `02-data/erd.md`, `table.md` |
| 프로세스(동적) 관점 | C2, C5, C6 | Mermaid sequenceDiagram | `03-process/sequence.md` |
| 인터페이스 관점 | C6, C7 | HTTP 엔드포인트/서버액션 계약표 | `04-interface/api.md` |
| 정적 구조 관점 (C4 Model) | C8, C11 | Mermaid flowchart (C4 4레벨 중 3레벨) | `05-architecture/c4-*.md` |
| 배포 관점 | C8, C9 | Mermaid deployment 다이어그램 | `05-architecture/deployment.md` |
| 품질 관점 | C9~C12 | 품질속성 시나리오표 | `06-quality/quality-attribute.md` |

## 표기 규칙

- 모든 다이어그램은 Mermaid 코드블록으로 작성하여 GitHub/뷰어에서 바로 렌더링되게 한다.
- C4 Model은 Context(L1)·Container(L2)·Component(L3)까지 작성한다. Code(L4)는 코드 자체로 대체.
- 각 View는 근거가 되는 **실제 파일 경로**를 함께 명시하여 코드-문서 추적성을 확보한다.
- 상태·열거형은 코드의 enum/label 정의를 단일 출처(single source of truth)로 삼는다.

## 이 AD가 따르지 않는 것 (범위 제외)

- 조직/팀 구조 View (1인 개발이므로 불필요)
- 상세 UI 디자인 스펙 → 별도 `docs/design-system/` 에서 관리
- 코드 레벨(L4) 다이어그램 → 코드가 곧 문서
