import { expect, test } from './fixtures.ts'

// Home-screen installs (phone, kiosk tablet) fetch these once and cache them, so a
// renamed file shows up as a blank icon long after the deploy. Check every reference.
test('serves every icon the page and the web manifest point to', async ({ page, request }) => {
  await page.goto('/')
  const hrefs = await page
    .locator('head link[rel="icon"], head link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((l) => l.getAttribute('href') ?? ''))
  expect(hrefs).toContain('/favicon.svg')
  expect(hrefs).toContain('/apple-touch-icon.png')

  const manifestHref = await page.locator('head link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(manifestHref ?? '')).json()
  expect(manifest.name).toBe('Maple Frontier')
  const manifestIcons: string[] = manifest.icons.map((i: { src: string }) => i.src)
  expect(manifestIcons.length).toBeGreaterThan(0)

  for (const href of [...hrefs, ...manifestIcons]) {
    const res = await request.get(href)
    expect(res.status(), href).toBe(200)
    expect(res.headers()['content-type'], href).toMatch(/^image\//)
  }
})
