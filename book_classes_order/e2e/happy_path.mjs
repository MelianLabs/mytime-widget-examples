// Happy path for book_classes_order/index.html against a MyTime API (a local stack in our runs).
//
//   PAGE_URL=http://localhost:8090/book_classes_order/index.html \
//   BASE_URL=http://localhost:3000 COMPANY_ID=754 LOCATION_ID=1557 \
//   DEMO_EMAIL=dana.rivers@example.com DEMO_PASSWORD=... \
//   node book_classes_order/e2e/happy_path.mjs
//
// Optional: RECORD_DIR=<dir> records a video, SLOW_MO=<ms> slows every action, PLAYWRIGHT_PATH=<path to the
// playwright package> when it is not installed next to this file.
// Expects two children (Mia and Leo) who have not paid the registration fee yet, a members-only "Hiking Camp"
// class, a weekly "Nature Explorers" series, and a SUMMER20 promo code.
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const env = (name, fallback) => process.env[name] || fallback;
const PAGE_URL = env('PAGE_URL', 'http://localhost:8090/book_classes_order/index.html');
const BASE_URL = env('BASE_URL', 'http://localhost:3000');
const COMPANY_ID = env('COMPANY_ID', '754');
const LOCATION_ID = env('LOCATION_ID', '1557');
const EMAIL = env('DEMO_EMAIL', 'dana.rivers@example.com');
const PASSWORD = env('DEMO_PASSWORD', '');
const RECORD_DIR = env('RECORD_DIR', '');
const SLOW_MO = Number(env('SLOW_MO', '0'));
const PROMO = env('PROMO_CODE', 'SUMMER20');
// What to book. Each pick is the start of an option label on the page; the series option reads "<class> – all N sessions".
const CHILD_A = env('CHILD_A', 'Mia');
const CHILD_B = env('CHILD_B', 'Leo');
const PICKS_A = env('PICKS_A', 'Hiking Camp|Nature Explorers – all').split('|');
const PICKS_B = env('PICKS_B', 'Hiking Camp').split('|');
const FEE_NAME = env('FEE_NAME', 'Registration Fee');
const EXPECT_SIBLING = env('EXPECT_SIBLING', '1') === '1';
const picked = [...PICKS_A, ...PICKS_B].map((text) => text.replace(/ – all$/, ''));

const playwrightPath = process.env.PLAYWRIGHT_PATH;
const { chromium, selectors } = await import(playwrightPath ? pathToFileURL(`${playwrightPath}/index.mjs`).href : 'playwright');
selectors.setTestIdAttribute('data-test');

const viewport = { width: 1280, height: 860 };
const browser = await chromium.launch({ headless: true, slowMo: SLOW_MO });
const context = await browser.newContext({
  viewport,
  ...(RECORD_DIR ? { recordVideo: { dir: RECORD_DIR, size: viewport } } : {}),
});
const page = await context.newPage();
page.on('pageerror', (err) => console.error('page error:', err.message));
const pause = (ms) => (SLOW_MO ? page.waitForTimeout(ms) : Promise.resolve());

