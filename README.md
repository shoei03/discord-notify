# discord-notify

GitHub WebhookをDiscordフォーラムチャンネルに通知するNext.jsアプリケーション。

## デプロイ先

| サービス | プロジェクト | 用途 |
|---------|-------------|------|
| Vercel | [discord-notify](https://vercel.com/shoei-yoshidas-projects/discord-notify) | アプリ本体（`https://discord-notify-chi.vercel.app`） |
| Supabase | [discord-notify](https://supabase.com/dashboard/project/wxuegcthqdkrmdcnlbpv) | スレッド情報の保存（`threads` テーブル）。Vercel Marketplace 連携で作成し、環境変数は自動で同期される |

## 機能

- GitHub Issue/PR の作成、コメント、レビュー、クローズをDiscordに通知
- 同じIssue/PRは同じDiscordスレッドに追記
- Supabaseでスレッド情報を管理

## 対応アクション

| イベント（`X-GitHub-Event`） | アクション | 説明 |
|-----------|-----------|------|
| `issues` / `pull_request` | `opened` | Issue/PRが作成された |
| `issue_comment` | `created` | コメントが追加された |
| `pull_request_review` | `submitted` | レビューが投稿された |
| `issues` / `pull_request` | `closed` | Issue/PRがクローズされた |

これ以外のイベントとアクションは投稿せずに 200 を返す。スレッドは `owner/repo#番号` で照合するので、複数リポジトリから同じエンドポイントに送っても混ざらない。

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. 環境変数の設定

アプリが読むのは 4 つ（一覧と説明は `.env.example`）。本番と開発で置き場所が違う。

| | 本番 | 開発（手元） |
|---|---|---|
| 値の置き場所 | Vercel の環境変数 | 1Password Environment（`.env` にマウント） |
| 平文のファイル | なし | なし |
| `DISCORD_WEBHOOK_URL` | 本番チャンネル | テスト用チャンネル |
| `GITHUB_WEBHOOK_SECRET` | GitHub の Webhook 設定と同じ値 | ローカル用の別の値 |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Supabase 連携が自動で登録 | 本番と同じ値（DB は共用） |

開発の準備:

1. 1Password デスクトップアプリで Environment を作り、`.env.example` の 4 つを入れる
2. 「Connect to → Local .env file」で、マウント先をリポジトリ直下の `.env` にする
3. `bun run dev`（1Password アプリが起動している必要がある）

注意:

- `bunfig.toml` の `env = false` で、Bun による `.env` の自動読み込みを切っている。マウントされた `.env` は同時に読まれると失敗することがあり、Bun が先に読むと Next.js が読めなくなるため
- `vercel env pull` は使わない。使わない DB パスワードまで平文で書き出すため。手元から本番の DB を直接操作したいときだけ、`bunx vercel@latest env pull <一時ファイル>` で書き出し、終わったら消す
- 開発でも本番の DB に書き込む。試したあとにできた行は消す

### 3. Supabaseテーブル作成

Supabase管理画面のSQL Editorで実行:

```sql
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL UNIQUE,
  thread_name TEXT NOT NULL,
  -- `owner/repo#番号`。スレッドの照合に使う
  thread_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_threads_thread_name ON threads(thread_name);

-- ポリシーは作らない。secret キーだけが RLS を bypass して読み書きできる
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
```

既存のテーブルには、デプロイ前に次を実行する:

```sql
ALTER TABLE threads ADD COLUMN thread_key TEXT UNIQUE;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
```

`thread_key` が空の既存の行は、初めてイベントが届いたときにスレッド名で照合し、キーを書き込む。

### 4. 開発サーバー起動

```bash
bun run dev
```

### 5. GitHub Webhookの設定

1. GitHubリポジトリの Settings > Webhooks > Add webhook
2. Payload URL: `https://discord-notify-chi.vercel.app/api/notify`
3. Content type: `application/json`
4. Secret: `GITHUB_WEBHOOK_SECRET` と同じ値（未設定・不一致のリクエストは 401 で拒否）
5. Events: Issues, Issue comments, Pull requests, Pull request reviews

## API

### POST /api/notify

GitHub Webhookからのリクエストを受け取り、Discordに通知します。

**レスポンス例:**

```json
{
  "threadId": "1234567890",
  "threadName": "#1 Issue Title",
  "created": true
}
```

| ステータス | 条件 |
|-----------|------|
| 200 | 投稿した。または対象外のイベント（`{ "message": ... }`） |
| 400 | JSON や payload の形が不正 |
| 401 | 署名が無い、または一致しない |
| 500 | スレッドの検索に失敗した（GitHub に再送させる）、または設定ミス |
| 502 | Discord への投稿に失敗した |

エラーの詳細はレスポンスに含めず、サーバーログにだけ出す。

## セキュリティ上の既知の制限

- `X-GitHub-Delivery` による重複配信・リプレイの排除はしていない（署名付きリクエストを盗聴される前提が必要で、優先度は低い）
- 同じ Issue へのイベントが同時に届くと、スレッドが重複して作られることがある

## 技術スタック

- Next.js 16
- React 19
- Supabase
- TypeScript
- Biome (Linter/Formatter)
