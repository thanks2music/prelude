#!/bin/bash

# iCloud ドキュメント作成ヘルパー
# ⚠️ このスクリプトは iCloud に直接ファイルを作成します
# リポジトリ内には一切ファイルを作成しません

set -e

# =====================================
# 設定
# =====================================
ICLOUD_DOC_PATH="Prelude"  # このプロジェクトの iCloud ディレクトリ名

# MWeb ベースパス（.zshrc から取得）
if [ -z "$MWEB_ICLOUD_BASE" ]; then
    echo "❌ エラー: MWEB_ICLOUD_BASE 環境変数が設定されていません"
    echo ""
    echo "MWEB_ICLOUD_BASE を .zshrc に追加してください。"
    echo ""
    echo "追加後、以下のコマンドを実行してください："
    echo "  source ~/.zshrc"
    exit 1
fi

ICLOUD_BASE="$MWEB_ICLOUD_BASE/$ICLOUD_DOC_PATH"
TEMPLATE="$ICLOUD_BASE/00-general/templates/project-template.md"

# 色付きログ出力
log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# 使い方を表示
usage() {
    echo "使い方: $0 <category/project> <filename>"
    echo ""
    echo "例："
    echo "  $0 foundry/stripe-bun 05-frontend.md"
    echo "  $0 learning/todo-hono 01-setup.md"
    echo ""
    echo "カテゴリ："
    echo "  - foundry/      実験・プロトタイプ"
    echo "  - learning/     学習プロジェクト"
    echo "  - 00-general/   横断的な知識"
    echo ""
    echo "⚠️  注意:"
    echo "  - iCloud に直接作成されます"
    echo "  - リポジトリ内には作成されません"
    echo "  - git commit の心配はありません"
    exit 1
}

# 引数チェック
if [ $# -lt 2 ]; then
    usage
fi

CATEGORY=$1
FILENAME=$2
TARGET_DIR="$ICLOUD_BASE/$CATEGORY"
TARGET_FILE="$TARGET_DIR/$FILENAME"

# iCloud Base の存在確認
if [ ! -d "$ICLOUD_BASE" ]; then
    log_error "iCloud ベースディレクトリが見つかりません"
    echo "   $ICLOUD_BASE"
    echo ""
    echo "💡 MWeb が iCloud 同期を有効にしているか確認してください"
    exit 1
fi

# テンプレートの存在確認
if [ ! -f "$TEMPLATE" ]; then
    log_warning "テンプレートファイルが見つかりません: $TEMPLATE"
    echo ""
    read -p "テンプレートなしで空のファイルを作成しますか？ (y/N): " yn
    case "$yn" in
        [yY]*) TEMPLATE="" ;;
        *) echo "キャンセルしました"; exit 0 ;;
    esac
fi

# ディレクトリ作成
log_info "ディレクトリを作成: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# ファイルが既に存在する場合は警告
if [ -f "$TARGET_FILE" ]; then
    log_warning "ファイルが既に存在します:"
    echo "   $TARGET_FILE"
    echo ""
    read -p "上書きしますか？ (y/N): " yn
    case "$yn" in
        [yY]*) ;;
        *) echo "キャンセルしました"; exit 0 ;;
    esac
fi

# ファイルを作成
if [ -n "$TEMPLATE" ]; then
    log_info "テンプレートからドキュメントを作成..."
    cp "$TEMPLATE" "$TARGET_FILE"
else
    log_info "空のドキュメントを作成..."
    cat > "$TARGET_FILE" << 'EOFMD'
---
tags:
---

# Title

## 概要

## 内容

EOFMD
fi

echo ""
log_success "ドキュメントを作成しました（iCloud）:"
echo "   $TARGET_FILE"
echo ""
log_warning "このファイルは iCloud にのみ存在します（Git 管理外）"
