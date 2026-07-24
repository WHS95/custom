# RunHouse Custom — 아키텍처 문서 (Architecture Description)

이 디렉터리는 **RunHouse Custom**(런하우스 커스텀 굿즈 커머스) 서비스의 아키텍처를
**ISO/IEC/IEEE 42010** 기준으로 기술한 문서 집합(Architecture Description, AD)이다.

IEEE 42010은 "무엇을 만드는가(설계)"가 아니라 "아키텍처를 이해관계자에게 어떻게 일관되게
설명하는가(기술)"를 표준화한다. 특정 표기법(UML/C4/ERD)을 강제하지 않으며, 대신
**누구를 위해(Stakeholder) · 무엇이 궁금한지(Concern) · 어떤 관점으로 표현하는지(Viewpoint) ·
실제 문서(View)** 를 명확히 하도록 요구한다.

```
Stakeholder → Concern → Viewpoint → View → Architecture Description
```

## 문서 구조 (Viewpoint → View 매핑)

| 폴더 | Viewpoint | 대응 View 문서 | 주요 Concern |
|------|-----------|----------------|--------------|
| `00-overview/` | 프레이밍(누구/무엇/왜) | stakeholders, concerns, viewpoints | 문서 전체의 근거 |
| `01-domain/` | 도메인 관점 | glossary, business-rule, usecase | 비즈니스 규칙·유비쿼터스 언어 |
| `02-data/` | 데이터 관점 | erd, table | 데이터 모델·무결성 |
| `03-process/` | 동적/행위 관점 | sequence | 주문·SSO·결제 흐름 |
| `04-interface/` | 인터페이스 관점 | api | 외부 노출 계약(HTTP/서버액션) |
| `05-architecture/` | 정적 구조 관점 (C4) | c4-context, c4-container, c4-component, deployment | 컴포넌트 구조·배포 |
| `06-quality/` | 품질 관점 | quality-attribute | 성능·보안·유지보수성 |

## 시스템 한 줄 요약

Next.js 16(App Router, React 19) + Supabase(Postgres 스키마 `runhousecustom`) 기반의
**멀티테넌트 커스텀 의류/모자 커머스**. 러닝 크루가 스튜디오에서 굿즈를 디자인하고, 개별 주문
또는 크루 단위 사이즈 취합/크루 스토어를 통해 주문한다. 결제는 외부 Groble 링크 + 웹훅 정산,
크루 인증은 RunningCrewMap IdP와의 SSO로 연동된다.

> ⚠️ **유지보수 규칙**: 이 문서는 코드와 동기화되어야 한다. 기능 추가·수정·스키마 변경 시
> 영향을 받는 View 문서를 함께 갱신한다. (프로젝트 루트 `CLAUDE.md`의 "아키텍처 문서 규칙" 참고)

## 개발 컨텍스트

**1인 개발 프로젝트.** 문서는 완결성보다 "한 사람이 전체 맥락을 빠르게 되짚을 수 있는가"를
우선한다. 과한 프로세스·조직적 View는 의도적으로 생략한다.
