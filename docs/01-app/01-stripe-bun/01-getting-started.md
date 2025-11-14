# Bun + Stripe 実装ガイド - Getting Started

## 作業概要

**対象環境**: `apps/foundry/stripe-bun`

**実装内容**: Bun ランタイムと Stripe SDK を使用した、最小限の決済 API サーバーの構築

**達成目標**:
- PaymentIntent を作成する API エンドポイントの実装
- Stripe Webhook を使ったイベント通知の受信
- ローカル開発環境での Stripe CLI 連携

---

## 実装・修正内容

### 1. プロジェクト構成の整理

#### 1-1. ディレクトリ構造

```
apps/foundry/stripe-bun/
├── src/
│   ├── server.ts          # メイン HTTP サーバー
│   └── stripeClient.ts    # Stripe SDK クライアント
├── package.json
├── tsconfig.json
├── .env                   # 環境変数（.gitignore 対象）
└── bun.lock
```

#### 1-2. 主要ファイルの役割

| ファイル | 役割 |
|---------|------|
| `src/server.ts` | Bun.serve を使った HTTP サーバー。エンドポイント定義とルーティング |
| `src/stripeClient.ts` | Stripe SDK の初期化と環境変数検証 |
| `.env` | API キーやシークレットの管理 |

### 2. 依存関係のセットアップ

#### 2-1. Stripe SDK のインストール

```bash
cd apps/foundry/stripe-bun
bun add stripe
```

**選定理由**:
- Stripe 公式の Node.js SDK（TypeScript 完全対応）
- Bun との互換性が確認済み
- バージョン: `^19.3.1`

#### 2-2. package.json の設定

```json
{
  "name": "@prelude/stripe-bun",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bun run src/server.ts",
    "start": "bun run src/server.ts",
    "build": "bun build src/server.ts --outdir=dist"
  },
  "dependencies": {
    "stripe": "^19.3.1"
  },
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
```

**設計判断**:
- `type: "module"` で ESM を使用（Bun のデフォルト）
- スクリプトは `dev`、`start`、`build` の3つに絞る
- モノレポを意識して `@prelude/` スコープを付与

### 3. TypeScript 設定のリファクタリング

#### 3-1. モノレポ対応の設計

**課題**: 各アプリで重複する TypeScript 設定を効率化したい

**解決策**: ルートに `tsconfig.base.json` を作成し、各アプリが継承する

#### 3-2. tsconfig.base.json（新規作成）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true
  }
}
```

**設定方針**:
- `moduleResolution: "bundler"` - Bun の bundler モードに最適化
- `strict: true` - 型安全性を最大化
- 共通設定のみを定義し、アプリ固有の設定は各自で拡張

#### 3-3. stripe-bun の tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "allowJs": false,
    "resolveJsonModule": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**設計判断**:
- `extends` で基本設定を継承
- `allowJs: false` で TypeScript 専用に
- `include: ["src"]` でソースディレクトリのみを対象

### 4. Stripe クライアントの実装

#### 4-1. 環境変数の管理

`.env` ファイル（ルートではなくアプリディレクトリ内）:

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**重要な設計判断**:
- Bun は `.env` を自動読み込み（dotenv 不要）
- テストキー (`sk_test_`) のみを使用
- `.gitignore` に `.env` を追加済み

#### 4-2. stripeClient.ts の実装

```typescript
// src/stripeClient.ts
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // 通常は Stripe SDK のデフォルト API バージョンで問題ない。
  // 明示したい場合のみ apiVersion を指定出来る。
  // Stripe API Version [2025-10-29.clover]
})

