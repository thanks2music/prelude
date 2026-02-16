# preludex

ドキュメントサイトをクリーンな Markdown ファイルとしてダウンロードする CLI ツール。
オフライン閲覧、LLM/AI ナレッジベース構築、ローカル検索に最適です。

> **Note**: これは開発環境です。公開版は以下を参照してください。
> - **npm**: https://www.npmjs.com/package/preludex
> - **GitHub**: https://github.com/thanks2music/preludex

## 特徴

- **フレームワーク自動検出** - 主要なドキュメントフレームワークを自動検出し最適化
- **GitHub リポジトリ対応** - GitHub リポジトリから README と docs/ ディレクトリの Markdown を直接ダウンロード
- **クリーンな Markdown 出力** - HTML を整形された Markdown に変換
- **リンククローリング** - 内部リンクを辿り、深度制御可能
- **サイトマップ対応** - sitemap.xml を使用した一括ダウンロード
- **複数アダプター** - GitHub、Playwright（デフォルト）、Jina Reader API、MDX 直接取得
- **並列処理** - 設定可能な同時実行数で高速ダウンロード
- **エラーリトライ** - 一時的な障害に対する自動リトライとエクスポネンシャルバックオフ
- **レート制限対応** - GitHub API レート制限の自動監視と待機
- **進捗表示** - リアルタイム進捗表示と ETA 計算

## 対応フレームワーク

preludex は以下のフレームワークを自動検出し、最適な設定を適用します:

| フレームワーク | 使用例 |
|---------------|--------|
| **GitHub Repositories** | Next.js, Fastify, Deno（README + docs/）|
| **Docusaurus** | React Native, Jest, Babel |
| **VitePress** | Hono, Vue.js, Vite |
| **MkDocs** | Material for MkDocs |
| **Starlight** | Astro, Cloudflare Docs |
| **Sphinx** | Python, pip, Read the Docs |
| **GitBook** | 各種ホスティングドキュメント |

## インストール

```bash
# npm
npm install -g preludex

# npx/bunx で直接実行
npx preludex <url>
bunx preludex <url>
```

**注意:** Playwright はブラウザバイナリが必要です:

```bash
npx playwright install chromium
# または
bunx playwright install chromium
```

## 使用方法

### 基本的な使い方

```bash
# ドキュメントページとリンク先をダウンロード
preludex https://hono.dev/docs --out docs/hono

# より深くクロール（3階層まで）
preludex https://example.com/docs --depth 3 --out docs/example
```

### GitHub リポジトリから Markdown をダウンロード

```bash
# リポジトリ全体の Markdown ファイルをダウンロード
preludex https://github.com/fastify/fastify --out docs/fastify

# 特定のブランチを指定
preludex https://github.com/facebook/react/tree/main --out docs/react

# 特定のディレクトリのみ（blob URL も対応）
preludex https://github.com/denoland/deno/tree/main/docs --out docs/deno

# レート制限を回避（推奨）
GITHUB_TOKEN=ghp_xxx preludex https://github.com/vercel/next.js --out docs/nextjs
```

**GitHub 対応の特徴:**
- README.md と docs/ ディレクトリ内の全 Markdown ファイルを自動検出
- GitHub Trees API による高速ファイル一覧取得（100,000ファイルまで対応）
- デフォルトブランチの自動検出
- スラッシュを含むブランチ名に対応（例: `feature/new-feature`）
- 進捗表示とレート制限監視
- 未認証: 60リクエスト/時、認証済み: 5,000リクエスト/時

### サイトマップを使用

```bash
# sitemap.xml に記載された全ページをダウンロード
preludex https://example.com/docs --use-sitemap --out docs/example
```

### Jina Reader API を使用

```bash
# Jina Reader API を使用（高レート制限には JINA_API_KEY 環境変数が必要）
preludex https://example.com/docs --use-jina --out docs/example
```

## オプション

| オプション | 短縮形 | デフォルト | 説明 |
|-----------|--------|-----------|------|
| `--out` | `-o` | `docs` | 出力ディレクトリ |
| `--depth` | `-d` | `1` | 最大クロール深度（0 = エントリページのみ） |
| `--concurrency` | `-c` | `3` | 並列リクエスト数 |
| `--use-sitemap` | | `false` | sitemap.xml を使用して URL を発見 |
| `--use-jina` | | `false` | Playwright の代わりに Jina Reader API を使用 |
| `--verbose` | | `false` | 詳細出力を表示 |
| `--help` | `-h` | | ヘルプを表示 |
| `--version` | `-v` | | バージョンを表示 |

