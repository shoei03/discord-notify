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

アプリが読むのは `DISCORD_WEBHOOK_URL`、`GITHUB_WEBHOOK_SECRET`、`SUPABASE_URL`、`SUPABASE_SECRET_KEY` の 4 つ。

```bash
# Supabase の変数を .env.local に取得する（Vercel の Supabase 連携が登録したもの）
bunx vercel@latest link --scope shoei-yoshidas-projects --project discord-notify
bunx vercel@latest env pull

# 残りの 2 つは Vercel から取得できない（本番のみ・sensitive）ので、.env に手で書く
cp .env.example .env
```

`env pull` は `.env.local` を上書きするので、手で書く値は `.env` に置く。各変数の説明は `.env.example` を参照。

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
