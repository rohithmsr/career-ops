import assert from "node:assert/strict";
import { test } from "node:test";
import { createSerialQueue } from "../../src/lib/serial-queue.mjs";

function deferred() {
  /** @type {(value?: unknown) => void} */
  let resolve = () => {};
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("runs one task at a time and reports which one starts immediately", async () => {
  const queue = createSerialQueue();
  let active = 0;
  let max = 0;
  /** @type {string[]} */
  const order = [];
  const gates = [deferred(), deferred(), deferred()];
  const placed = gates.map((gate, index) =>
    queue.enqueue(async () => {
      order.push(`start ${index}`);
      active += 1;
      max = Math.max(max, active);
      await gate.promise;
      active -= 1;
      order.push(`end ${index}`);
    }),
  );

  assert.equal(placed[0].startNow, true);
  assert.equal(placed[1].startNow, false);
  assert.equal(placed[2].startNow, false);
  await flush();
  assert.deepEqual(order, ["start 0"]);

  gates[0].resolve();
  await flush();
  assert.deepEqual(order, ["start 0", "end 0", "start 1"]);
  gates[1].resolve();
  await flush();
  gates[2].resolve();
  await flush();

  assert.equal(max, 1);
  assert.deepEqual(order, ["start 0", "end 0", "start 1", "end 1", "start 2", "end 2"]);
});

test("onStart fires only for a task that waited", async () => {
  const queue = createSerialQueue();
  const gate = deferred();
  /** @type {number[]} */
  const started = [];
  queue.enqueue(async () => {
    await gate.promise;
  }, { onStart: () => started.push(0) });
  queue.enqueue(async () => {}, { onStart: () => started.push(1) });
  await flush();
  assert.deepEqual(started, []);
  gate.resolve();
  await flush();
  assert.deepEqual(started, [1]);
});

test("cancel drops a waiting task and the one after it still runs", async () => {
  const queue = createSerialQueue();
  const gate = deferred();
  /** @type {number[]} */
  const ran = [];
  queue.enqueue(async () => {
    await gate.promise;
  });
  const second = queue.enqueue(async () => {
    ran.push(2);
  });
  queue.enqueue(async () => {
    ran.push(3);
  });
  queue.cancel(second.token);
  gate.resolve();
  await flush();
  assert.deepEqual(ran, [3]);
});

test("a thrown task does not stall the queue", async () => {
  const queue = createSerialQueue();
  let second = false;
  queue.enqueue(() => {
    throw new Error("boom");
  });
  queue.enqueue(() => {
    second = true;
  });
  await flush();
  assert.equal(second, true);
});
