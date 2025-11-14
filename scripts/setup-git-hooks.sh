#!/bin/bash

# Git フックのセットアップスクリプト
# 新しいマシンで git clone した後に実行する
# 機密情報の誤コミットを防止するため、pre-commit フックを設定します

set -e

HOOKS_DIR=".git/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔧 Git フックをセットアップしています..."
echo ""

# .git ディレクトリの確認
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ エラー: .git ディレクトリが見つかりません"
    echo "   このスクリプトは Git リポジトリのルートで実行してください"
    exit 1
fi

# 既存の pre-commit フックを確認
if [ -f "$PROJECT_ROOT/$HOOKS_DIR/pre-commit" ]; then
    echo "⚠️  警告: 既存の pre-commit フックが見つかりました"
    echo ""
    read -p "上書きしますか？ (y/N): " yn
    case "$yn" in
        [yY]*) echo "既存のフックを上書きします..." ;;
        *) echo "キャンセルしました"; exit 0 ;;
    esac
    echo ""
fi

# Pre-commit フックを作成
cat > "$PROJECT_ROOT/$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash

# Pre-commit フック: 機密情報の誤コミット防止

set -e

echo "🔍 機密情報チェックを実行中..."

# 本番用 Stripe API キーのチェック
if git diff --cached --diff-filter=ACM --name-only -z | xargs -0 grep -l "sk_live_" 2>/dev/null | grep -v "\.md$" | grep -v "^scripts/" 2>/dev/null; then
    echo ""
    echo "❌ エラー: 本番用の Stripe API キー (sk_live_) を含むファイルが見つかりました"
    echo ""
    echo "以下のファイルを確認してください："
    git diff --cached --diff-filter=ACM --name-only -z | xargs -0 grep -l "sk_live_" 2>/dev/null | grep -v "\.md$" | grep -v "^scripts/"
    echo ""
    echo "💡 テスト用キー (sk_test_) を使用してください"
    exit 1
fi

# .env ファイルのチェック（.env.example を除く）
if git diff --cached --name-only | grep -E "\.env$" | grep -v "\.env\.example$" 2>/dev/null; then
    echo ""
    echo "❌ エラー: .env ファイルをコミットしようとしています"
    echo ""
    echo "以下のファイルを確認してください："
    git diff --cached --name-only | grep -E "\.env$" | grep -v "\.env\.example$"
    echo ""
    echo "💡 .env.example を使用するか、.gitignore に追加されているか確認してください"
    exit 1
fi

# whsec_ で始まる Webhook シークレットのチェック（本番環境用）
if git diff --cached --diff-filter=ACM --name-only -z | xargs -0 grep -l "whsec_" 2>/dev/null | grep -v "\.md$" | grep -v "^scripts/" 2>/dev/null; then
    echo ""
    echo "⚠️  警告: Webhook シークレット (whsec_) を含むファイルが見つかりました"
    echo ""
    echo "以下のファイルを確認してください："
    git diff --cached --diff-filter=ACM --name-only -z | xargs -0 grep -l "whsec_" 2>/dev/null | grep -v "\.md$" | grep -v "^scripts/"
    echo ""
    read -p "このままコミットしますか？ (y/N): " yn
    case "$yn" in
        [yY]*) ;;
        *) echo "コミットをキャンセルしました"; exit 1 ;;
    esac
fi

echo "✅ 機密情報チェック完了"
EOF

# 実行権限を付与
chmod +x "$PROJECT_ROOT/$HOOKS_DIR/pre-commit"

echo "✅ Pre-commit フックをセットアップしました"
echo ""
echo "📝 セットアップ内容："
echo "  - 本番用 Stripe API キー (sk_live_) の検出"
echo "  - .env ファイルのコミット防止"
echo "  - Webhook シークレット (whsec_) の警告"
echo ""
echo "💡 テスト方法："
echo ""
echo "  # テストファイルを作成"
echo "  echo 'STRIPE_SECRET_KEY=sk_live_test' > test-secret.txt"
echo "  git add test-secret.txt"
echo "  git commit -m 'test'  # → エラーになるはず"
echo "  rm test-secret.txt"
echo ""
echo "✅ セットアップが完了しました！"
