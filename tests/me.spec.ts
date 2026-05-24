import { expect, test } from '@playwright/test'

test.describe('マイページ (ログイン状態)', () => {
  test('日本語：ログイン状態でマイページが表示できること', async ({ page }) => {
    await page.goto('/me')
    // 「マイページ」の見出しが表示されることを確認
    await expect(page.getByRole('heading', { name: 'マイページ' })).toBeVisible()
    // ユーザーギャラリーのタブや自分の投稿タブがあることを確認
    await expect(page.getByText('My Gallery')).toBeVisible()
    await expect(page.getByRole('link', { name: '自分の投稿' })).toBeVisible()
  })

  test('英語：ログイン状態でマイページが表示できること', async ({ page }) => {
    await page.goto('/en/me')
    // 「My page」の見出しが表示されることを確認
    await expect(page.getByRole('heading', { name: 'My page' })).toBeVisible()
    await expect(page.getByText('My Gallery')).toBeVisible()
    await expect(page.getByRole('link', { name: 'My posts' })).toBeVisible()
  })
})

test.describe('マイページ (未ログイン状態)', () => {
  // プロジェクトのグローバルなログイン状態を上書きして未ログインにする
  test.use({ storageState: { cookies: [], origins: [] } })

  test('日本語：未ログイン時にマイページへアクセスするとログイン画面にリダイレクトされること', async ({ page }) => {
    await page.goto('/me')
    // ログイン画面へリダイレクトされ、クエリに次の遷移先が含まれていることを確認
    await expect(page).toHaveURL(/\/login\?next=\/me$/)
  })

  test('英語：未ログイン時にマイページへアクセスすると英語ログイン画面にリダイレクトされること', async ({ page }) => {
    await page.goto('/en/me')
    // 英語ログイン画面へリダイレクトされることを確認
    await expect(page).toHaveURL(/\/en\/login\?next=\/en\/me$/)
  })
})
