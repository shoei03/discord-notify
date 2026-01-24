# discord-notify

GitHub WebhookをDiscordフォーラムチャンネルに通知するNext.jsアプリケーション。

## 機能

- GitHub Issue/PR の作成、コメント、レビュー、クローズをDiscordに通知
- 同じIssue/PRは同じDiscordスレッドに追記
- Supabaseでスレッド情報を管理

## 対応アクション

| アクション | 説明 |
|-----------|------|
| `opened` | Issue/PRが作成された |
| `created` | コメントが追加された |
| `edited` | コメントが編集された |
| `submitted` | レビューが投稿された |
| `closed` | Issue/PRがクローズされた |

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. 環境変数の設定

`.env`ファイルを作成:

```env
# Discord
DISCORD_FORUM_CHANNEL_ID=https://discord.com/api/webhooks/xxx/yyy

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Supabaseテーブル作成

Supabase管理画面のSQL Editorで実行:

```sql
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL UNIQUE,
  thread_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_threads_thread_id ON threads(thread_id);
```

### 4. 開発サーバー起動

```bash
bun run dev
```

### 5. GitHub Webhookの設定

1. GitHubリポジトリの Settings > Webhooks > Add webhook
2. Payload URL: `https://discord-notify-sepia.vercel.app/api/notify`
3. Content type: `application/json`
4. Events: Issues, Issue comments, Pull requests, Pull request reviews

## API

### POST /api/notify

GitHub Webhookからのリクエストを受け取り、Discordに通知します。

**レスポンス例:**

```json
{
  "success": true,
  "threadId": "1234567890",
  "threadName": "#1 Issue Title",
  "dbSaved": true
}
```

## 技術スタック

- Next.js 16
- React 19
- Supabase
- TypeScript
- Biome (Linter/Formatter)
