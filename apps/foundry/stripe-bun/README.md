# stripe-bun

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

This project was created using `bun init` in bun v1.3.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Next Actions:

1. **フロントエンド連携** (優先度: 高)
   - React + Stripe Elements の実装
   - clientSecret を使った決済フローの完成

2. **データベース導入** (優先度: 高)
   - SQLite でシンプルな注文管理
   - Webhook で注文ステータス更新

3. **デプロイ** (優先度: 中)
   - Render または Railway へのデプロイ
   - 本番環境での Webhook 設定

4. **セキュリティ強化** (優先度: 中)
   - CORS 設定
   - レート制限
   - Idempotency-Key の実装

5. **テスト追加** (優先度: 低)
   - ユニットテスト
   - 統合テスト
