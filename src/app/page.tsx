export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">discord-notify</h1>
      <p>
        GitHub の Issue / PR を Discord フォーラムに通知する Webhook です。
        <code className="mx-1 font-mono">POST /api/notify</code>に GitHub
        Webhook を設定して使います。
      </p>
    </main>
  );
}
