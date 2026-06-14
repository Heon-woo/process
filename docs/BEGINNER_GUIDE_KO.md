# PASS 초보자용 개발·실행 가이드

이 문서는 웹 개발, VS Code, Git을 처음 사용하는 사람도 PASS를 내려받아 실행하고 기본적인 파일 구조를 이해할 수 있도록 작성되었습니다.

## 1. 먼저 알아둘 용어

- **VS Code**: PASS의 파일을 보고 수정하며 명령어를 실행하는 프로그램입니다.
- **Git**: 파일의 변경 이력을 저장하는 도구입니다.
- **GitHub**: Git으로 관리하는 파일을 인터넷에 보관하고 공유하는 서비스입니다.
- **Repository(저장소, Repo)**: 하나의 프로젝트와 변경 이력이 들어 있는 폴더입니다.
- **Frontend**: 브라우저에 보이는 화면입니다. PASS는 React를 사용합니다.
- **Backend**: 데이터 저장, 조회, 수정과 권한 처리를 담당하는 서버입니다. PASS는 FastAPI를 사용합니다.
- **Terminal(터미널)**: 명령어를 입력하는 창입니다. VS Code 안에서도 열 수 있습니다.
- **localhost**: 현재 사용 중인 내 컴퓨터를 뜻합니다. 인터넷에 공개된 주소가 아닙니다.

PASS를 실행하면 Frontend와 Backend가 동시에 동작합니다.

```text
웹 브라우저(사용자 화면)
        ↓
Frontend: http://localhost:5173
        ↓ API 요청
Backend:  http://localhost:8000
        ↓
SQLite 샘플 DB: backend/data/pass.db
```

## 2. 필요한 프로그램

### 공통

1. **Visual Studio Code**
   - <https://code.visualstudio.com/>
2. **Git**
   - <https://git-scm.com/downloads>
3. **Node.js 20 LTS**
   - <https://nodejs.org/>
4. **Python 3.10 또는 3.11**
   - <https://www.python.org/downloads/>

Python 3.12 이상이 이미 설치되어 있어도 이 프로젝트에는 Python 3.10 또는 3.11을 사용하세요.

### 설치 확인

VS Code를 열고 상단 메뉴에서 `Terminal > New Terminal`을 선택한 다음 아래 명령을 한 줄씩 입력합니다.

```text
git --version
node --version
python3 --version     # Mac
py -3.11 --version   # Windows
```

- Node.js 결과가 `v20...`으로 시작하면 정상입니다.
- Python 결과가 `3.10...` 또는 `3.11...`이면 정상입니다.
- 명령을 찾을 수 없다는 메시지가 나오면 해당 프로그램을 설치한 후 VS Code를 완전히 종료했다가 다시 여세요.
- 사내 PC에서 설치 권한이 없다면 Software Center 또는 IT 담당자를 통해 설치해야 합니다.

## 3. GitHub에서 PASS 내려받기

저장소 주소는 <https://github.com/Heon-woo/process>입니다.

### 방법 A: VS Code 화면으로 받기

1. VS Code를 실행합니다.
2. 왼쪽의 **Source Control(가지 모양 아이콘)**을 누릅니다.
3. `Clone Repository`를 누릅니다.
4. 아래 주소를 입력합니다.

   ```text
   https://github.com/Heon-woo/process.git
   ```

5. 프로젝트를 저장할 상위 폴더를 선택합니다.
6. 다운로드가 끝나면 `Open`을 누릅니다.
7. 보안 확인 창이 나오면 저장소 주소를 확인한 후 `Yes, I trust the authors`를 선택합니다.

### 방법 B: VS Code 터미널로 받기

원하는 상위 폴더에서 다음 명령을 실행합니다.

```bash
git clone https://github.com/Heon-woo/process.git
cd process
code .
```

`code` 명령을 찾을 수 없으면 VS Code에서 `File > Open Folder`를 누르고 내려받은 `process` 폴더를 선택하면 됩니다.

### ZIP 다운로드와 Git Clone의 차이

- GitHub의 `Download ZIP`도 실행은 가능하지만 Git 변경 이력과 연결 정보가 없습니다.
- 앞으로 수정 내용을 받고 올릴 계획이라면 `git clone`을 권장합니다.
- 저장소가 공개 상태라면 내려받을 때는 GitHub 로그인이 필요하지 않습니다.
- 변경 내용을 GitHub에 올리려면 해당 저장소에 쓰기 권한이 있는 GitHub 계정으로 로그인해야 합니다.

## 4. VS Code에서 올바른 폴더 열기

VS Code 왼쪽 Explorer 최상단에 다음 항목이 같이 보여야 합니다.

```text
backend
frontend
docs
scripts
README.md
START_HERE_KO.txt
```

