# Plans — 100ninkaigi

タスク管理の SSOT（task ledger）。状態マーカーは `harness-plan` / `harness-work` が付与します。
製品仕様（as-built）は `spec.md` を正とします。実装は本リポジトリ直下の `timer.html`。

作成日: 2026-06-20
更新: 2026-06-20（既存コード `timer.html` の実態に合わせて再構成）

---

## アクティブ

### Phase 2: PWA 化（iPhone/Android・オフライン対応）

> 既存 `timer.html` を作り直さず PWA 化。配信先（HTTPS ホスト）に manifest / sw.js / icons を同梱。
> オフラインは「一度ネットありでインストール → 以後オフライン運用」（spec.md §12）。

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| P.1 | Web App Manifest 作成（`manifest.webmanifest`: name/short_name、`display:standalone`、`orientation`、`theme_color`/`background_color`、icons 参照、`start_url`） [tdd:skip:config] | DevTools の Application > Manifest が警告なく読み込まれ、インストール可能と判定される | - | cc:完了 |
| P.2 | アプリアイコン作成（`tools/gen-icons.cjs` で PNG 生成: 32/180/192/512、赤地に白時計）。外部依存なしの自前 PNG エンコーダ [tdd:skip:asset] | 各サイズの PNG が用意され manifest/`<link>` から参照できる。署名・寸法検証済み | - | cc:完了 |
| P.3 | `timer.html` に PWA メタ追加（`<link rel=manifest>`、`apple-touch-icon`、`apple-mobile-web-app-capable=yes`、`apple-mobile-web-app-status-bar-style`、`theme-color`）＋ Service Worker 登録スクリプト | iOS/Android で「ホーム画面に追加」でき、全画面（ブラウザ UI なし）で起動 | P.1, P.2 | cc:完了 |
| P.4 | Service Worker（`sw.js`）: install で app shell（timer.html・manifest・icons）を precache、fetch は cache-first。`CACHE_NAME` バージョニングと activate で旧 cache 削除（更新反映） | 一度読み込み後、**機内モード/オフラインで起動・全機能動作**。アプリ更新時に新 cache へ切替 | P.3 | cc:完了 |
| P.5 | 画面スリープ防止（Screen Wake Lock API、対応端末のみ。START で取得、`visibilitychange` 復帰で再取得、RESET/PAUSE/終了で解放）。非対応端末は従来どおり [tdd:skip:progressive-enhancement] | 対応端末で計測中に画面が消えない。非対応端末でもエラーなく従来動作 | P.3 | cc:完了 |
| P.6 | ホスティング & インストール手順整備（README に PWA インストール/オフライン運用/更新手順を明文化。配信先 https://re-labo.com/timer/） | HTTPS の URL で配信され、手順どおりに iPhone/Android へインストールできる | P.4 | cc:完了 |
| P.7 | 実機検証（iPhone Safari / Android Chrome）: インストール→機内モードで起動、全画面、タイマー精度、警告音（プププ→ポーン）、Wake Lock を確認 [tdd:skip:manual-device] | iOS/Android 実機でオフライン起動と全 DoD（spec.md §7 相当）が再現 | P.5, P.6 | cc:TODO |

### Phase 3: TypeScript 化・ビルド基盤（振る舞い不変）

> SSOT を `src/`（TS）に移し、esbuild→単一 `timer.html` を生成。配布物のゼロ依存・開くだけ起動は維持（spec.md §14）。
> team_validation_mode: subagent（アーキ/ビルド・セキュリティ/QA の2視点でハードニング済み）。

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 3.1 | ビルド基盤: `tsconfig`(strict)＋Biome(lint/format)＋npm scripts(build/test/lint)＋esbuild ビルドスクリプト＋`timer.template.html`（プレースホルダ）→ `timer.html` 生成。devDep は `typescript`/`esbuild`/`@biomejs/biome` のみ版固定＋lockfile [tdd:skip:build-setup] | `npm run build` 生成物をブラウザで開くと現行と同一挙動。生成物 grep で `import `/`require(`/`sourceMappingURL`/外部http(自前icon除く) が0件。外部リクエスト0 | - | cc:TODO |
| 3.2 | 既存ロジックを `src/{config,core,signaller,audio,screen,render,app}.ts` へ分割移植。ポートを interface 化、`core` は設定非依存（durationMs 等を注入）。pure 層に node:test を追加 [tdd:required] | `?selftest` 全 pass（移植前と同数26）。node:test の pure 層テスト pass。ビルド出力が現行と機能一致（START/PAUSE/RESET/タップ/配色/0:00停止/爆発/音/WakeLock を実機相当で確認） | 3.1 | cc:TODO |
| 3.3 | ドリフト解消: spec.md §11 を「selftest あり」に整合（済）。コード所在(`100ninkaigi-timer/`)と SSOT(`100ninkaigi/`)の関係を CLAUDE.md/README に明文化 [tdd:skip:docs] | spec/コードのドリフトなし。所在関係が文書化される | 3.2 | cc:TODO |

