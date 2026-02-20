# Private Key 설정 정확한 방법

## ⚠️ 중요: Invalid JWT Signature 에러 해결

`invalid_grant: Invalid JWT Signature` 에러는 **Private Key가 잘못 파싱**되었을 때 발생합니다.

## 정확한 설정 방법

### JSON 파일에서 Private Key 복사

JSON 파일 (`genial-retina-488004-s8-3903822f0569.json`)을 열고:

1. **5번째 줄**의 `"private_key": "..."` 부분을 찾습니다
2. **큰따옴표 안의 내용만** 복사합니다 (큰따옴표는 제외!)

**올바른 예시:**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDlE1e221+auYtT
KnRD92hTbacnjut43kDRitpaCkby4/1LH519p+1eUBBhaDjVEmHN8KickY3/1MEo
... (중간 내용 전체)
VIQFb6N9kM6JP69NFVE57Gc=
-----END PRIVATE KEY-----
```

**잘못된 예시:**
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDlE1e221+auYtT\n..."
```
(큰따옴표와 `\n`이 그대로 포함됨)

### Vercel에 설정

1. Vercel → 프로젝트 → Settings → Environment Variables
2. **PRIVATE_KEY** 환경변수 편집 또는 추가
3. **Value 필드에** 위에서 복사한 내용을 **그대로 붙여넣기**
   - 큰따옴표 없이
   - `\n` 문자 그대로 (코드가 자동으로 줄바꿈으로 변환)
4. **Sensitive** 토글 ON
5. **Save** 클릭
6. **재배포 필수!** (Deployments → Redeploy)

## 현재 JSON 파일 기준 정확한 값

### CLIENT_EMAIL
```
dashboard@genial-retina-488004-s8.iam.gserviceaccount.com
```

### PRIVATE_KEY (큰따옴표 제외하고 복사)
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

**중요:** 
- 위 내용을 **전체** 복사 (BEGIN부터 END까지)
- Vercel Value 필드에 **그대로 붙여넣기**
- 큰따옴표는 넣지 마세요!

## 체크리스트

- [ ] JSON 파일에서 `private_key` 값의 큰따옴표 안 내용만 복사
- [ ] Vercel에 `PRIVATE_KEY` 환경변수 Value에 붙여넣기 (큰따옴표 없이)
- [ ] Sensitive 토글 ON
- [ ] Save 클릭
- [ ] **재배포 실행** (Deployments → Redeploy)
- [ ] Google Sheets에 서비스 계정 이메일 공유 확인
