# Stripe-Bun フロントエンドアーキテクチャ

## 概要

このドキュメントは、React 19 + Stripe Elements を使用した決済統合を実装する stripe-bun プロジェクトのフロントエンドアーキテクチャを説明します。backend/frontend 分離構造を採用しています。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                  クライアントブラウザ                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React 19 App (http://localhost:3001)                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  App.tsx                                        │  │  │
│  │  │  - loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY)   │  │  │
│  │  │  - Elements Provider                           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  CheckoutForm.tsx                               │  │  │
│  │  │  - CardElement (Stripe iframe)                  │  │  │
│  │  │  - confirmCardPayment()                         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (CORS 有効)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Backend API (http://localhost:3000)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  POST /create-payment-intent                          │  │
│  │  - 金額と通貨のバリデーション                          │  │
│  │  - Stripe SDK で PaymentIntent を作成                │  │
│  │  - clientSecret を返却                                │  │
│  │  └───────────────────────────────────────────────────┘  │
│                                                              │
│  環境変数: STRIPE_SECRET_KEY (サーバー専用)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Stripe API                                │
└──────────────────────────────────────────────────────────────┘
```

## プロジェクト構造

```
stripe-bun/
├── backend/                   # API サーバー (port 3000)
│   ├── src/
│   │   ├── server.ts         # Bun.serve (CORS 対応)
│   │   └── stripeClient.ts   # Stripe SDK 初期化
│   ├── .env                  # STRIPE_SECRET_KEY
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                  # 開発サーバー (port 3001)
│   ├── src/
│   │   ├── App.tsx           # Elements 統合メインコンポーネント
│   │   ├── CheckoutForm.tsx  # 決済フォーム (CardElement)
│   │   ├── main.tsx          # React エントリーポイント
│   │   ├── server.ts         # Bun.serve + Bun.build()
│   │   └── styles.css
│   ├── .env                  # PUBLIC_STRIPE_PUBLISHABLE_KEY
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 環境変数管理

### PUBLIC_ プレフィックスパターン

このプロジェクトでは、環境変数を安全に管理するために **PUBLIC_ プレフィックスパターン** を採用しています：

- **サーバー専用変数** (backend/.env):
  - `STRIPE_SECRET_KEY` - クライアントに絶対公開しない
  - `STRIPE_WEBHOOK_SECRET` - クライアントに絶対公開しない

- **クライアント安全変数** (frontend/.env):
  - `PUBLIC_STRIPE_PUBLISHABLE_KEY` - クライアントへの公開が安全
  - `PUBLIC_` プレフィックスを持つ変数のみクライアントバンドルに注入される

### 動作原理

`PUBLIC_` プレフィックスパターンは、Bun のビルドシステムを使用して実装されています：

1. **ビルド時注入** (frontend/src/server.ts):
   ```typescript
   const buildResult = await Bun.build({
     entrypoints: ['./src/main.tsx'],
     outdir: './dist',
     target: 'browser',
     define: {
       'process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
         process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
       ),
     },
   })
   ```

2. **クライアント側での使用** (frontend/src/App.tsx):
   ```typescript
   // ビルド時に次のように置換される: const publishableKey = "pk_test_..."
   const publishableKey = process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
   const stripePromise = loadStripe(publishableKey)
   ```

### セキュリティ上の利点

1. **明示的な意図表明**: `PUBLIC_` プレフィックスにより、どの変数がクライアント公開安全かが明確
2. **ビルド時置換**: 変数はランタイムではなくビルド時に文字列リテラルに置換される
3. **漏洩防止**: `PUBLIC_` プレフィックスのない秘密鍵は絶対にクライアントバンドルに含まれない
4. **型安全性**: TypeScript がビルド時に必要な変数の存在を検証可能

## フロントエンド開発サーバー

フロントエンドはカスタム Bun 開発サーバーを使用しており、以下の機能を提供します：

1. **起動時ビルド**: `Bun.build()` を実行して React コードをトランスパイル・バンドル
2. **環境変数注入**: `define` オプションを使用して `PUBLIC_*` 変数を注入
3. **静的アセット配信**: HTML、JS、CSS ファイルの配信を処理
4. **動的 HTML 生成**: ハッシュ付き JS ファイル名を含む HTML を生成

### 主要実装 (frontend/src/server.ts)

```typescript
// 1. 環境変数のバリデーション
if (!process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

// 2. 環境変数注入付きで React アプリをビルド
const buildResult = await Bun.build({
  entrypoints: ['./src/main.tsx'],
  outdir: './dist',
  target: 'browser',
  naming: '[dir]/[name].[hash].[ext]',
  define: {
    'process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
  },
})

// 3. ビルド済み JS ファイル名を取得
const jsFileName = buildResult.outputs.find(o => o.path.endsWith('.js')).path.split('/').pop()

// 4. ビルド済み JS を参照する HTML を生成
const htmlContent = `<!DOCTYPE html>
<html lang="ja">
  <head>...</head>
  <body>
    <div id="root"></div>
    <script type="module" src="/dist/${jsFileName}"></script>
  </body>
</html>`

// 5. Bun.serve で配信
Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/') return new Response(htmlContent, ...)
    if (url.pathname.startsWith('/dist/')) return new Response(Bun.file(`.${url.pathname}`))
    ...
  }
})
```

## CORS 設定

Backend は Frontend との通信を許可するため CORS を有効化しています：

```typescript
// backend/src/server.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Preflight リクエストの処理
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: corsHeaders })
}
```

## 決済フロー

1. **ユーザーが金額を入力** → Frontend が CardElement を表示
2. **ユーザーがカード情報を入力** → Stripe iframe 内で安全に保管（PCI 準拠）
3. **ユーザーが「支払う」をクリック** → Frontend が Backend の `/create-payment-intent` を呼び出し
4. **Backend が PaymentIntent を作成** → `clientSecret` を返却
5. **Frontend が決済を確認** → `stripe.confirmCardPayment(clientSecret, cardElement)`
6. **Stripe が決済を処理** → Frontend に成功/エラーを返却
7. **Frontend が結果を表示** → 成功メッセージまたはエラー

## 技術スタック

- **ランタイム**: Bun v1.3.2
- **フロントエンド**: React 19, @stripe/react-stripe-js v3.10.0, @stripe/stripe-js v5.10.0
- **バックエンド**: Bun.serve, Stripe SDK v19+
- **ビルドシステム**: Bun.build() (`define` オプションによる環境変数注入)
- **TypeScript**: Strict mode with ESNext target

## 設計判断

### なぜ Backend/Frontend を分離？

1. **セキュリティ**: 秘密鍵を Backend に隔離
2. **スケーラビリティ**: Backend と Frontend を独立してデプロイ可能
3. **開発効率**: Frontend/Backend を個別に開発しやすい
4. **本番環境対応**: 一般的な本番デプロイパターンに適合

### なぜ Vite ではなく Bun.build()？

1. **一貫性**: 開発サーバーとビルドプロセスで同じランタイムを使用
2. **シンプルさ**: 追加ツールが不要
3. **パフォーマンス**: Bun のバンドラーは高速
4. **ネイティブ統合**: TypeScript と JSX のビルトインサポート

### なぜ Payment Element ではなく CardElement？

1. **最小限の実装**: カード決済のみでシンプルに開始
2. **学習曲線**: 基本的な Stripe 統合を理解しやすい
3. **将来の拡張**: 後で Payment Element にアップグレードして複数の決済方法に対応可能

## 次のステップ

1. **データベース統合**: 注文管理のため SQLite を追加
2. **Webhook 実装**: 決済ステータス更新の処理
3. **Payment Element への移行**: 複数の決済方法に対応
4. **商品選択 UI**: カートと商品選択機能を追加
5. **テスト**: ユニットテストと統合テストを追加
6. **デプロイ**: Render または Railway へデプロイ

## 参考資料

- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js)
- [Bun.build() API](https://bun.sh/docs/bundler)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)

---
