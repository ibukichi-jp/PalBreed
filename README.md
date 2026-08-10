# PalBreed (パルブリード)

パルワールド（Palworld）での「手持パル管理」および「自分で実際に体験した配合結果（親A ＋ 親B ➜ 生まれたパル）をメモ代わりに記録・検索する」ためのパーソナルブリーダー用WEBアプリケーションです。

---

## 🚀 主な機能

1. **手持ちパルの動的登録**
   * 自分が捕まえた・見つけたパルを名前入力で登録。手持ちパル一覧からいつでも確認・削除できます。
   * 手持ちパル一覧はキーワード入力による部分一致検索に対応しており、多くなったパルも一瞬で絞り込めます。
2. **配合メモの記録 & 手持ち自動連動**
   * 実際に体験した「親A ＋ 親B ➜ 生まれたパル」の配合結果を記録できます。
   * 親パルは「手持ちのパル」リストからしか選択できないドロップダウン形式になっており、タイポや未所持パルの誤登録を完全に防ぎます。
   * 配合を登録すると、**生まれたパルが自動的に「手持ちパル」にも追加登録**されます。
3. **🧬 突然変異の追跡**
   * 親と異なる種類のパルが生まれた際、「突然変異として記録する」にチェックを入れて保存できます。
   * 突然変異として登録された配合は、履歴や詳細画面に紫色の **「🧬 突然変異」** バッジが付与されて可視化されます。
4. **🔍 配合メモの順引き・逆引き検索**
   * **逆引き検索 (Reverse)**: 登録済みの配合メモから、指定した「子パル」が生まれる親の組み合わせを検索します。
   * **順引き検索 (Forward)**: 登録済みの配合メモから、指定した「親パル」を使った配合履歴を検索します。
5. **💬 パル詳細ダイアログ**
   * アプリ内の手持リストや配合履歴のパル名をクリックするだけで、**「そのパルが関係するすべての配合ログ（逆引き・順引き結果）」**がポップアップで瞬時に集計表示されます。
6. **🔒 Google 認証 (OAuth) ＆ 開発用モックログイン**
   * Supabase Auth を用いたシンプルな Google ログインのみに対応。ユーザー名の登録ステップなども不要です。
   * ローカル開発やオフラインでの確認のために、Google連携なしで手軽に動作検証できる「モックログイン機能」を内蔵しています。

---

## 🛠️ 技術スタック

* **Frontend**: Next.js (App Router), React, TypeScript
* **Styling**: Tailwind CSS, shadcn/ui (プレミアムダークテーマ)
* **Backend & Database**: Supabase (PostgreSQL, Supabase Auth)
* **Icons**: Lucide React

---

## 📦 セットアップ手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Supabase のデータベース構築
Supabaseダッシュボードの **「SQL Editor」** を開き、プロジェクト内の [scripts/supabase_schema.sql](file:///scripts/supabase_schema.sql) の内容をすべて貼り付けて **「Run」** を実行します。
*(※ マスタデータのシードなどの初期データ投入は一切不要です)*

### 3. 環境変数の設定
プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の項目を設定します。

```bash
# Supabase 設定
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseプロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabaseのAnon API Key

# 開発用モックログイン設定
# 'true' にするとGoogle認証なしで「テストユーザーでログイン」が可能になります。本番では 'false' にします。
NEXT_PUBLIC_DEVELOPMENT_MOCK_AUTH=true
```

### 4. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認します。

---

## 🌐 デプロイ (Vercel)

1. VercelのダッシュボードからGitHubリポジトリ（`ibukichi-jp/PalBreed`）をインポートします。
2. Settings ➜ **「Environment Variables」** に、上記の `.env.local` と同様の3つの環境変数を設定します（`NEXT_PUBLIC_DEVELOPMENT_MOCK_AUTH` は必ず `false` を指定してください）。
3. デプロイを実行し、発行された本番ドメインをコピーします。
4. Supabaseの **「Authentication」** ➜ **「URL Configuration」** を開き、以下を設定します：
   * **Site URL**: 本番ドメイン (例: `https://palbreed.vercel.app`)
   * **Redirect URLs**: `http://localhost:3000/**` を追加（ローカル開発も併用できるようにするため）
