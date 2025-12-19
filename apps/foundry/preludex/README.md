# preludex

ドキュメントサイトをクリーンな Markdown ファイルとしてダウンロードする CLI ツール。
オフライン閲覧、LLM/AI ナレッジベース構築、ローカル検索に最適です。

> **Note**: これは開発環境です。公開版は以下を参照してください。
> - **npm**: https://www.npmjs.com/package/preludex
> - **GitHub**: https://github.com/thanks2music/preludex

## 特徴

- **フレームワーク自動検出** - 主要なドキュメントフレームワークを自動検出し最適化
- **クリーンな Markdown 出力** - HTML を整形された Markdown に変換
- **リンククローリング** - 内部リンクを辿り、深度制御可能
- **サイトマップ対応** - sitemap.xml を使用した一括ダウンロード
- **複数アダプター** - Playwright（デフォルト）、Jina Reader API、MDX 直接取得
- **並列処理** - 設定可能な同時実行数で高速ダウンロード

## 対応フレームワーク

preludex は以下のフレームワークを自動検出し、最適な設定を適用します:

| フレームワーク | 使用例 |
|---------------|--------|
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

| アダプター | 用途 | 方式 |
|-----------|------|------|
| **Playwright** | 多くのサイト（デフォルト） | ヘッドレスブラウザレンダリング |
| **MDX** | Claude Docs, Vercel, Next.js | .md/.mdx ファイルを直接取得 |
| **Jina** | フォールバック / API ベース | Jina Reader API |

アダプターは自動選択されますが、`--use-jina` で Jina を強制できます。

## 環境変数

| 変数 | 説明 |
|------|------|
| `JINA_API_KEY` | オプション。Jina Reader API の高レート制限用キー |

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

## ライセンス

MIT