`backend`만 보이거나 `frontend`만 보인다면 하위 폴더를 잘못 연 것입니다. `File > Open Folder`에서 두 폴더가 모두 들어 있는 프로젝트 최상위 폴더를 다시 여세요.

## 5. Windows에서 최초 설정과 실행

### 최초 설정: 컴퓨터마다 한 번

1. VS Code에서 PASS 최상위 폴더를 엽니다.
2. `Terminal > New Terminal`을 누릅니다.
3. 아래 명령을 입력합니다.

```bat
.\scripts\setup_windows.bat
```

이 스크립트는 다음 작업을 자동으로 수행합니다.

- `backend\.venv` Python 가상환경 생성
- FastAPI 등 Backend 패키지 설치
- pnpm 준비
- React/Vite 등 Frontend 패키지 설치

`Setup completed.`가 표시되면 설치가 끝난 것입니다. 다운로드가 있으므로 몇 분 정도 걸릴 수 있습니다.

### PASS 실행: 사용할 때마다

```bat
.\scripts\start_windows.bat
```

Backend와 Frontend 명령 프롬프트 창이 각각 열리고 브라우저가 실행됩니다. 자동으로 열리지 않으면 브라우저 주소창에 <http://localhost:5173>을 입력하세요.

### PASS 종료

`PASS Backend`와 `PASS Frontend`라는 제목의 명령 프롬프트 창 두 개를 모두 닫으면 됩니다.

## 6. Mac에서 최초 설정과 실행

### 최초 설정: 컴퓨터마다 한 번

VS Code에서 PASS 최상위 폴더를 열고 `Terminal > New Terminal`을 누른 후 다음 명령을 실행합니다.

```bash
chmod +x scripts/*.command
./scripts/setup_mac.command
```

`Setup completed.`가 표시되면 설치가 끝난 것입니다.

### PASS 실행: 사용할 때마다

```bash
./scripts/start_mac.command
```

브라우저 주소창에 <http://localhost:5173>을 입력합니다.

### PASS 종료

실행 중인 VS Code 터미널을 클릭한 후 `Control + C`를 누릅니다. 터미널을 닫아도 종료됩니다.

## 7. 정상 실행 확인

아래 주소 세 개를 확인할 수 있습니다.

- PASS 화면: <http://localhost:5173>
- Backend API 설명 화면: <http://localhost:8000/docs>
- Backend 상태 확인: <http://localhost:8000/api/health>

상태 확인 주소에서 아래와 비슷한 내용이 보이면 Backend가 정상입니다.

```json
{"status":"ok","service":"PASS API","version":"0.1.0"}
```

PASS 화면 우측 상단의 서버 연결 표시가 정상인지 확인하고 PAS, CPMS, 관리자 메뉴를 차례로 열어 보세요.

## 8. 평소 작업 시작 순서

매일 작업을 시작할 때는 다음 순서가 안전합니다.

1. VS Code에서 PASS 폴더를 엽니다.
2. 터미널에서 현재 변경 상태를 확인합니다.
3. GitHub의 최신 내용을 받습니다.
4. PASS를 실행합니다.

```bash
git status
git pull
```

Windows:

```bat
.\scripts\start_windows.bat
```

Mac:

```bash
./scripts/start_mac.command
```

`git pull` 전에 수정 중인 파일이 있다면 먼저 커밋하거나 변경 내용을 별도로 확인하세요. 이해하지 못한 변경을 강제로 삭제하지 않는 것이 중요합니다.

## 9. 내가 수정한 내용을 GitHub에 올리기

### GitHub 로그인

1. VS Code 왼쪽 아래의 사람 모양 계정 아이콘을 누릅니다.
2. `Sign in with GitHub`를 선택합니다.
3. 브라우저에서 저장소 쓰기 권한이 있는 GitHub 계정으로 로그인하고 VS Code 연결을 승인합니다.

처음 커밋할 때 이름과 이메일 설정을 요구하면 터미널에서 아래처럼 입력합니다. 따옴표 안은 본인 정보로 바꾸세요.

```bash
git config --global user.name "본인 GitHub 이름"
git config --global user.email "본인 GitHub 이메일"
```

### 가장 기본적인 명령

```bash
git status
git add .
git commit -m "변경 내용을 짧게 설명"
git push
```

- `git status`: 어떤 파일이 변경되었는지 확인합니다.
- `git add .`: 현재 변경 파일을 다음 커밋에 포함합니다.
- `git commit`: 변경 이력을 내 컴퓨터에 저장합니다.
- `git push`: 저장한 커밋을 GitHub에 올립니다.
- `git pull`: GitHub의 최신 커밋을 내 컴퓨터로 가져옵니다.

VS Code 왼쪽의 Source Control 화면에서도 파일별 `+`, 메시지 입력, `Commit`, `Sync Changes` 버튼으로 같은 작업을 할 수 있습니다.

### 권장 작업 순서