### Phase 4: 設定の一元化・検証・ローカル保存

> 既定は `config.ts`、上書きは localStorage（`SettingsRepository`）。検証は spec.md §15。

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 4.1 | `config.ts` に色/持ち時間/しきい値/音/メッセージを `Config` 型で既定定義し、ハードコード定数を全置換（core/render/audio へ注入）。既定値＝現行値と完全一致 [tdd:required] | 設定定数が config.ts のみに存在（他に魔法数なし＝grep 確認）。config 変更がビルドで挙動追従。node テストで colorClass/messageFor/signaller が注入で動く。**初回(未保存)挙動＝現行 timer.html** | 3.2 | cc:TODO |
| 4.2 | `Settings` 型＋`validateSettings`/`clampNumbers`/`mergeSettings`/`migrate`＋`SCHEMA_VERSION`。色 `#hex` ホワイトリスト、数値クランプ(持ち時間60-3600/gain0.0001-0.5/freq100-4000/整数秒)、しきい値単調性(0<blink<danger<warning<info≤duration)強制、不正は当該フィールドのみ既定フォールバック [tdd:required] | node テストで〔持ち時間0/負・順序崩れ・色不正(`red;}`等)・未知version・壊れJSON〕**全ケースで例外なし＆既定フォールバック**。clamp 境界値が `min≤v≤max`。gain は常に >0 | 4.1 | cc:TODO |
| 4.3 | `SettingsRepository`(localStorage アダプタ): 起動時 `実効={...config既定, ...検証済み上書き}`。read/write を try/catch、`setItem` 失敗(プライベートモード/容量)でもタイマー継続＋失敗通知。破損時は既定起動＋「既定に戻した」通知 [tdd:required] | 設定保存→リロードで反映。localStorage を手で壊しても**既定で正常起動**(throw なし)。保存失敗でも動作継続し通知が出る | 4.2 | cc:TODO |

### Phase 5: 管理画面（モーダル設定パネル）

> timer.html 内モーダル。spec.md §16。セキュリティ必須項目を DoD に明記。

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 5.1 | モーダル設定UI（色=`<input type=color>`、持ち時間/しきい値/音/メッセージ編集）。保存/キャンセル/既定に戻す。色は即プレビュー、持ち時間は保存時/RESET時反映（計測中は変えない）。しきい値の単調性をUIで強制（崩れたら保存不可＋エラー）。メッセージは textContent 限定・長さ上限 [tdd:skip:ui] | 編集→保存で再読込なしに配色/持ち時間/音/メッセージ反映。キャンセルで確定値不変。既定に戻すで config 既定＋保存クリア。実機(iOS/Android)で操作可。配布物は単一HTML・ゼロ依存維持 | 4.3 | cc:TODO |
| 5.2 | セキュリティゲート: 設定由来テキストは `textContent` のみ、色は `setProperty` 個別適用（生CSS連結なし）、音 gain 下限0.0001厳守 [tdd:skip:security-gate] | ソース grep で `innerHTML`/`insertAdjacentHTML`/`outerHTML` が0件。メッセージに `<img onerror>` を保存しても**スクリプト不実行**(文字列表示)。不正色(`red;}`/`url(x)`)で画面が壊れず既定表示 | 5.1 | cc:TODO |

