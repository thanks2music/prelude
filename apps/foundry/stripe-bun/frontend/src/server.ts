// 環境変数の存在確認
if (!process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error(
    'PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in .env file. Please add it to frontend/.env'
  )
}

console.log('Starting build process with env vars...')

// Bun.build でクライアント側コードをビルド（PUBLIC_ プレフィックスの環境変数を注入）
const buildResult = await Bun.build({
  entrypoints: ['./src/main.tsx'],
  outdir: './dist',
  target: 'browser',
  naming: '[dir]/[name].[hash].[ext]',
  define: {
    // PUBLIC_ プレフィックスの環境変数を明示的に注入
    'process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
  },
})

if (!buildResult.success) {
  console.error('Build failed:')
  buildResult.logs.forEach((log) => console.error(log))
  process.exit(1)
}

console.log('Build successful!')

// ビルド後のJSファイル名を取得
const builtJsFile = buildResult.outputs.find((o) => o.path.endsWith('.js'))
if (!builtJsFile) {
  console.error('No JS output found in build')
  process.exit(1)
}

const jsFileName = builtJsFile.path.split('/').pop()
console.log('Built JS file:', jsFileName)

// HTMLを動的に生成（ビルド後のJSを参照）
const htmlContent = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Stripe Payment Demo</title>
    <link rel="stylesheet" href="./src/styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/dist/${jsFileName}"></script>
  </body>
</html>`

Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url)

    // ルートパスでHTMLを返す
    if (url.pathname === '/') {
      return new Response(htmlContent, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // ビルド後のJSファイルを配信
    if (url.pathname.startsWith('/dist/')) {
      const filePath = `.${url.pathname}`
      const file = Bun.file(filePath)
      if (await file.exists()) {
        return new Response(file)
      }
    }

    // CSSファイルを配信
    if (url.pathname.startsWith('/src/styles.css')) {
      const file = Bun.file('./src/styles.css')
      if (await file.exists()) {
        return new Response(file, {
          headers: { 'Content-Type': 'text/css' },
        })
      }
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log('Frontend server running at http://localhost:3001')
