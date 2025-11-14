# stripe-bun

Stripe 決済統合のデモアプリケーション（Bun + React 19 + Stripe Elements）

## プロジェクト構造

```
stripe-bun/
├── backend/          # Bun バックエンド API
│   ├── src/
│   │   ├── server.ts       # HTTP サーバー (Bun.serve)
│   │   └── stripeClient.ts # Stripe SDK 初期化
│   └── .env                # STRIPE_SECRET_KEY
├── frontend/         # React フロントエンド
│   ├── src/
│   │   ├── App.tsx           # メインコンポーネント
│   │   ├── CheckoutForm.tsx  # 決済フォーム (CardElement)
│   │   ├── main.tsx          # React エントリーポイント
│   │   ├── server.ts         # 開発サーバー (Bun.serve)
│   │   └── styles.css        # スタイル
│   ├── index.html
│   └── .env                  # STRIPE_PUBLISHABLE_KEY
└── README.md
```

## セットアップ

### 1. 依存関係のインストール

```bash
# バックエンド
cd backend
bun install

# フロントエンド
cd ../frontend
bun install
```

### 2. 環境変数の設定

#### バックエンド (`backend/.env`)

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### フロントエンド (`frontend/.env`)

```bash
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**重要:** `PUBLIC_` プレフィックスは必須です。これにより、Bun.build() がビルド時にこの環境変数をクライアント側のJavaScriptに安全に注入します。

**Stripe API キーの取得:**
1. [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) にアクセス
2. テストモードで Secret Key と Publishable Key を取得
3. それぞれの `.env` ファイルにコピー

### 3. 起動

**ターミナル1 - バックエンド (http://localhost:3000):**

```bash
cd backend
bun run dev
```

**ターミナル2 - フロントエンド (http://localhost:3001):**

```bash
cd frontend
bun run dev
```

### 4. テスト

1. ブラウザで http://localhost:3001 を開く
2. 金額を入力（デフォルト: 1000 = $10.00）
3. テストカード情報を入力:
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: 任意の未来日（例: `12/34`）
   - CVC: 任意の3桁（例: `123`）
4. 「支払う」ボタンをクリック

## API エンドポイント

### `GET /health`

ヘルスチェック

### `POST /create-payment-intent`

決済意図を作成して clientSecret を返す

**リクエスト:**

```json
{
  "amount": 1000,
  "currency": "usd"
}
```

**レスポンス:**

```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

## 技術スタック

- **ランタイム:** Bun v1.3.2
- **バックエンド:** Bun.serve, Stripe SDK v19+
- **フロントエンド:** React 19, @stripe/react-stripe-js, @stripe/stripe-js
- **ビルドシステム:** Bun.build() with environment variable injection (PUBLIC_* prefix)
- **TypeScript:** 厳格モード

## 環境変数の管理

このプロジェクトでは、環境変数を安全に管理するために `PUBLIC_` プレフィックスを使用しています：

- **バックエンド** (`backend/.env`):
  - `STRIPE_SECRET_KEY`: Stripe Secret Key（サーバー専用、絶対に公開禁止）
  - `STRIPE_WEBHOOK_SECRET`: Webhook署名検証用（サーバー専用）

- **フロントエンド** (`frontend/.env`):
  - `PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe Publishable Key（クライアント側で使用、公開可）

`PUBLIC_` プレフィックスを持つ環境変数のみが、`Bun.build()` の `define` オプションによってクライアント側のJavaScriptにビルド時に注入されます。これにより、秘密情報（Secret Key）がクライアント側に漏れることを防ぎます。

This project was created using `bun init` in bun v1.3.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Next Actions:

1. ~~**フロントエンド連携**~~ ✅ **完了**
   - ~~React + Stripe Elements の実装~~
   - ~~clientSecret を使った決済フローの完成~~
   - ~~CORS 設定~~

2. **データベース導入** (優先度: 高)
   - SQLite でシンプルな注文管理
   - Webhook で注文ステータス更新

3. **デプロイ** (優先度: 中)
   - Render または Railway へのデプロイ
   - 本番環境での Webhook 設定

4. **セキュリティ強化** (優先度: 中)
   - レート制限
   - Idempotency-Key の実装

5. **テスト追加** (優先度: 低)
   - ユニットテスト
   - 統合テスト
