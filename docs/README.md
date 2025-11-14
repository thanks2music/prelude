## ドキュメント管理

このリポジトリは2種類のドキュメントを管理しています：

### 公開ドキュメント (`docs/`)

- Git で管理
- GitHub で公開
- 一般的な実装ガイドやアーキテクチャ解説

### 機密ドキュメント (iCloud)

- Git 管理外
- iCloud Drive で同期（Mac, iPad, iPhone で閲覧可能）
- 実装メモ、テスト用APIキー、デプロイ手順など

**新しいドキュメントの作成:**
```bash
./scripts/new-icloud-doc.sh foundry/stripe-bun 05-frontend.md
```

### セットアップ手順

MWebでMarkdownのドキュメントを読むため、草案で以下のルールとする。

#### 1. 環境変数の設定

ドキュメント管理には、以下の環境変数を追加

```bash
export MWEB_ICLOUD_BASE="{YOUR_PATH}"
```

設定後、反映：
```bash
source ~/.zshrc
```

### 2. Git フックのセットアップ

```bash
# Git フックのセットアップ（機密情報の誤コミット防止）
./scripts/setup-git-hooks.sh
```

このスクリプトは以下をチェックする pre-commit フックを設定します：
- 本番用 Stripe API キー (`sk_live_`) の検出
- `.env` ファイルのコミット防止
- Webhook シークレットの警告

その他、詳細は [DEVELOPMENT.md](DEVELOPMENT.md) を参照。
