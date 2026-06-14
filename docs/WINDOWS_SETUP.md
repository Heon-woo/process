# Windows 설치 및 실행

## 1. 저장소 다운로드

Git이 설치된 경우:

```bat
cd /d C:\
git clone https://github.com/Heon-woo/process.git PASS
cd /d C:\PASS
```

GitHub의 `Code > Download ZIP`으로 내려받아 `C:\PASS`에 압축을 풀어도 된다.

## 2. 필수 프로그램

- Python 3.10 또는 3.11
- Node.js 20

확인:

```bat
py -3.11 --version
node --version
```

프로그램 설치가 제한된 사내 PC에서는 Software Center 또는 IT 담당자를 통해 설치한다.

## 3. 최초 설정

```bat
cd /d C:\PASS
scripts\setup_windows.bat
```

이 과정에서 Python 가상환경과 Frontend 패키지가 설치된다.

## 4. 실행

```bat
cd /d C:\PASS
scripts\start_windows.bat
```

- Portal: <http://localhost:5173>
- API 문서: <http://localhost:8000/docs>
- 상태 확인: <http://localhost:8000/api/health>

종료하려면 실행 시 열린 Backend와 Frontend 창을 모두 닫는다.

## 5. 사내망 오류

`pypi.org` 또는 `registry.npmjs.org` 접속이 제한되면 사내 PyPI/NPM Mirror 설정이 필요하다. 사내 Cloud/JupyterLab 또는 개발 환경 담당자에게 다음 정보를 확인한다.

- Python Package Index URL
- NPM Registry URL
- 사내 인증서 또는 Proxy 설정

의존성 폴더인 `.venv`와 `node_modules`를 저장소에 올리면 안 된다.

## 6. 샘플 데이터 초기화

서버를 종료한 뒤 다음 파일을 삭제하고 재실행한다.

```text
C:\PASS\backend\data\pass.db
```

업로드 파일 경로:

```text
C:\PASS\backend\data\uploads
```

## 7. 운영 적용 전 확인

- Data Lake `hq1` 연결
- 사내 운영 DB와 SSO 연결
- Product/Tech 담당자 권한 적용
- PAS 시간 배치와 CPMS 일 배치 등록
- 파일 저장소와 감사 로그 보존 정책 적용
