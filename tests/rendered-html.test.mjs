import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the historic city law database", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /城保法研/);
  assert.match(html, /让每一个结论/);
  assert.doesNotMatch(html, /让每一个编码结论/);
  assert.match(html, /法规目录/);
});

test("ships every extracted article to a structured full-text viewer", async () => {
  const [client, page, raw] = await Promise.all([
    readFile(new URL("../app/database-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/laws.raw.json", import.meta.url), "utf8"),
  ]);
  const laws = JSON.parse(raw).laws;
  const articleCount = laws.reduce((sum, law) => sum + law.articles.length, 0);

  assert.equal(laws.length, 59);
  assert.equal(articleCount, 2547);
  assert.ok(laws.every((law) => law.articles.length > 0));
  assert.match(page, /structureArticles\(law\.text, law\.articles\)/);
  assert.match(client, /法规全文/);
  assert.match(client, /chapter-index/);
  assert.match(client, /law-article/);
});
