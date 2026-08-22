<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PalBreed AI Agent Instructions

> [!IMPORTANT]
> **【最優先・絶対遵守ルール】**
> 1. **自律的なGit操作の禁止（明示的同意の必須化）**
>    - 開発者のチャット上での明示的な許可（「コミットして良い」「プッシュして良い」などの個別かつ直接の同意）なしに、自律的に `git commit`、`git push`、`gh` コマンドなどのGit変更および送信操作を直接実行してはなりません。
>    - 実装計画（`implementation_plan.md`）への承認（Proceed）があった場合でも、**実際のコマンド実行前には必ず再度チャット上で直接確認を取り、明確な実行の合意を得てください。**
> 2. **質問・調査時の無断コード修正の禁止**
>    - ユーザーからの入力が単なる質問、動作確認、または調査依頼である場合、テキストによる解説・調査結果の提示のみを行い、絶対にファイル修正ツール（`write_to_file`, `replace_file_content` 等）を呼び出さないでください。コードを書き換える前には、必ず具体的な変更案を提示し、明示的な許可（「修正を実行してください」等）を得てからツールを実行してください。
> 3. **提案時の5つ星評価ルール**
>    - 実装方法や技術選定など、開発者の判断・合意が必要な場面では、独断で進めず、必ず複数の解決案を提示してください。
>    - 提示する各案に対して、おすすめ度を5つ星（最大 `⭐⭐⭐⭐⭐`）で評価し、具体的な理由（メリット・デメリットなど）を必ず添えて説明してください。
> 4. **自動的なテストコードおよびドキュメントの修正義務**
>    - 本体のソースコードを修正した場合は、必ず関連するテストコード（`src/__tests__/` 等）およびドキュメント（`README.md` 等）の記述も自動的に調査し、仕様乖離が発生しないよう同時に修正を行ってください。ユーザーからの指示を待たずに自律的に修正を行う必要があります。

> [!WARNING]
> **【作業完了時のセルフチェックリストの出力義務】**
> AIエージェントは、機能実装やコードの修正が完了した際、チャットへの回答時（および `walkthrough.md`）に、必ず以下のチェックリストの実行ステータス（`[ ]` または `[x]`）を含めて報告してください。
> 
> ```markdown
> ### 🚨 AIエージェント・セルフチェックリスト
> - [ ] 修正ファイルに対する自動テスト（`npm run test`）をローカルで実行し、パスしているか
> - [ ] 静的解析（`npm run lint`）を実行し、今回の変更箇所に新規のエラーがないか
> - [ ] プロダクションビルド（`npm run build`）を実行し、型チェックを含めてビルドが成功しているか
> - [ ] 本体コードの修正に合わせて、テストコードやドキュメント（README等）も同期して修正されているか
> - [ ] 今回の変更に関して、コミット/プッシュを実行して良いかチャット上で明示的な確認を取ったか
> ```

PalBreed の開発において、AIエージェントは上記の絶対遵守ルールおよび以下のガイドラインとルールファイルを必ず読み込み、その指示に従って作業を行ってください。

## 📌 開発ワークフロー規約
リポジトリのブランチ運用、テストコードの作成義務、プルリクエスト作成やリリースなどの詳細な手順については、以下を参照してください。
* [開発ワークフロー規約](.agents/rules/workflows.md)