export { stripe }
```

**実装理由**:
- 環境変数がない場合、起動時に即座にエラーで落とす（fail-fast）
- シングルトンパターンで Stripe インスタンスを再利用
- API バージョンはデフォルトのまま（コメントで記録）

### 5. HTTP サーバーの実装

#### 5-1. 基本構造

```typescript
// src/server.ts
import { stripe } from './stripeClient'

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)

    // ルーティング処理
    if (req.method === 'GET' && url.pathname === '/health') {
      return new Response('ok', { status: 200 })
    }

    // ... その他のエンドポイント

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Stripe+Bun server running at http://localhost:${server.port}`)
```

**設計判断**:
- `Bun.serve` のみを使用（Express や Fastify を避ける）
- シンプルな `if` 文によるルーティング
- フレームワークレスで軽量・高速

#### 5-2. PaymentIntent 作成エンドポイント

```typescript
if (req.method === 'POST' && url.pathname === '/create-payment-intent') {
  try {
    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount ?? 1000) // 例: 10.00 USD = 1000 (最小単位)
    const currency = String(body.currency ?? 'usd')

    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
```

**実装のポイント**:
- デフォルト値: 1000 USD（= $10.00）
- `Number.isFinite()` で不正な値を検証
- `automatic_payment_methods: true` でモダンな決済手段を有効化
- エラーハンドリングで 400/500 を適切に返却

#### 5-3. Webhook エンドポイント

```typescript
if (req.method === 'POST' && url.pathname === '/webhook') {
  const sig = req.headers.get('stripe-signature')
  const rawBody = await req.text() // 重要: JSON ではなく生テキスト

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig ?? '',
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    )

    // イベントタイプに応じて処理
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      console.log('Payment succeeded', paymentIntent.id)
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('Webhook error', err)
    return new Response('Webhook error', { status: 400 })
  }
}
```

**重要な実装判断**:
- `await req.text()` を使用（`req.json()` は NG）
  - 理由: Stripe の署名検証には生のリクエストボディが必要
- `constructEvent()` で署名を検証
  - セキュリティ: 偽装されたリクエストを防ぐ
- イベントタイプで分岐処理

---

## 実装理由・背景

### なぜ Bun を選んだか？

1. **パフォーマンス**: Node.js の数倍高速
2. **開発体験**: TypeScript をネイティブサポート
3. **オールインワン**: ランタイム + パッケージマネージャ + ビルドツール
4. **学習コスト**: 既存の Node.js エコシステムと互換性が高い

### なぜ Webhook が必要か？

**問題**: クライアント側の決済完了通知は信頼できない

```
❌ 悪い例:
クライアント → サーバー: 「決済完了しました！」
サーバー: 「了解！商品を発送します」
（実際には決済が失敗していても気づけない）
```

**解決策**: Stripe から直接サーバーに通知

```
✅ 良い例:
Stripe → サーバー (Webhook): payment_intent.succeeded
サーバー: Stripe からの正式な通知を受信
サーバー: データベースを更新 → 商品発送
```

### なぜ Elements を選んだか？

**2つの選択肢**:
1. **Stripe Checkout**: Stripe ホストのページにリダイレクト
2. **Stripe Elements**: 自分のアプリ内に埋め込み

**判断理由**:
- UI/UX のカスタマイズ性が高い
- ユーザーが自サイトから離脱しない
- PaymentIntent との相性が良い

---

## 遭遇したエラーや課題

### 課題 1: ポート 3000 が使用中

**発生状況**:
```bash
$ stripe listen --forward-to localhost:3000/webhook
> Error: port 3000 is already in use
```

**原因**:
- 以前起動した Bun サーバープロセスが残っていた

**再現条件**:
- `bun run dev` を実行後、Ctrl+C で停止しなかった場合
- バックグラウンドプロセスとして残り続ける

**解決策**:
```bash
# ポートを使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または一発で終了
lsof -ti :3000 | xargs kill -9
```

### 課題 2: Webhook 署名検証エラー（予測される問題）

**エラーメッセージ**:
```
Webhook error: No signatures found matching the expected signature for payload
```

**原因**:
- `STRIPE_WEBHOOK_SECRET` が間違っている
- リクエストボディを `req.json()` でパースしてしまった

**解決策**:
1. Stripe CLI が表示する `whsec_...` を正確にコピー
2. Webhook エンドポイントでは必ず `await req.text()` を使用

### 課題 3: TypeScript 設定の重複

**問題**:
- 各アプリで同じ tsconfig 設定をコピペ
- メンテナンス性が低い

**解決策**:
- `tsconfig.base.json` で共通設定を管理
- 各アプリは `extends` で継承

---

## 解決策・対応方法

### 1. 開発サーバーの起動

```bash
# stripe-bun ディレクトリで実行
bun run dev

# または絶対パスで
bun run apps/foundry/stripe-bun/src/server.ts
```

### 2. API のテスト

#### ヘルスチェック

```bash
curl http://localhost:3000/health
# 期待: "ok"
```

#### PaymentIntent 作成

```bash
curl -X POST http://localhost:3000/create-payment-intent \
  -H 'Content-Type: application/json' \
  -d '{"amount": 1500, "currency": "usd"}'

# 期待:
# {"clientSecret":"pi_xxxxx_secret_xxxxx"}
```

### 3. Webhook のローカルテスト

#### 3-1. Stripe CLI のインストール

```bash
# macOS
brew install stripe/stripe-cli/stripe

