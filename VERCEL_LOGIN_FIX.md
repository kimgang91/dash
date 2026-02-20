# Vercel 로그인 문제 해결 가이드

## 🔴 문제
링크를 클릭하면 "Vercel에 로그인하고 보라"고 나오는 경우

## ✅ 해결 방법 (단계별)

### 1단계: Vercel 대시보드 접속
1. https://vercel.com/dashboard 접속
2. 로그인 (본인 계정)

### 2단계: 프로젝트 선택
1. 배포된 프로젝트 찾기 (sales-dashboard 또는 해당 프로젝트명)
2. 프로젝트 클릭

### 3단계: Settings → Deployment Protection 확인 및 비활성화
**가장 중요합니다!**

1. 상단 메뉴에서 **Settings** 클릭
2. 왼쪽 사이드바에서 **Deployment Protection** 클릭
3. 다음 항목들을 확인하고 **모두 비활성화**:

   - ❌ **Password Protection** → **OFF**로 변경
   - ❌ **Vercel Authentication** → **OFF**로 변경  
   - ❌ **IP Allowlist** → **OFF**로 변경
   - ❌ **Deployment Protection** → **OFF**로 변경

4. **Save** 또는 **저장** 버튼 클릭

### 4단계: Settings → General 확인
1. **Settings** → **General** 클릭
2. **Visibility** 섹션 확인
3. 가능하면 **Public** 또는 **Public (Read-only)** 선택

### 5단계: 새 배포 생성 (선택사항)
1. **Deployments** 탭 클릭
2. 최신 배포의 **⋯** (점 3개) 메뉴 클릭
3. **Redeploy** 선택
4. 또는 코드를 다시 푸시하여 자동 재배포

### 6단계: 테스트
1. 배포 URL 복사 (예: `https://your-project.vercel.app`)
2. **시크릿 모드(Incognito)**에서 열기
3. 로그인 없이 접근되는지 확인
4. 다른 사람에게 링크 공유하여 테스트

## 📸 확인해야 할 화면

### Deployment Protection 화면
```
Settings → Deployment Protection

☐ Password Protection        [OFF]
☐ Vercel Authentication       [OFF]
☐ IP Allowlist               [OFF]
☐ Deployment Protection      [OFF]
```

**모두 OFF여야 합니다!**

## ⚠️ 주의사항

1. **팀 계정 사용 시**
   - 팀의 기본 설정이 비공개일 수 있음
   - 팀 관리자에게 문의 필요

2. **커스텀 도메인 사용 시**
   - 도메인 설정도 확인 필요
   - 기본 Vercel 도메인(`*.vercel.app`)으로 먼저 테스트

3. **환경 변수**
   - 환경 변수는 공개 접근과 무관
   - 하지만 필요한 변수는 설정되어 있어야 함

## 🔍 문제가 계속되는 경우

### 체크리스트
- [ ] Deployment Protection이 모두 OFF인가?
- [ ] 프로젝트가 Public으로 설정되어 있는가?
- [ ] 시크릿 모드에서 테스트했는가?
- [ ] 다른 브라우저에서 테스트했는가?
- [ ] 배포 URL이 올바른가? (최신 배포 URL 확인)

### 추가 확인
1. **Deployments** 탭에서 최신 배포 확인
2. 배포 URL이 올바른지 확인
3. 배포 상태가 **Ready**인지 확인

### 여전히 안 되면
1. Vercel 지원팀에 문의: support@vercel.com
2. 프로젝트 설정 스크린샷 첨부
3. 배포 로그 확인

## 💡 빠른 해결 (가장 가능성 높은 원인)

**99%의 경우 Deployment Protection 때문입니다!**

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Deployment Protection**
3. **모든 항목 OFF**
4. **저장**
5. 완료!

## 📝 참고

- 코드 레벨에서는 인증 관련 코드가 없습니다
- `vercel.json` 파일은 이미 올바르게 설정되어 있습니다
- 문제는 Vercel 대시보드 설정 때문입니다
