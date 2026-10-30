// Afterpay path for book_classes_order/index.html against a MyTime API with Afterpay on (Stripe test mode).
//
//   PAGE_URL=http://localhost:8090/book_classes_order/index.html \
//   BASE_URL=https://sandbox.mytime.com COMPANY_ID=758 LOCATION_ID=1561 FEE_NAME="one time fee" \
//   DEMO_EMAIL=... DEMO_PASSWORD=... CHILD="Noah Park" PICKS="Thanksgiving" \
//   AFTERPAY_OUTCOME=authorize node book_classes_order/e2e/afterpay_path.mjs
//
// AFTERPAY_OUTCOME=authorize approves on Stripe's Afterpay test page and expects one closed ticket paid with Afterpay;
// AFTERPAY_OUTCOME=fail declines there and expects the order still open, nothing charged, and the card option still
// there. SAVE_CARD=1 saves a Stripe test card first (needed when the order holds a membership and the business
// requires a card on file for memberships); MEMBERSHIPS_NEED_CARD=0 when the business does not.
// RECORD_DIR and SLOW_MO as in happy_path.mjs.
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const env = (name, fallback) => process.env[name] || fallback;
const PAGE_URL = env('PAGE_URL', 'http://localhost:8090/book_classes_order/index.html');
const BASE_URL = env('BASE_URL', 'https://sandbox.mytime.com');
const COMPANY_ID = env('COMPANY_ID', '758');
const LOCATION_ID = env('LOCATION_ID', '1561');
const EMAIL = env('DEMO_EMAIL', '');
const PASSWORD = env('DEMO_PASSWORD', '');
const FEE_NAME = env('FEE_NAME', 'Registration Fee');
const CHILD = env('CHILD', 'Mia');
const PICKS = env('PICKS', 'Hiking Camp').split('|');
const OUTCOME = env('AFTERPAY_OUTCOME', 'authorize');
const SAVE_CARD = env('SAVE_CARD', '0') === '1';
const MEMBERSHIPS_NEED_CARD = env('MEMBERSHIPS_NEED_CARD', '1');
const RECORD_DIR = env('RECORD_DIR', '');
const SLOW_MO = Number(env('SLOW_MO', '0'));
const SHOTS_DIR = env('SHOTS_DIR', '');

const playwrightPath = process.env.PLAYWRIGHT_PATH;
const { chromium, selectors } = await import(playwrightPath ? pathToFileURL(`${playwrightPath}/index.mjs`).href : 'playwright');
selectors.setTestIdAttribute('data-test');

const viewport = { width: 1280, height: 860 };
const browser = await chromium.launch({ headless: true, slowMo: SLOW_MO });
const context = await browser.newContext({ viewport, ...(RECORD_DIR ? { recordVideo: { dir: RECORD_DIR, size: viewport } } : {}) });
const page = await context.newPage();
page.on('pageerror', (err) => console.error('page error:', err.message));
const pause = (ms) => (SLOW_MO ? page.waitForTimeout(ms) : Promise.resolve());
const shot = (name) => (SHOTS_DIR ? page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: true }) : Promise.resolve());