```bash
git pull
git status
# 파일 수정 및 실행 확인
git add .
git commit -m "PAS 검색 기능 수정"
git push
```

`git push`에서 권한 오류가 발생하면 현재 로그인한 GitHub 계정이 `Heon-woo/process` 저장소에 쓰기 권한이 있는지 확인해야 합니다.

## 10. 폴더별 역할

```text
PASS/
├── backend/                 데이터와 API를 담당하는 Python 서버
├── frontend/                브라우저 화면을 담당하는 React 앱
├── docs/                    요구사항과 설명 문서
├── scripts/                 설치와 실행을 자동화하는 파일
├── README.md                프로젝트 전체 요약
├── START_HERE_KO.txt        초보자가 가장 먼저 읽는 짧은 안내
├── package.json             프로젝트 공통 Frontend 명령
├── pnpm-lock.yaml           설치할 Frontend 패키지 버전 고정
└── pnpm-workspace.yaml      pnpm이 frontend를 찾도록 하는 설정
```

### Backend

```text
backend/
├── app/
│   ├── main.py              FastAPI 시작점, Router와 WebSocket 연결
│   ├── auth.py              Prototype 사용자와 권한 처리
│   ├── database.py          SQLite 테이블 생성과 샘플 데이터 입력
│   ├── schemas.py           API 요청/응답 데이터 형식 정의
│   ├── services.py          공통 조회, 로그, 권한 보조 로직
│   ├── realtime.py          PAS 실시간 변경 알림 연결 관리
│   ├── seed_data.py         최초 실행 시 넣는 DRAM/NAND 샘플 데이터
│   └── routers/
│       ├── pas.py           PAS 조회, 추가, 수정, 삭제, 파일 API
│       ├── cpms.py          CPMS 목록, 상세, Inline 데이터 API
│       ├── admin.py         로그, 배치, 컬럼 설정 API
│       └── meta.py          Product/Tech 선택 정보와 사용자 정보 API
├── data/
│   ├── pass.db              실행 후 자동 생성되는 로컬 샘플 DB
│   └── uploads/             PAS에서 올린 파일이 저장되는 폴더
├── tests/                   Backend 자동 테스트
├── requirements.txt         실행에 필요한 Python 패키지 목록
└── requirements-dev.txt     테스트용 Python 패키지 목록
```

### Frontend

```text
frontend/
├── index.html               브라우저가 처음 읽는 HTML
├── package.json             React/Vite 패키지와 실행 명령
├── vite.config.js           개발 서버 포트와 Backend 연결 설정
└── src/
    ├── main.jsx             React 앱 시작점
    ├── App.jsx              전체 메뉴 전환과 공통 상태
    ├── styles.css           화면 색상, 크기, 배치 등 디자인
    ├── pages/
    │   ├── HomePage.jsx     PASS 통합 홈
    │   ├── PasPage.jsx      PAS Sheet 화면
    │   ├── CpmsPage.jsx     CPMS Sheet와 상세 차트 화면
    │   └── AdminPage.jsx    관리자 Dashboard
    ├── components/          여러 화면에서 재사용하는 UI 부품
    └── services/
        └── api.js           Frontend에서 Backend API를 호출하는 코드
```

### Docs와 Scripts

```text
docs/
├── BEGINNER_GUIDE_KO.md     현재 읽고 있는 초보자 가이드
├── REQUIREMENTS.md          PASS 업무·기능 요구사항
├── ARCHITECTURE.md          시스템 구조와 기술 구성
└── WINDOWS_SETUP.md         Windows 설치 핵심 요약

scripts/
├── setup_mac.command        Mac 최초 패키지 설치
├── start_mac.command        Mac Backend/Frontend 실행
├── setup_windows.bat        Windows 최초 패키지 설치
└── start_windows.bat        Windows Backend/Frontend 실행
```

## 11. 자동 생성되므로 GitHub에 올리지 않는 폴더

다음 항목은 설치 또는 실행할 때 각 컴퓨터에서 자동으로 만들어집니다.

- `backend/.venv`: Python 패키지와 가상환경
- `frontend/node_modules`: Frontend 패키지
- `frontend/dist`: Frontend 배포 빌드 결과
- `backend/data/pass.db`: 로컬 샘플 DB
- `backend/data/uploads` 안의 실제 업로드 파일

크기가 크거나 PC별 데이터가 들어 있으므로 GitHub에 올리지 않습니다. `.gitignore` 파일이 이 항목들을 자동으로 제외합니다.

## 12. 샘플 데이터 초기화

PASS를 종료한 뒤 아래 파일을 삭제하고 다시 실행하면 샘플 DB가 새로 생성됩니다.

```text
Windows: backend\data\pass.db
Mac:     backend/data/pass.db
```

