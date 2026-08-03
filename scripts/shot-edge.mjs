import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--headless=new'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000 })
page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 300)))
await page.goto('http://127.0.0.1:59683/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise(r => setTimeout(r, 3000))
await page.screenshot({ path: '/tmp/edge-open.png' })
const info = await page.evaluate(() => {
  const tab = document.querySelector('.edge-toggle')?.getBoundingClientRect()
  const status = document.querySelector('.status-info')?.textContent
  return { tab: tab ? { x: Math.round(tab.x), y: Math.round(tab.y), w: tab.width, h: tab.height } : null, status }
})
console.log('expanded:', JSON.stringify(info))
// zoom in to check % updates
await page.mouse.move(800, 500)
for (let i = 0; i < 5; i++) { await page.mouse.wheel({ deltaY: -240 }); await new Promise(r => setTimeout(r, 60)) }
await new Promise(r => setTimeout(r, 900))
console.log('after zoom:', await page.evaluate(() => document.querySelector('.status-info')?.textContent))
// collapse via the edge tab
await page.evaluate(() => document.querySelector('.edge-toggle')?.click())
await new Promise(r => setTimeout(r, 500))
await page.screenshot({ path: '/tmp/edge-collapsed.png' })
const info2 = await page.evaluate(() => {
  const tab = document.querySelector('.edge-toggle')?.getBoundingClientRect()
  return tab ? { x: Math.round(tab.x), y: Math.round(tab.y) } : null
})
console.log('collapsed tab pos:', JSON.stringify(info2))
await browser.close()
