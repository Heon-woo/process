# PASS

PASS(Process Automation Support Service)는 공정 변경 협의 시스템 PAS와 변경점 후속 관리 시스템 CPMS를 하나의 포털로 통합한 Web Prototype입니다.

> 현재 버전은 DRAM/NAND 샘플 데이터를 사용하는 Prototype입니다. 사내 Data Lake, SSO, 운영 DB 연동 지점은 분리되어 있습니다.

## 주요 기능

### PAS

- Product / Tech 범위 필터와 공정, Device, 기안 번호 검색
- Excel과 유사한 Sheet UI 및 컬럼별 필터
- 다중 컬럼 고정/해제, 드래그 이동, 너비 변경
- Product / Tech별 컬럼명, 노출 여부, 고정 상태 저장
- 셀 더블 클릭 편집과 즉시 저장
- 사용자 행 추가/삭제
- Excel, CSV, PDF, 이미지 파일 업로드 및 이력 확인
- 1시간 단위 Data Lake 배치 설정 모델

### CPMS

- Product / Tech 범위 필터와 승인일 검색
- 자동 생성/삭제되는 변경점 목록
- 담당자 전용 구분자 수정
- 행별 기본 정보, HiQ1 Comment, 적용일 상세 조회
- 구분자와 Others를 비교하는 Inline 시계열 차트
- 향후 AI 판정 결과와 링크를 연결할 수 있는 데이터 필드
- 일 1회 배치 주기 및 관리자 변경 기능

### 관리자

- 사용자 활동 로그와 모듈별 사용 현황
- PAS / CPMS 배치 상태 및 주기 설정
- 운영 KPI와 시스템 상태 확인

## 기술 구성

```text
PASS/
├── frontend/          React 18 + Vite
├── backend/           FastAPI + SQLite prototype
│   ├── app/routers/   PAS, CPMS, Admin API
│   └── data/          로컬 DB와 업로드 파일
├── docs/              요구사항, 아키텍처, Windows 가이드
└── scripts/           macOS / Windows 실행 스크립트
```

- Frontend: React 18, Vite 5, Node.js 20, pnpm 9
- Backend: Python 3.10/3.11, FastAPI
- Prototype DB: SQLite
- 운영 전환 권장 DB: 사내 표준 RDBMS(PostgreSQL 계열 권장)

## 저장소 받기

```bash
git clone https://github.com/Heon-woo/process.git
cd process
```

## macOS 실행

Finder에서 아래 파일을 순서대로 실행합니다.

1. `scripts/setup_mac.command`
2. `scripts/start_mac.command`

터미널에서는 다음과 같이 실행할 수 있습니다.

```bash
chmod +x scripts/*.command
./scripts/setup_mac.command
./scripts/start_mac.command
```

Mac에 기본 설치된 Python이 3.9인 경우 Python 3.11을 먼저 설치해야 합니다. 설정 스크립트는 Python 3.10 또는 3.11만 선택합니다.

## Windows 실행

1. Node.js 20과 Python 3.10 또는 3.11을 설치합니다.
2. `scripts\setup_windows.bat`를 실행합니다.
3. 설치 완료 후 `scripts\start_windows.bat`를 실행합니다.

상세 절차와 사내망 오류 대응은 [Windows 설치 가이드](docs/WINDOWS_SETUP.md)를 참고하세요.

접속 주소:

- PASS Portal: <http://localhost:5173>
- FastAPI Swagger: <http://localhost:8000/docs>
- Health Check: <http://localhost:8000/api/health>

백엔드 테스트:

```bash
cd backend
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
```

테스트는 임시 SQLite DB와 업로드 경로를 사용하므로 로컬 Prototype 데이터를 변경하지 않습니다.

## Prototype 데이터

첫 백엔드 실행 시 `backend/data/pass.db`가 자동 생성되고 DRAM/NAND 샘플 데이터가 입력됩니다. 초기화하려면 서버 종료 후 해당 DB 파일만 삭제하고 다시 실행합니다.

`PASS_DB_PATH`와 `PASS_UPLOAD_DIR` 환경변수로 DB 및 업로드 경로를 변경할 수 있습니다.

업로드 파일은 `backend/data/uploads`에 저장됩니다. 운영 환경에서는 사내 Object Storage 또는 문서 저장소로 교체해야 합니다.

## 사내 환경 연동 지점

1. `backend/app/database.py`의 SQLite 연결을 사내 DB Repository로 교체
2. 기존 JupyterLab Python 전처리 코드를 별도 ETL 모듈 또는 배치 작업으로 이관
3. `batch_settings`의 Cron 표현식을 사내 Job Scheduler와 연결
4. 사내 SSO/권한 API를 연결해 `SYSTEM_ADMIN`, `TECH_MANAGER`, `USER` 역할 적용
5. Product / Tech 담당자 Master와 컬럼 설정 권한 연결
6. CPMS `inline_points` 적재를 Data Lake hq1 조회 결과와 연결
7. 사용자 로그를 사내 감사 정책에 맞는 보존 DB로 이관

## AI Agent 확장 구조

CPMS 데이터에는 `ai_status`, `ai_link` 필드가 준비되어 있습니다. 다음 단계에서 AI 판정 API를 별도 서비스로 추가하고, PASS 백엔드가 판정 결과와 근거 링크를 조회하는 구조로 확장할 수 있습니다. 권장 초기 Agent 기능은 과거 유사 변경 검색, 협의 누락 항목 점검, 승인 후 이상 Trend 요약입니다.

## 문서

- [전체 요구사항](docs/REQUIREMENTS.md)
- [아키텍처](docs/ARCHITECTURE.md)
- [Windows 설치 가이드](docs/WINDOWS_SETUP.md)

## 현재 검증 결과

- FastAPI 테스트: 11 passed
- React production build: 성공
- 통합 홈, PAS Sheet, 컬럼 설정, CPMS 상세 차트 브라우저 검증 완료
- PAS WebSocket 다중 연결 테스트 완료