### Phase 6: 統合検証・配布物固定・ドキュメント

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 6.1 | 全DoD通し回帰: Chrome/Safari/Firefox＋iPad縦横で 計時精度/プププ→ポーン/4段階配色/爆発/10:00表示/設定機能/管理画面 を確認 [tdd:skip:manual-cross-browser] | 3ブラウザ＋実機で spec §3-10＋設定・管理画面機能が再現 | 5.2 | cc:TODO |
| 6.2 | 配布物固定＆ドキュメント: pre-commit/CI で「ビルド出力＝コミット済み timer.html」一致チェック。SW `CACHE_NAME` バンプをビルドに紐付け。CLAUDE.md/README/spec を「src=SSOT・timer.html=生成物(追跡)・配布物はゼロ依存で開くだけ維持」に更新 [tdd:skip:docs] | 生成物=コミットの一致が自動確認。CLAUDE.md に新ビルド方針が明文化。CACHE_NAME 運用が記載 | 6.1 | cc:TODO |

## アーカイブ（実装済み・既存コードで成立）

| Task | 内容 | DoD | Status |
|------|------|-----|--------|
| D.9 | レイヤー分離リファクタ（純粋 `createTimerCore`＋`formatTime`/`colorClass`/`messageFor`/`createSignaller`／アダプタ `Sound`/`Screen`/`Renderer`／`App` 配線）＋ `?selftest`（境界値26項目）。振る舞い不変（2026-06-21） | DOM スタブ上で selftest 26/26 PASS。挙動は従来と同一 | cc:完了 |

> `timer.html` で動作している機能。as-built として `spec.md` に記載済み。

| Task | 内容 | DoD | Status |
|------|------|-----|--------|
| D.1 | 単一 HTML（インライン style/script、バニラ JS/CSS、ゼロ依存、開くだけで動作） | 外部リクエストなしでブラウザ表示・動作 | cc:完了 |
| D.2 | 残り時間表示（>50s は `m:ss`、<=50s は秒のみ）と START/PAUSE/RESET ボタン＋画面タップでの Start/Pause トグル | 各操作で開始/一時停止/リセットが機能 | cc:完了 |
| D.3 | 10 分（600s）計測と 0:00 での停止（負値にしない）。RESET で 10:00 待機へ復帰 | 0:00 で停止し RESET で初期化 | cc:完了 |
| D.4 | 残り時間に応じた 4 段階配色（120s 青 / 60s 黄 / 30s 赤 / 10s 赤点滅）＋状態メッセージ（そろそろまとめて/ラストスパート/まもなく終了/おつかれさまでした） | 各しきい値で配色・メッセージが切替 | cc:完了 |
| D.5 | 0:00 の爆発パーティクル演出（100 個・多重発火防止・RESET で解除） | 0:00 で 1 回発火、RESET で解除 | cc:完了 |
| D.6 | レスポンシブ調整: `#time`/`#msg` を幅・高さ両頭打ち（`min(vw,vh,上限)`）＋ `white-space:nowrap`、`.wrap`/`.panel` に `min-height:0`/`overflow:hidden`。PC・タブレットで画面内に収まる（2026-06-20） | iPad（縦/横）で `10:00` とボタンが画面内に収まる | cc:完了 |
| D.7 | 計時精度改善: `performance.now()` アンカー方式（`setInterval` は 200ms 表示更新のみ、残りは実時刻から再計算）。`visibilitychange` でタブ復帰時に即補正。一時停止/再開は `remainingMs` を精密保持（2026-06-21） | バックグラウンド退避→復帰で残りが実経過と ±1 秒以内。0:00 跨ぎ復帰でも停止・0:00 表示 | cc:完了 |
| D.8 | 終了前警告音: 「開始」/タップ操作内で AudioContext 解錠（`webkitAudioContext` フォールバック）。残り 1:00 で 880Hz×2、**最後の5秒は毎秒「プ」(880Hz)→0:00 で「ポーン」(1320Hz, sine 余韻)** のカウントダウン。一度きり/毎秒フラグで多重防止、gain ランプでノイズ抑制。外部ファイルなし（2026-06-21） | 最初の操作後に音が出る。残り 1:00、最後の5秒の毎秒プ、0:00 のポーンが鳴る。RESET で再武装。非対応環境では視覚のみで継続 | cc:完了 |
