# Vercel 공개 접근 설정 가이드

Vercel에 배포된 대시보드를 다른 사람들이 로그인 없이 볼 수 있도록 설정하는 방법입니다.

## 문제 상황
링크를 공유했을 때 로그인 화면이 나타나는 경우

## 해결 방법

### 1. Vercel 대시보드에서 설정 변경

#### 방법 A: 프로젝트 설정에서 공개 설정 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 접속
   - 해당 프로젝트 선택

2. **Settings → General**
   - 프로젝트가 **Public** 또는 **Private**로 설정되어 있는지 확인
   - 가능하면 **Public**로 설정

3. **Settings → Deployment Protection**
   - **Password Protection**이 활성화되어 있으면 **비활성화**
   - **Vercel Authentication**이 활성화되어 있으면 **비활성화**

#### 방법 B: 팀 계정 설정 확인

1. **Settings → Team**
   - 팀 계정을 사용하는 경우, 팀 설정 확인
   - 팀의 기본 설정이 비공개일 수 있음

2. **Settings → Access Control**
   - 접근 제어 설정 확인
   - 필요시 공개 설정으로 변경

### 2. 배포 설정 확인

1. **Deployments 탭**
   - 최신 배포 선택
   - **Settings** → **Deployment Protection** 확인
   - 비밀번호 보호나 인증이 활성화되어 있으면 비활성화

### 3. 환경 변수 확인

환경 변수는 공개 접근과 무관하지만, 확인해보세요:

1. **Settings → Environment Variables**
   - 필요한 환경 변수가 모두 설정되어 있는지 확인

### 4. 도메인 설정 확인

1. **Settings → Domains**
   - 커스텀 도메인 사용 시, 도메인 설정 확인
   - 기본 Vercel 도메인(`*.vercel.app`)은 기본적으로 공개됨

## 빠른 해결 방법

### 가장 빠른 방법 (권장)

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. **Settings** → **Deployment Protection** 클릭
4. 모든 보호 기능 **비활성화**
5. 저장

### 확인 사항

- ✅ Password Protection: **비활성화**
- ✅ Vercel Authentication: **비활성화**
- ✅ Deployment Protection: **비활성화**

## 추가 확인

### 프로젝트가 팀 계정에 있는 경우

1. 팀 설정 확인
2. 팀의 기본 접근 설정이 공개인지 확인
3. 필요시 프로젝트를 개인 계정으로 이동

### 여전히 문제가 있는 경우

1. 새 배포 생성
2. 배포 URL 확인 (기본 Vercel 도메인 사용)
3. 시크릿 모드에서 테스트

## 참고

- Vercel의 기본 배포는 공개입니다
- 로그인 요구는 보통 Deployment Protection 때문입니다
- `vercel.json` 파일은 이미 생성되어 있습니다

## 문의

문제가 계속되면:
1. Vercel 지원팀에 문의
2. 프로젝트 설정 스크린샷 확인
3. 배포 로그 확인
