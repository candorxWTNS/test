# playlist-migrator

Spotify · Apple Music · YouTube Music 간 플레이리스트 이전 웹 서비스 기획.

- `docs/DESIGN.md` — 설계서 (플랫폼 API 현황, 매칭 알고리즘, 아키텍처, 수익 모델, 법적 체크리스트, 로드맵, 비용)
- `src/matcher.js` — 곡 매칭 엔진 프로토타입 (의존성 없음, 브라우저/Node 공용)
- `test/matcher.test.js` — 매칭 시나리오 테스트

```sh
npm test
```
