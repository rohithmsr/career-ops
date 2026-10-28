/**
 * One-at-a-time task queue. The next task starts only after the previous
 * task's promise settles, including a synchronous throw. cancel() drops a
 * task that has not started; a task already running is left to finish.
 */

export function createSerialQueue() {
  /** @type {{ token: object, run: () => Promise<void> | void, onStart?: () => void } | null} */
  let active = null;
  /** @type {{ token: object, run: () => Promise<void> | void, onStart?: () => void }[]} */
  const waiting = [];

  function pump() {
    if (active) return;
    const next = waiting.shift();
    if (!next) return;
    active = next;
    try {
      next.onStart?.();
    } catch {
      // A status update must not stall the rest of the queue.
    }
    const release = () => {
      if (active === next) active = null;
      pump();
    };
    Promise.resolve()
      .then(() => next.run())
      .then(release, release);
  }

  return {
    /**
     * @param {() => Promise<void> | void} run
     * @param {{ onStart?: () => void }} [hooks] onStart runs only when this task was waiting.
     * @returns {{ token: object, startNow: boolean }}
     */
    enqueue(run, hooks = {}) {
      const token = {};
      const startNow = active === null && waiting.length === 0;
      waiting.push({ token, run, onStart: startNow ? undefined : hooks.onStart });
      pump();
      return { token, startNow };
    },
    /** @param {object | undefined} token */
    cancel(token) {
      const index = waiting.findIndex((item) => item.token === token);
      if (index >= 0) waiting.splice(index, 1);
    },
  };
}
