import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page, request }) => {
  const testEmail = 'test@example.com'

  // 1. ログインページへ遷移
  await page.goto('/login')
  
  // 2. メールアドレスを入力してログインリンクを送信
  await page.getByPlaceholder('メールアドレス').fill(testEmail)
  await page.getByRole('button', { name: 'ログインリンクを送る' }).click()
  
  // 3. 送信完了メッセージが表示されるのを待つ
  await expect(page.getByText('メール送信完了')).toBeVisible()

  // 4. Mailpit APIからメッセージ一覧を取得して、詳細からマジックリンクを抽出する
  let magicLink: string | null = null
  for (let i = 0; i < 15; i++) {
    // メールの到着を待つために少し待機
    await page.waitForTimeout(500)
    const response = await request.get('http://127.0.0.1:54324/api/v1/messages')
    if (response.ok()) {
      const data = await response.json()
      interface MailpitMessage {
        ID: string
        To?: { Address: string }[]
      }
      const messages = (data.messages || []) as MailpitMessage[]
      // 最新のメールから、testEmail宛てのものを探す
      const foundMsg = messages.find(m =>
        m.To && m.To.some(to => to.Address === testEmail)
      )
      
      if (foundMsg) {
        // メッセージ詳細を取得
        const detailResponse = await request.get(`http://127.0.0.1:54324/api/v1/message/${foundMsg.ID}`)
        if (detailResponse.ok()) {
          const detail = await detailResponse.json()
          const body = detail.Text || ''
          // URLを抽出 (httpかhttpsで始まる、空白や括弧以外の文字列)
          const match = body.match(/https?:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^\s)"]+/)
          if (match) {
            magicLink = match[0]
            break
          }
        }
      }
    }
  }

  expect(magicLink).not.toBeNull()

  // 5. 抽出したマジックリンクにアクセスしてログインを完了させる
  await page.goto(magicLink!)
  
  // 6. マイページにリダイレクトされ、ログイン状態が確立されたことを確認
  await expect(page).toHaveURL(/\/me$/)

  // 7. セッション状態を保存
  await page.context().storageState({ path: authFile })
})