## 出力構造

preludex はドキュメントの構造を出力ディレクトリに保持します:

```
入力 URL: https://example.com/docs/guide/getting-started

出力:
docs/
├── getting-started.md
├── api/
│   ├── overview.md
│   └── reference.md
└── guide/
    └── advanced.md
```

## 動作の仕組み

1. **Fetch** - Playwright（ヘッドレスブラウザ）または Jina Reader API でページを取得
2. **Detect** - ドキュメントフレームワークを識別し、最適なセレクタを適用
3. **Extract** - ナビゲーション、サイドバーなどの非コンテンツ要素を除去
4. **Convert** - Turndown を使用して HTML をクリーンな Markdown に変換
5. **Crawl** - 内部リンクを抽出し、処理キューに追加（BFS）
6. **Save** - URL 構造を保持した Markdown ファイルを保存

## ユースケース

- **オフラインドキュメント** - インターネット接続なしでドキュメントを閲覧
- **LLM ナレッジベース** - AI アシスタント（Claude, GPT など）にドキュメントを提供
- **ローカル検索** - ripgrep、grep、IDE 検索でドキュメント全体を検索
- **Obsidian/Notion 連携** - 個人ナレッジベースの構築
- **アーカイブ** - ドキュメントを参照用に保存

## アダプター

preludex は対象サイトに応じて異なるアダプターを使用します:

| アダプター | 用途 | 方式 | 優先度 |
|-----------|------|------|--------|
| **GitHub** | GitHub リポジトリ | GitHub API + Raw URL | 1 |
| **MDX** | Claude Docs, Vercel, Next.js | .md/.mdx ファイルを直接取得 | 2 |
| **Jina** | API ベース（`--use-jina` 使用時） | Jina Reader API | 3 |
| **Playwright** | 多くのサイト（デフォルト） | ヘッドレスブラウザレンダリング | 4 |

アダプターは URL パターンに基づいて自動選択されます。GitHub リポジトリ URL が検出された場合、GitHub アダプターが最優先で使用されます。

## 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `GITHUB_TOKEN` | オプション。GitHub API のレート制限を 60/時 → 5,000/時 に引き上げ | なし |
| `JINA_API_KEY` | オプション。Jina Reader API の高レート制限用キー | なし |
| `PRELUDEX_LOG_LEVEL` | ログレベル（`debug`, `info`, `warn`, `error`） | `info` |

**GITHUB_TOKEN の取得方法:**
1. GitHub Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" を選択
3. `public_repo` スコープを選択（公開リポジトリのみの場合）
4. トークンを生成してコピー
5. 環境変数に設定: `export GITHUB_TOKEN=ghp_your_token_here`

## 要件

- Node.js >= 18.0.0 または Bun >= 1.0.0
- Playwright Chromium（初回実行時に自動インストール）

## 開発

```bash
# 依存関係のインストール
bun install

# 開発モードで実行
bun run dev <url>

# ビルド
bun run build
```

## 更新履歴

### Phase 2 - エラーハンドリング強化とレート制限対応 (2026-01-30)

**Phase 2.1 - 基本機能強化**
- ✨ エクスポネンシャルバックオフによる自動リトライ機能
- 📊 GitHub API レート制限の監視と自動待機
- 🎯 リアルタイム進捗表示（完了率、速度、ETA）

**Phase 2.2 - エラー処理とロギング**
- 🔍 GitHubError による詳細なエラー分類（permanent/temporary/rate-limit）
- 📝 設定可能なログレベル（debug/info/warn/error）
- 🛡️ ファイルサイズ制限（デフォルト10MB）によるメモリ保護

**Phase 2.3 - 最適化機能**
- ⚡ GitHub API レスポンスキャッシュ（TTL: 1時間）
- 🔄 中断されたダウンロードのレジューム機能（基盤実装）
- 🎯 重複ファイル検出による効率化

**Phase 1 - GitHub リポジトリ対応 (2026-01-29)**
- ✨ GitHub リポジトリからの Markdown 直接ダウンロード
- 🌲 GitHub Trees API による高速ファイル一覧取得
- 🔀 スラッシュを含むブランチ名対応（例: `feature/foo`）
- 🔒 パストラバーサル攻撃防止
- 📦 大規模リポジトリ対応（truncated tree 時の自動フォールバック）

**検証済みリポジトリ:**
- [fastify/fastify](https://github.com/fastify/fastify) - 51 files
- [denoland/deno](https://github.com/denoland/deno) - 97 files
- [vercel/next.js](https://github.com/vercel/next.js) - 1,074 files

## ライセンス

MIT
