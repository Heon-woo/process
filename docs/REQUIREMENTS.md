# PASS 요구사항

## 목적

PASS는 공정 변경 신청·협의·승인을 담당하는 PAS와 승인 이후 실제 적용 및 이상 여부를 관리하는 CPMS를 하나의 포털로 통합한다.

- PAS: PCCB Automation System
- PCCB: Process Change Committee Board
- CPMS: Change Point Management System

기존 Goodocs Sheet의 실시간 공동 작업 장점은 유지하면서 고정된 UI, 데이터 유실 위험, 기능 확장 한계를 Web Application으로 해결한다.

## 기술 기준

- Frontend: React 18, Node.js 20, Vite, pnpm
- Backend: Python 3.10/3.11, FastAPI
- Prototype DB: SQLite
- 데이터 호출 및 전처리: Python
- 저장소: `frontend`, `backend` 모노레포

## 통합 홈

- 진행 중 협의, 승인 완료율, 후속 확인 필요 건수, 평균 Lead Time
- 변경 신청 → 부서 협의 → 승인/적용 → 변경점 관리 Workflow
- 최근 PAS 신청과 확인이 필요한 CPMS 변경점
- PAS/CPMS 최근 및 다음 데이터 갱신 시간

## PAS

- Product/Tech 필터와 공정, Device, 기안 번호 검색
- 신청일 범위와 컬럼별 필터
- Excel과 유사한 Sheet UI
- 다중 컬럼 고정/해제, 이동, 너비 변경
- Product/Tech별 컬럼명, 노출 여부, 고정 상태 저장
- 담당자 또는 관리자만 Sheet 구성 변경
- 셀 더블 클릭 편집과 즉시 저장
- 사용자 행 추가/삭제
- WebSocket 기반 변경 알림과 접속 인원 표시
- 사용자 파일 업로드 및 시스템 자동 등록 파일 이력
- Excel, CSV, PDF, 이미지 지원
- Data Lake 배치 주기에 맞춘 1시간 단위 갱신 모델

주요 컬럼:

- 기안 번호, Product, Tech, 공정, Device, 변경 제목
- 기안자, 담당팀, 진행 상태, 중요도
- 신청일, 목표일, 변경 유형, 장비, Recipe, 협의 메모

## CPMS

- Product/Tech, 공정, Device, 기안 번호, 승인일 필터
- 행 추가/삭제는 승인 데이터 배치로만 처리
- 담당자 또는 관리자만 구분자 등 지정 컬럼 수정
- 행 선택 시 기안 정보, HiQ1 Comment, 승인일, 실제 적용일 상세 표시
- 구분자와 Others를 비교하는 Inline Data 시계열 차트
- 최근 측정값, Others 평균, 모니터링 판정 표시
- 기본 일 1회 갱신, 관리자 주기 변경 지원
- 향후 AI 판정을 위한 `ai_status`, `ai_link` 필드

## 관리자

- 사용자명, 소속, 모듈, 활동, 대상, 시간 감사 로그
- 활성 사용자, 모듈 사용량, API 상태, 배치 성공률 Dashboard
- PAS/CPMS 최근 실행, 다음 실행, 배치 주기 관리
- `SYSTEM_ADMIN`, `TECH_MANAGER`, `USER` 권한 모델

## 운영 확장

- Data Lake `hq1` 스키마 연동
- SQLite를 사내 표준 RDBMS로 교체
- 사내 SSO와 Product/Tech 담당자 권한 연결
- 사내 Job Scheduler 및 Object Storage 연동
- 감사 로그 보존 및 보안 정책 적용
- 유사 변경 검색, 협의 누락 점검, 이상 Trend 요약 AI Agent