# ログイン
stripe login
```

#### 3-2. Webhook フォワーディング

**ターミナル 1**: Bun サーバー起動

```bash
bun run dev
```

**ターミナル 2**: Stripe CLI でトンネル作成

```bash
stripe listen --forward-to localhost:3000/webhook
# 出力される whsec_xxx を .env に追加
```

#### 3-3. テストイベント送信

**ターミナル 3**: イベントをトリガー

```bash
stripe trigger payment_intent.succeeded
```

**期待される動作**:
- ターミナル 1（Bun サーバー）に以下が表示される:
  ```
  Payment succeeded pi_xxxxxxxxxxxxx
  ```

### 4. Webhook の本番設定（デプロイ後）

**Stripe Dashboard での設定手順**:

1. Stripe Dashboard にログイン
2. **Developers → Webhooks** に移動
3. **Add endpoint** をクリック
4. 以下を入力:
   - **Endpoint URL**: `https://your-app.render.com/webhook`
   - **Events to send**:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
5. **Signing secret** (`whsec_...`) をコピー
6. PaaS の環境変数に `STRIPE_WEBHOOK_SECRET` として設定

---

## 残課題・改善点

### 未対応項目

#### 1. データベース連携
- **現状**: PaymentIntent の情報をログ出力のみ
- **課題**: 注文データと紐付けできていない
- **次のステップ**:
  - SQLite または Postgres でシンプルな注文テーブルを作成
  - PaymentIntent ID と注文 ID を紐付け
  - Webhook で注文ステータスを更新

#### 2. フロントエンド実装
- **現状**: curl でのテストのみ
- **課題**: 実際のカード入力画面がない
- **次のステップ**:
  - React で Payment Element を実装
  - `/create-payment-intent` から clientSecret を取得
  - Stripe Elements で決済フローを完成

#### 3. エラーハンドリングの強化
- **現状**: 500 エラーで一律処理
- **改善案**:
  - Stripe のエラータイプ別にハンドリング
  - カード拒否、ネットワークエラー、API エラーを区別
  - ユーザーフレンドリーなエラーメッセージ

#### 4. セキュリティ強化
- **課題**: CORS 設定がない
- **改善案**:
  - 本番環境では CORS を適切に設定
  - レート制限の実装
  - Idempotency-Key の活用（二重決済防止）

#### 5. ロギングとモニタリング
- **現状**: console.log のみ
- **改善案**:
  - 構造化ログ（JSON 形式）
  - エラートラッキング（Sentry など）
  - 決済成功率のメトリクス収集

### 技術的負債

#### 1. ルーティングの肥大化
- **問題**: `if` 文の羅列で可読性が低下する可能性
- **リファクタリング案**:
  - ルーターライブラリの導入（例: Hono）
  - または独自のルーティング関数を実装

#### 2. テストコードの不在
- **問題**: 自動テストがない
- **改善案**:
  - `bun test` でユニットテスト作成
  - エンドポイントの統合テスト
  - Stripe のモック化

---

## 参考リンク・補足情報

### 公式ドキュメント

- [Stripe API ドキュメント](https://docs.stripe.com/api)
- [Stripe Payment Intents](https://docs.stripe.com/payments/payment-intents)
- [Stripe Webhooks](https://docs.stripe.com/webhooks)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)
- [Bun Documentation](https://bun.sh/docs)
- [Bun.serve API](https://bun.sh/docs/api/http)

### 内部ドキュメント

- `reference/01-bun-stripe/01-bun-stripe-first-step-guide.md` - 元となった実装ガイド
- `CLAUDE.md` - リポジトリ全体の開発ガイド
- `CLAUDE.ja.md` - 日本語版開発ガイド

### Stripe のテスト用カード

決済フローのテスト時に使用できるカード番号:

| カード番号 | 用途 |
|-----------|------|
| `4242 4242 4242 4242` | 成功ケース |
| `4000 0000 0000 0002` | カード拒否 |
| `4000 0000 0000 9995` | 残高不足 |

---

## 開発者メモ

### 成功したポイント

1. **Bun の高速な開発サイクル**
   - ホットリロードが非常に速い
   - TypeScript のビルド不要で即実行可能

2. **Stripe SDK の TypeScript 対応**
   - 型定義が完璧で補完が効く
   - ドキュメントが充実している

3. **Webhook のローカルテスト**
   - Stripe CLI のトンネル機能が優秀
   - ngrok などの外部ツール不要

### 失敗から学んだこと

1. **環境変数の検証は起動時に**
   - リクエスト処理時ではなく、サーバー起動時にチェック
   - fail-fast で問題を早期発見

2. **Webhook は生のボディが必要**
   - `req.json()` を使うと署名検証が失敗する
   - `req.text()` を必ず使用

3. **プロセス管理の重要性**
   - 開発中のプロセスが残りやすい
   - `lsof` コマンドを覚えておく

---

