# PalBreed (パルブリード)

パルワールド（Palworld）での「手持パル管理」および「自分で実際に体験した配合結果（親A ＋ 親B ➜ 生まれたパル）をメモ代わりに記録・検索する」ためのパーソナルブリーダー用WEBアプリケーションです。

ユーザー自身がゲーム内で実際に試して見つけた配合結果をログとして書き留め、自分だけの配合データベースを構築していくことができます。

---

## 🎨 技術バッジ

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 🚀 主な機能

1. **手持ちパルの動的登録**
   * 自分が捕まえた・見つけたパルを名前入力で登録。手持ちパル一覧からいつでも確認・削除できます。
   * 手持ちパル一覧はキーワード入力による部分一致検索に対応しており、多くなったパルも一瞬で絞り込めます。
2. **配合メモの記録 & 手持ち自動連動**
   * 実際に体験した「親A ＋ 親B ➜ 生まれたパル」の配合結果を記録できます。
   * 親パル入力欄は、手持ちのパル名が前方一致（ひらがな入力による自動カタカナ補完対応）でサジェストされる形式になっています。送信時にバリデーションチェックが行われるため、タイポや未所持パルの誤登録を完全に防ぎます。
   * 「生まれたパル」入力欄も同様に手持ちパルからサジェストされ、こちらは未所持パルの誕生も記録できるよう自由入力を許可しています。
   * 配合を登録すると、**生まれたパルが自動的に「手持ちパル」にも追加登録**されます。
3. **🧬 突然変異の追跡**
   * 親と異なる種類のパルが生まれた際、「突然変異として記録する」にチェックを入れて保存できます。
   * 同一の親ペアであっても、「通常配合」と「突然変異配合（別の子パル）」の双方を重複せずに同時に記録・管理することができます。
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
*(※ 依存関係インストール時に、Gitのコミットフックツールである Husky が自動的にセットアップされます。これにより `main` ブランチへの直接コミットが自動的にブロックされるようになります)*

### 2. Supabase のデータベース構築
Supabaseダッシュボードの **「SQL Editor」** を開き、プロジェクト内の `scripts/supabase_schema.sql` の内容をすべて貼り付けて **「Run」** を実行します。
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

---

## 📄 免責事項 (Disclaimer)

* 本アプリケーションは個人によって開発された非公式のファンメイド作品です。
* ゲーム『Palworld (パルワールド)』の提供元である株式会社ポケットペア（Pocketpair, Inc.）様とは一切関係がありません。
* 本アプリで使用されているゲーム内の商標、名称などの知的財産権は、それぞれの権利所有者に帰属します。

---

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) の元で公開されています。
