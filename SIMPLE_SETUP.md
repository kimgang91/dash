# 간단한 환경변수 설정 (최종)

## ⚠️ 중요: 이 방법만 따르세요

### 1단계: Vercel 환경변수 설정

Vercel → 프로젝트 → Settings → Environment Variables

#### PRIVATE_KEY 설정

1. **Add** 버튼 클릭
2. **Key**: `PRIVATE_KEY` (정확히 이 이름)
3. **Value**: 아래 내용을 **전체 복사**해서 붙여넣기

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDlE1e221+auYtT
KnRD92hTbacnjut43kDRitpaCkby4/1LH519p+1eUBBhaDjVEmHN8KickY3/1MEo
+7tG+Y57RJyQUx2DNAivXxrEsN9dLDJPhbIp26QoGaxuKNUgsXfezQEuvozD55eT
b/1VajLTUIrXBqFvoctJ4s3AY1E4DxVbHOP4IQZdAtCRxifjyoi2BNwIkC8f21W5
BPEJBSi3tKNc8mVKItDuLVoHr9LyzsGHODA/25F2qNmt+YRhmMDzJzXt7z0JjlWU
9RlYMEql+1yIZQKRl3ukTvsNTkqYiRO481V76XchT9cXqiCm03PmwajUobiPF600
WsnumwqpAgMBAAECggEACldNseEEV1lB616ywfC0wnNkRNpkUeACoBL7GW52Vnep
Uw9Zzjba9dN6cdNBIYlDZgcTrYG6nc5ua9m1UhZo8rKduLwvzGD4dWY/MJrlcnDQ
0psv+EjEh9Tk3lI0kNXCGgo6H/CVLTDSvGKlVopFQhnUMrHHbuEoaqz06dbx7yxV
Q9n09tqtFmc+liMZfwGEcrP0yjeYoKOyVn8BO2ah/vC7x6ZwD1WzodUGP8mbtf6K
dlgsdvI9DmUN5dSVt4ah4gGkfyUqzcjfkVvI833/iVUFcUHsm0UDFT6rqcVyeFhe
rkjiZVjNapfOmukfRSqb/tQnOwUxnpzdCctI8nD0KQKBgQD6G8AfBNu3aQUSz/kg
tI8LoxTJ4yKxwA2q13tm0wnA0gtV4QM2hgHnI21/ThNjgiFVHDzfLrSrDtZWgLZi
wrL3N9Vckf3yB+c5oPT4BRZr04SCakXrX3RDdH0tiD3zeV8MPWQ6cbr7zxsdJxzE
JsVleWmHSDHPvLBYDU7PTrFazQKBgQDqeMGMw+IbPo01nJ65CdmgciEiWwsIGvDB
7LaaOiWvUlLW/arvchM+i6e/qEYqKerG+1iGv6qDL97yjSOsZ+Capa9YRjWR4QP4
EPUoRC3QK3+9qxdFeQn3IxPgboNcjD/gOk87CTZrc6yCq9PTG7vAgwzuWdLNMTL3
/S5wwyOnTQKBgHe9cW1oVgipLtSi3RLbXuCjYwCEzcdrux9fqqS/xJub8/FZmMAx
yBdwzqt0JbQuSOcGbd4r7jM3F0ayuJ7vt97DzFJVUs7dGcZtWNqlFObqjTYiyva0
7GSfEI8L+xzlrqudeK7CZFLKBKEgaJVAOqEqT2uFFNPv8j01odV+R0rBAoGAKZkQ
5ZNfCuxXCxrlQfjQZlm5LSov09lLu2vunYARbYBSeBf6+o4ngeIu+Z62DAbxwymW
dBmO+8VDbY7CtHSdcXJRoHycRmxAUwNXKzSlWBhPimvPLiEiNnk/roKMxZ+QOYy+
v7+LqxaTlX88jmiOL8JQSf0fnA3NeBev5IuKSMUCgYEAtGOfJ7v7PI3YmpvbiFfD
e1Xf7xryReZRubKxHYQeHROyd98KSDVuZ3jKBS8MvvWoNsviZpg7rAX9mRuvRz5s
2O4etDd2RiZpVvIzE4jNzcqfKoVOYjfzFsqkS8oJk9E4WpQmofElS6W0DZCrEf8/
VIQFb6N9kM6JP69NFVE57Gc=
-----END PRIVATE KEY-----
```

4. **Sensitive** 토글: **ON**
5. **Environments**: Production, Preview, Development **모두 체크**
6. **Save** 클릭

### 2단계: Google Sheets 공유 확인

1. Google Sheets 문서 열기
2. **공유** 버튼 클릭
3. `dashboard@genial-retina-488004-s8.iam.gserviceaccount.com` 이메일 추가
4. 권한: **보기 가능(뷰어)**
5. **완료**

### 3단계: 재배포

1. Deployments → 최신 배포 → ... → **Redeploy**
2. 배포 완료 대기

---

## 체크리스트

- [ ] Vercel에 `PRIVATE_KEY` 환경변수 추가 (위 값 전체 복사)
- [ ] Sensitive ON
- [ ] Production, Preview, Development 모두 체크
- [ ] Save 클릭
- [ ] Google Sheets에 서비스 계정 이메일 공유
- [ ] **재배포 실행**

---

## 코드 변경 사항

✅ Private Key 파싱 로직을 **완전히 단순화**
✅ 불필요한 디버깅 로그 제거
✅ 에러 메시지 명확화
✅ 기본값으로 client_email 하드코딩 (환경변수 없어도 작동)

이제 **PRIVATE_KEY만** 설정하면 됩니다!