let orderId;
let balance;
try {
  const query = new URLSearchParams({ base_url: BASE_URL, company_id: COMPANY_ID, location_id: LOCATION_ID, email: EMAIL, password: PASSWORD, fee_name: FEE_NAME, memberships_need_card: MEMBERSHIPS_NEED_CARD });
  await page.goto(`${PAGE_URL}?${query}`);
  await page.getByTestId('sign-in').click();
  const child = page.getByTestId(`child-${CHILD}`);
  await child.waitFor({ timeout: 30000 });
  for (const text of PICKS) await child.locator('label', { hasText: text }).first().locator('input').check();
  await pause(1500);
  await page.getByTestId('create-order').click();
  await page.getByTestId('order-items').waitFor({ timeout: 30000 });
  orderId = (await page.locator('h2', { hasText: 'Your order #' }).innerText()).replace(/.*#/, '').trim();
  balance = await page.getByTestId('balance').innerText();
  await pause(1500);

  if (SAVE_CARD) {
    const stripeFrame = page.frameLocator('[data-test="card-element"] iframe').first();
    await stripeFrame.locator('input[name="cardnumber"]').waitFor({ timeout: 30000 });
    await stripeFrame.locator('input[name="cardnumber"]').pressSequentially('4242424242424242');
    await stripeFrame.locator('input[name="exp-date"]').pressSequentially('1230');
    await stripeFrame.locator('input[name="cvc"]').pressSequentially('123');
    await page.getByTestId('save-card').click();
    await page.getByTestId('card-4242').waitFor({ timeout: 60000 });
  }

  // Shown only when the payment session for this balance offers Afterpay.
  const afterpay = page.getByTestId('afterpay');
  await afterpay.waitFor({ timeout: 30000 });
  await afterpay.scrollIntoViewIfNeeded();
  await pause(1000);
  const type = async (testId, text) => page.getByTestId(testId).pressSequentially(text, { delay: SLOW_MO ? 30 : 0 });
  await type('afterpay-line1', '123 Trail Rd');
  await type('afterpay-city', 'Los Angeles');
  await type('afterpay-state', 'CA');
  await type('afterpay-zip', '90041');
  await pause(800);
  await shot('1_order_afterpay_option');
  await page.getByTestId('pay-afterpay').click();

  // Stripe's Afterpay test page (in live mode this is Afterpay's own approval page).
  await page.waitForURL(/payments\.stripe\.com/, { timeout: 60000 });
  await page.getByText(OUTCOME === 'fail' ? 'FAIL TEST PAYMENT' : 'AUTHORIZE TEST PAYMENT').waitFor({ timeout: 30000 });
  await pause(2500);
  await shot('2_afterpay_test_page');
  await page.getByText(OUTCOME === 'fail' ? 'FAIL TEST PAYMENT' : 'AUTHORIZE TEST PAYMENT').click();

  await page.waitForURL((url) => url.toString().startsWith(PAGE_URL), { timeout: 60000 });
  if (OUTCOME === 'fail') {
    await page.getByTestId('afterpay-note').waitFor({ timeout: 60000 });
    await page.getByTestId('pay').waitFor();
    await shot('3_afterpay_declined');
  } else {
    await page.getByTestId('confirmation').waitFor({ timeout: 90000 });
    assert.equal(await page.getByTestId('ticket-status').innerText(), 'closed');
    assert.equal(await page.getByTestId('paid-amount').innerText(), balance, 'one payment of the balance');
    await page.getByTestId('afterpay-paid').waitFor();
    await shot('3_afterpay_paid');
  }
  await pause(4000);
} catch (err) {
  await page.screenshot({ path: 'book_classes_order_afterpay_failure.png', fullPage: true });
  console.error('failed; screenshot in book_classes_order_afterpay_failure.png');
  throw err;
} finally {
  await context.close();
  await browser.close();
}

const json = async (path, init = {}) => {
  const response = await fetch(`${BASE_URL}/api/mkp/v1${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers || {}) },
  });
  assert.ok(response.ok, `${path} → ${response.status}`);
  return response.json();
};
const { user } = await json('/sessions', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD, company_id: Number(COMPANY_ID) }) });
const { order } = await json(`/orders/${orderId}`, { headers: { Authorization: user.authentication_token } });
if (OUTCOME === 'fail') {
  assert.equal(order.status, 'open', 'a declined Afterpay leaves the order open');
  assert.equal(`$${Number(order.balance_due).toFixed(2)}`, balance, 'nothing was charged');
  console.log(`ok: Afterpay declined, order ${orderId} still open with ${balance} due`);
} else {
  assert.equal(order.status, 'closed');
  assert.equal(Number(order.balance_due), 0);
  assert.equal(order.items.filter((item) => item.type === 'class_reservation').length, 0, 'no class line left unbooked');
  console.log(`ok: order ${orderId} paid ${balance} with Afterpay and closed`);
}
