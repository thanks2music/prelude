# Preludex

## 概要
Preludex（プレリュデックス）は、「これから何かを作る前段階」を静かに整えるための、ドキュメント取得専用CLIツールです。

多くの開発者は、新しい技術・API・フレームワークを触る際、まず公式ドキュメントを読み込み、構造を把握し、手元で参照できる状態にしたいと考えます。しかし実際には、

- ドキュメントはWeb上に分散している
- Next.js / React ベースでHTMLを直接保存しづらい
- GitHubにすべてのMarkdownが公開されているとは限らない

といった理由から、「読む前の準備」に無駄な時間がかかっています。

Preludexはこの **制作・開発行為の事前準備** にあたる部分を自動化し、

- ドキュメントをMarkdownとして手元に揃える
- 構造を保ったままローカルに保存する
- AI（LLM / MCP）やエディタ、全文検索と組み合わせやすくする

ことを目的としています。

## CLIの基本コンセプト

```
bunx preludex <docs-url> [options]
```

例:

```
bunx preludex https://platform.claude.com/docs/en/home --out docs/claude
```

この1コマンドで「Docsを読む前の準備」が完了する状態を目指します。

---

## 出力ディレクトリ仕様

`--out` オプションで指定したディレクトリをルートとして、
Docsサイトの論理構造をそのまま反映します。

例:

```
--out docs/claude
```

生成される構造:

```
docs/claude/
├─ home.md
├─ api/
│  └─ messages.md
└─ guide/
   └─ quickstart.md
```

ルール:

- ページURL + `.md` を基本取得対象とする
- `/docs/en/intro` → `intro.md`
- `/docs/en/api/messages` → `api/messages.md`
- 相対リンク構造をディレクトリに反映

---

## npm 公開前チェックリスト

### 1. パッケージ基本設定

- package.json
  - `name`: preludex
  - `version`: 0.1.0（MVP）
  - `type`: module
  - `bin`: { "preludex": "dist/cli.js" }

### 2. CLI 実行設定

- dist/cli.js の先頭に shebang

```js
#!/usr/bin/env node
```

- 実行権限

```bash
chmod +x dist/cli.js
```

### 3. ビルド

- TypeScript → dist/ に出力
- CLIエントリは必ずJS

### 4. ライセンス

- MIT License を想定
- LICENSE ファイルを同梱

### 5. npm 公開前チェック

```bash
npm pack
npm publish --access public
```

---

## 想定される利用シーン

- 新しいAPIを触る前のローカルDocs保存
- LLM / MCP 用のローカル知識ベース構築
- Obsidian / VS Code / Ripgrep での全文検索
- オフライン参照

---

## 今後のアクション予定

### 1. 再帰クロール対応

- BFS（幅優先探索）
- visited セットによる重複防止
- `--max-depth` オプション追加

### 2. Docs種別ごとの差分整理

- Claude Docs（.md が直接存在）
- Next.js Docs（HTML + MD混在）
- React Docs
- OpenAI Platform Docs

→ サイトごとの軽量アダプタ設計

- 将来的には、どのライブラリで開発されていてもダウンロード出来るように調整する
  - Docusaurus
  - VitePress
  - Starlight
  - MkDocs
  - Sphinx
  - GitBook

### 3. URLに `sitemap.xml` を指定し一括ダウンロード

- デフォルトの挙動: `bunx preludex https://domain.com/docs/ovewview --out docs/domain` でリンクを辿り順番にダウンロードする
- オプション: `bunx preludex https://domain.com/sitemap.xml --out docs/domain --use-sitemap` でサイトマップから一括ダウンロード出来るようにする