이 작업은 로컬에서 입력하거나 수정한 Prototype 데이터를 모두 지웁니다. 필요한 데이터가 없는지 먼저 확인하세요.

## 13. 자주 발생하는 문제

### `python`, `py`, `node` 또는 `git`을 찾을 수 없음

프로그램이 설치되지 않았거나 설치 후 VS Code를 다시 열지 않은 경우입니다. 프로그램을 설치한 뒤 VS Code의 모든 창을 닫고 다시 실행하세요.

### `pnpm`을 찾을 수 없음

먼저 setup 스크립트를 다시 실행하세요. Node.js 20에 포함된 Corepack이 pnpm을 준비합니다.

### `Address already in use` 또는 포트 사용 중

이전에 실행한 PASS 터미널이 남아 있을 가능성이 큽니다. 기존 Backend/Frontend 터미널을 종료한 후 다시 실행하세요. PASS는 기본적으로 `5173`과 `8000` 포트를 사용합니다.

### 화면은 열리지만 서버 연결이 끊김으로 표시됨

Backend가 실행되지 않았을 수 있습니다.

1. Backend 터미널에 빨간 오류가 있는지 확인합니다.
2. <http://localhost:8000/api/health>를 엽니다.
3. setup 스크립트를 다시 실행한 후 start 스크립트를 실행합니다.

### 사내망에서 패키지 설치 실패

`pypi.org` 또는 `registry.npmjs.org` 접속이 차단된 환경일 수 있습니다. 사내 개발 환경 담당자에게 아래 정보를 요청해야 합니다.

- 사내 Python Package Index 주소
- 사내 NPM Registry 주소
- Proxy 주소
- 사내 인증서 설치 방법

`.venv`나 `node_modules`를 GitHub에 올려 해결하려고 하지 마세요. 운영체제와 PC 환경 차이 때문에 다른 컴퓨터에서 정상 동작하지 않을 수 있습니다.

### `git pull` 또는 `git push` 충돌

같은 파일의 같은 부분을 여러 사람이 수정했을 때 발생합니다. 충돌 문구를 보고 임의로 파일을 삭제하지 말고, 수정한 사람과 어떤 내용을 유지할지 확인한 후 해결하세요.

### Windows에서 경로를 찾을 수 없음

VS Code 터미널의 현재 위치가 PASS 최상위 폴더인지 확인합니다.

```bat
dir
```

출력에 `backend`, `frontend`, `scripts`가 함께 보여야 합니다.

## 14. 코드를 수정할 때 어디를 보면 되는가

- 화면 문구나 디자인 변경: `frontend/src`부터 확인
- PAS 화면 기능 변경: `frontend/src/pages/PasPage.jsx`
- CPMS 화면 기능 변경: `frontend/src/pages/CpmsPage.jsx`
- 관리자 화면 변경: `frontend/src/pages/AdminPage.jsx`
- 공통 표 기능 변경: `frontend/src/components/DataTable.jsx`
- 데이터 조회/저장 방식 변경: `backend/app/routers`와 `backend/app/services.py`
- DB 구조 변경: `backend/app/database.py`
- 샘플 데이터 변경: `backend/app/seed_data.py`
- Product/Tech 목록 변경: `backend/app/routers/meta.py`

Frontend 파일을 저장하면 브라우저 화면이 자동으로 새로 반영됩니다. Backend Python 파일을 저장해도 개발 서버가 자동으로 다시 시작됩니다.

## 15. 테스트와 빌드

기능 수정 후 최소한 아래 검증을 실행하는 것이 좋습니다.

### Backend 테스트

Windows:

```bat
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
cd ..
```

Mac:

```bash
cd backend
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
cd ..
```

### Frontend 배포 빌드

프로젝트 최상위 폴더에서 실행합니다.

```bash
pnpm build
```

테스트 결과에 `passed`, 빌드 결과에 `built in ...`이 표시되고 오류가 없으면 정상입니다.

## 16. 현재 Prototype의 범위

- 현재 DB는 사내 운영 DB가 아닌 로컬 SQLite입니다.
- DRAM/NAND 데이터는 샘플 데이터입니다.
- 인증은 실제 사내 SSO가 아닌 데모 사용자 헤더 방식입니다.
- PAS 1시간 배치와 CPMS 일 배치는 설정 화면과 데이터 모델이 준비된 상태이며 실제 사내 Scheduler 연결이 필요합니다.
- Data Lake `hq1`, 파일 저장소, 운영 로그 정책은 사내 환경에 맞게 추가 연동해야 합니다.

따라서 현재 버전은 업무 흐름과 UI를 확인하고 다음 개발을 진행하기 위한 Prototype으로 사용하세요.

## 17. 가장 중요한 네 줄

```text
최초 한 번: setup 스크립트 실행
사용할 때: start 스크립트 실행
화면 주소: http://localhost:5173
최신 코드 받기/올리기: git pull / git push
```
