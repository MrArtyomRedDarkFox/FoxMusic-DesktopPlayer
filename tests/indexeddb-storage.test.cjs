
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const app = fs.readFileSync(
  path.join(__dirname, '..', 'app.js'),
  'utf8'
);

const start = app.indexOf(
  '  async function storeRequest(mode, action) {'
);

const end = app.indexOf(
  '  function serializableTrack(track) {',
  start
);

assert.ok(start >= 0 && end > start, 'storeRequest should exist');

const implementation = app.slice(start, end).trim();

function createHarness() {
  const request = {};
  const store = {};

  const transaction = {
    objectStore(name) {
      assert.equal(name, 'tracks');
      return store;
    }
  };

  const database = {
    transaction(name, mode) {
      assert.equal(name, 'tracks');
      this.mode = mode;
      return transaction;
    }
  };

  const context = {
    STORE_NAME: 'tracks',
    openDB: async () => database
  };

  vm.runInNewContext(
    `${implementation}\nthis.storeRequest = storeRequest;`,
    context
  );

  return {
    storeRequest: context.storeRequest,
    request,
    transaction,
    store
  };
}

async function run() {
  // 1. Successful request must wait for transaction completion.
  {
    const h = createHarness();

    const pending = h.storeRequest(
      'readwrite',
      store => {
        assert.equal(store, h.store);
        return h.request;
      }
    );

    await new Promise(resolve => setImmediate(resolve));

    assert.equal(
      typeof h.request.onsuccess,
      'function',
      'request success handler should be registered'
    );

    let settled = false;

    const observed = pending.then(value => {
      settled = true;
      return value;
    });

    const savedRecord = { id: 'track-1' };

    h.request.result = savedRecord;
    h.request.onsuccess();

    await new Promise(resolve => setImmediate(resolve));

    assert.equal(
      settled,
      false,
      'storeRequest must wait for transaction.oncomplete'
    );

    h.transaction.oncomplete();

    assert.deepEqual(await observed, savedRecord);
  }

  // 2. Transaction abort must reject.
  {
    const h = createHarness();

    const pending = h.storeRequest(
      'readwrite',
      () => h.request
    );

    await new Promise(resolve => setImmediate(resolve));

    h.request.result = 'written';
    h.request.onsuccess();

    h.transaction.error = new Error(
      'simulated transaction abort'
    );

    h.transaction.onabort();

    await assert.rejects(
      pending,
      /simulated transaction abort/
    );
  }

  // 3. Request error must reject.
  {
    const h = createHarness();

    const pending = h.storeRequest(
      'readwrite',
      () => h.request
    );

    await new Promise(resolve => setImmediate(resolve));

    h.request.error = new Error(
      'simulated request failure'
    );

    h.request.onerror();

    await assert.rejects(
      pending,
      /simulated request failure/
    );
  }

  // 4. Synchronous action errors must be propagated.
  {
    const h = createHarness();

    const pending = h.storeRequest(
      'readwrite',
      () => {
        throw new Error(
          'simulated storage action failure'
        );
      }
    );

    await assert.rejects(
      pending,
      /simulated storage action failure/
    );
  }

  console.log(
    'PASS: IndexedDB transaction reliability tests'
  );
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
