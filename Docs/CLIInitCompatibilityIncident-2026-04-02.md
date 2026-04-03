# CLI Init Compatibility Incident — 2026-04-02

## Summary

`@anthropic-ai/claude-code@2.1.88` の `cli.js` を `BunRuntime` 上で実行すると、`system init` event が出力されず、約 42 秒後にタイムアウトで terminate されていた。

表面的には `stdout` 無出力、JS 例外なし、fetch/FS は進行、boot barrier は解放済みという状態だったが、根本原因は起動初期の `fs` 例外互換性欠落だった。

## User-visible Symptoms

- `process.stdout.write` が 0 回
- `console.log/warn/error` が 0 回
- `boot barrier` は解放される
- fetch と FS は進行する
- `setInterval` だけが残り、`system init` まで到達しない

## Root Cause

`node:fs` 互換層が、Swift から返された POSIX 風エラー文字列を単なる `Error(message)` に変換していた。

Swift 側は例えば次の文字列を返していた。

```text
ENOENT: no such file or directory, stat '/some/path'
```

しかし JS 側では `error.code`, `error.path`, `error.syscall` が設定されず、`cli.js` が `ENOENT` を「未作成 config file の通常系」として扱えなかった。

その結果、isolated `HOME` での初回 config 保存経路が `init()` 内で失敗し、`runHeadless()` と `system init` emit の前で停止していた。

## Exact Failure Point

`cli.js` 側では `init()` の中で `firstStartTime` を保存する経路に入る。そこでは global config path に対して `stat` / `write` / watcher 初期化が行われ、存在しない file に対する `ENOENT` を recover する前提がある。

`BunRuntime` 上では recover 用の条件分岐が成立せず、`init()` が reject されて startup が中断していた。

## Why This Was Hard To See

- 例外自体は CLI 側で catch されるため、トップレベル例外や unhandled rejection としては現れない
- fetch / FS / timer activity は継続するため、ランタイムが「生きている」ように見える
- `stdout` 無出力のため、表面上は scheduler / boot barrier / fetch bridge の問題に見えやすい

## Fix

`node:fs` 互換層で、Swift から来るエラー文字列を Node-style error object に正規化するように変更した。

正規化対象:

- `error.code`
- `error.path`
- `error.syscall`

この修正により、`cli.js` は isolated `HOME` でも `init_completed` まで進み、`system init` event を再び出力するようになった。

## Regression Coverage Added

次の回帰テストを追加した。

- `fs.statSync` missing path の `ENOENT` shape
- `fs.promises.stat` missing path の `ENOENT` shape

いずれも `code`, `path`, `syscall` を検証する。

## Broader Lesson

今回の問題は単体の `fs.stat` バグではなく、`Swift -> JS` 境界で「Node が期待する shape を持つ値を返していなかった」ことが原因だった。

同種の問題は次でも再発しうる。

- `child_process` error object
- `EventEmitter` の順序と `error` semantics
- `stream` event ordering
- `fetch` / `Response` / `Request` の shape
- `fs.Dirent`, `Stats`, watcher objects

## Forward Strategy

互換性を手作業の probe で追うのはやめ、`node` を oracle とした差分テストを増やす。

方針:

1. 同じ JS snippet を `node` と `BunRuntime` の両方で実行する
2. return value と thrown/rejected error shape を正規化して JSON 比較する
3. `fs`, `events`, `child_process`, `stream` など、実アプリが踏む面を重点的に増やす
4. `Swift -> JS` 境界の返却値は個別実装ではなく共通 factory / adapter に寄せる

この incident をきっかけに、個別バグ修正より先に differential compatibility test を拡充する。