let ticketId;
try {
  const query = new URLSearchParams({ base_url: BASE_URL, company_id: COMPANY_ID, location_id: LOCATION_ID, email: EMAIL, password: PASSWORD, fee_name: FEE_NAME });
  await page.goto(`${PAGE_URL}?${query}`);
  await page.getByTestId('sign-in').waitFor();
  await pause(800);
  await page.getByTestId('sign-in').click();

  // By default, Mia: Hiking Camp + the whole Nature Explorers series; Leo: Hiking Camp.
  const pick = async (childName, picks) => {
    const child = page.getByTestId(`child-${childName}`);
    await child.waitFor({ timeout: 30000 });
    for (const text of picks) await child.locator('label', { hasText: text }).first().locator('input').check();
  };
  await pick(CHILD_A, PICKS_A);
  await pause(800);
  await pick(CHILD_B, PICKS_B);
  await page.getByTestId(`fee-${CHILD_A}`).waitFor();
  await page.getByTestId(`fee-${CHILD_B}`).waitFor();
  await pause(1200);

  await page.getByTestId('create-order').click();
  await page.getByTestId('order-items').waitFor({ timeout: 30000 });
  const lines = await page.getByTestId('order-items').locator('tr').allInnerTexts();
  assert.ok(lines.filter((l) => picked.some((name) => l.includes(name))).length >= picked.length, 'a line for every class picked');
  assert.ok(lines.filter((l) => l.includes(FEE_NAME)).length === 2, 'a registration fee per child');
  const discountBefore = await page.getByTestId('discount').innerText();
  if (EXPECT_SIBLING) assert.notEqual(discountBefore, '-$0.00', 'the sibling discount is applied when the order is priced');
  await pause(1500);

  await page.getByTestId('promo').fill(PROMO);
  await pause(500);
  await page.getByTestId('apply-promo').click();
  await page.locator(`text=incl. ${PROMO}`).waitFor({ timeout: 30000 });
  await page.waitForFunction((before) => document.querySelector('[data-test="discount"]').innerText !== before,
    discountBefore, { timeout: 10000 });
  await pause(1500);

  // Add a Stripe test card through Stripe Elements.
  const stripeFrame = page.frameLocator('[data-test="card-element"] iframe').first();
  await stripeFrame.locator('input[name="cardnumber"]').waitFor({ timeout: 30000 });
  await stripeFrame.locator('input[name="cardnumber"]').pressSequentially('4242424242424242', { delay: SLOW_MO ? 40 : 0 });
  await stripeFrame.locator('input[name="exp-date"]').pressSequentially('1230');
  await stripeFrame.locator('input[name="cvc"]').pressSequentially('123');
  await pause(500);
  await page.getByTestId('save-card').click();
  // The client may already have a saved 4242 card, so wait for the save itself to finish.
  await page.getByTestId('save-card').filter({ hasText: 'Save card' }).waitFor({ timeout: 60000 });
  assert.equal(await page.getByTestId('card-error').count(), 0, 'the card was saved');
  await page.getByTestId('card-4242').waitFor({ timeout: 60000 });
  await page.getByTestId('card-4242').check();
  await pause(1000);

  const balance = await page.getByTestId('balance').innerText();
  await page.getByTestId('pay').click();
  await page.getByTestId('confirmation').waitFor({ timeout: 90000 });
  assert.equal(await page.getByTestId('ticket-status').innerText(), 'closed');
  assert.equal(await page.getByTestId('paid-amount').innerText(), balance, 'one payment of the balance');
  ticketId = (await page.getByTestId('ticket-id').innerText()).replace('#', '');
  await pause(4000);
  console.log(`paid ${balance} on ticket ${ticketId}`);
} catch (err) {
  await page.screenshot({ path: 'book_classes_order_failure.png', fullPage: true });
  console.error('failed; screenshot in book_classes_order_failure.png');
  throw err;
} finally {
  await context.close();
  await browser.close();
}

// Server-side check through the public API: one closed ticket, every class line enrolled, a fee membership per child.
const json = async (path, init = {}) => {
  const response = await fetch(`${BASE_URL}/api/mkp/v1${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers || {}) },
  });
  assert.ok(response.ok, `${path} → ${response.status}`);
  return response.json();
};
const { user } = await json('/sessions', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD, company_id: Number(COMPANY_ID) }) });
const auth = { headers: { Authorization: user.authentication_token } };
const { order } = await json(`/orders/${ticketId}`, auth);
assert.equal(order.status, 'closed');
assert.equal(Number(order.balance_due), 0);
// At close every class line becomes an ordinary class enrollment on the same ticket.
const enrollments = order.items.filter((item) => item.type === 'session_enrollment');
assert.ok(enrollments.length >= picked.length, 'class enrollments on the one ticket');
assert.equal(order.items.filter((item) => item.type === 'class_reservation').length, 0, 'no class line left unbooked');
const { client_memberships: memberships } = await json(`/user/client_memberships?company_id=${COMPANY_ID}`, auth);
const fees = memberships.filter((m) => m.name === FEE_NAME && m.status === 'active');
assert.ok(fees.length >= 2, 'a registration fee membership for each child');
console.log(`ok: ticket ${ticketId} closed, ${enrollments.length} class lines enrolled, ${fees.length} registration fees active`);
