import { expect, test, type Page } from '@playwright/test'

const publicRoutes = ['/', '/en', '/apps', '/en/apps', '/privacy', '/terms']

async function expectHealthyPage(page: Page, path: string) {
  const errors: string[] = []
  const failedResponses: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    errors.push(error.message)
  })
  page.on('response', (response) => {
    const url = new URL(response.url())
    const ignoredMissingAssets = [
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/_vercel/insights/script.js',
    ]

    if (
      url.origin === 'http://127.0.0.1:3000' &&
      response.status() >= 400 &&
      !ignoredMissingAssets.includes(url.pathname)
    ) {
      failedResponses.push(`${response.status()} ${url.pathname}`)
    }
  })

  const response = await page.goto(path, { waitUntil: 'networkidle' })
  expect(response?.status(), `${path} should return a successful HTTP status`).toBeLessThan(400)

  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('main')).not.toBeEmpty()

  const bodyText = await page.locator('body').innerText()
  expect(bodyText.trim().length, `${path} should render meaningful text`).toBeGreaterThan(20)
  expect(bodyText, `${path} should not show a framework/runtime error`).not.toMatch(
    /Application error|Unhandled Runtime Error|Build Error|Runtime Error|This page could not be found/i,
  )

  await expect.poll(() => errors, { message: `${path} should not emit browser errors` }).toEqual([])
  expect(failedResponses, `${path} should not have failed same-origin responses`).toEqual([])
}

test.describe('public pages smoke test', () => {
  for (const path of publicRoutes) {
    test(`${path} renders without browser errors`, async ({ page }) => {
      await expectHealthyPage(page, path)
    })
  }
})

test.describe('primary navigation smoke test', () => {
  test('English home navigates to popular apps', async ({ page }) => {
    await expectHealthyPage(page, '/en')

    await page.getByRole('link', { name: 'Popular apps' }).click()
    await expect(page).toHaveURL(/\/en\/apps$/)
    await expect(page.locator('main')).not.toBeEmpty()
  })

  test('Japanese home navigates to upload', async ({ page }) => {
    await expectHealthyPage(page, '/')

    await page.getByRole('link', { name: '投稿' }).click()
    await expect(page).toHaveURL(/\/upload$/)
    await expect(page.locator('main')).not.toBeEmpty()
  })
})
