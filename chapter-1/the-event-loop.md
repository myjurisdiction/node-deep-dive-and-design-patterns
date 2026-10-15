# Node.js Event Loop — Summary Notes

## 1. What is the Event Loop?

- The event loop allows Node.js to perform non-blocking I/O operations despite JavaScript running on a single main thread by default.
- Node.js delegates I/O operations to the operating system whenever possible.
- When I/O becomes ready or an asynchronous operation completes, Node.js can execute the associated callback through the event loop.
- The event loop is implemented using libuv, a C library that provides event-loop and asynchronous I/O functionality.

Important: Non-blocking I/O does not mean the event loop never blocks. The event loop can efficiently block while waiting for I/O events, without blocking on an individual socket operation.

## 2. How the Event Loop Works

When Node.js starts:

1. Node.js initializes the event loop.
2. Executes the initial JavaScript code.
3. Registers asynchronous operations, timers, and callbacks.
4. Enters the event loop and begins processing events.
5. Executes callbacks when their respective event-loop phases are reached.
6. Continues running as long as there are active handles, requests, or other work keeping the process alive.

Each phase has its own FIFO callback queue.

- Callbacks are executed synchronously on the main JavaScript thread.
- The event loop processes callbacks until the queue is exhausted or an execution limit is reached.
- It then proceeds to the next phase.
- Long-running callbacks can delay subsequent callbacks, timers, and I/O processing.

## 3. Event Loop Phases

| Phase             | Responsibility                                                      |
| ----------------- | ------------------------------------------------------------------- |
| Timers            | Executes callbacks scheduled by `setTimeout()` and `setInterval()`  |
| Pending callbacks | Executes certain deferred I/O callbacks, such as some TCP errors    |
| Idle, prepare     | Internal libuv operations                                           |
| Poll              | Retrieves new I/O events and executes I/O-related callbacks         |
| Check             | Executes `setImmediate()` callbacks                                 |
| Close callbacks   | Executes certain close event handlers, such as `socket.on("close")` |

Node.js 20+ change: Starting with libuv 1.45.0, timers are processed after the poll phase rather than both before and after polling in each iteration. This can affect the ordering of timers and `setImmediate()`.

## 4. Poll Phase — Most Important

The poll phase has two primary responsibilities:

- Determine how long the event loop should wait for I/O activity.
- Retrieve and process ready I/O events.

### When the poll queue contains callbacks

- The event loop executes callbacks synchronously.
- Processing continues until the queue is empty or a system-dependent limit is reached.

### When the poll queue is empty

- If `setImmediate()` callbacks are pending, the event loop proceeds to the check phase.
- Otherwise, the event loop may block while waiting for I/O events.
- Pending timers can limit how long the event loop waits.
- Once an I/O event becomes ready, the polling operation returns, allowing the appropriate callbacks to execute.

Key concept: An idle Node.js server does not continuously consume CPU checking whether requests have arrived. The event loop can sleep efficiently inside the OS polling mechanism until work becomes available.

## 5. Timers Phase

`setTimeout()` and `setInterval()` specify the minimum delay before a callback becomes eligible for execution, not an exact execution time.

For example:

```
setTimeout(() => {
  console.log("Timer executed");
}, 100);
```

The callback is eligible after approximately 100 ms, but it could execute later.

Reasons for delays:

- The event loop is executing another callback.
- An I/O callback takes a long time to complete.
- The operating system delays scheduling the thread.

Important: A 100 ms timer does not guarantee execution exactly after 100 ms.

## 6. setImmediate() vs setTimeout()

`setImmediate()` schedules a callback in the check phase, after the poll phase.

`setTimeout()` schedules a callback after a minimum time threshold.

```
setTimeout(() => {
  console.log("timeout");
}, 0);

setImmediate(() => {
  console.log("immediate");
});
```

- When scheduled in the main module, their execution order is not guaranteed.
- When both are scheduled inside an I/O callback, `setImmediate()` executes first.

Example:

```
const fs = require("node:fs");

fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
```

Output:

```
immediate
timeout
```

## 7. process.nextTick()

`process.nextTick()` schedules a callback to execute after the current JavaScript operation finishes, but before the event loop proceeds.

- It is not technically an event-loop phase.
- Callbacks are stored in a separate `nextTickQueue`.
- It allows the current call stack to complete before executing the callback.
- It is useful for deferring callbacks while preserving expected execution order.

Example:

```
console.log("Start");

process.nextTick(() => {
  console.log("Next Tick");
});

console.log("End");
```

Output:

```
Start
End
Next Tick
```

### Why use process.nextTick()?

- To ensure an API invokes its callback asynchronously.
- To allow event listeners to be registered before emitting an event.
- To defer error handling or cleanup until the current JavaScript execution completes.
- To execute a callback before the event loop proceeds to another phase.

### Potential problem: I/O starvation

Recursively scheduling `process.nextTick()` callbacks can prevent the event loop from processing I/O events.

```
function repeat() {
  process.nextTick(repeat);
}

repeat();
```

This can starve I/O because Node.js keeps processing next-tick callbacks rather than returning to other event-loop work.

## 8. process.nextTick() vs setImmediate()

| Feature          | `process.nextTick()`                                    | `setImmediate()`                                  |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Execution        | After current operation, before the event loop proceeds | Check phase                                       |
| Event-loop phase | Not a separate phase                                    | Check                                             |
| Priority         | Runs sooner in the typical CommonJS callback context    | Runs in a later event-loop phase                  |
| Main use case    | Defer execution without advancing the loop              | Schedule work after polling                       |
| Risk             | Recursive scheduling can starve I/O                     | Generally allows other event-loop work to proceed |

The source generally recommends `setImmediate()` when its scheduling behavior is sufficient because it is easier to reason about.

## 9. Important Interview Concepts

- Why is Node.js considered single-threaded? JavaScript callbacks execute on the main thread by default, even though asynchronous operations may involve the OS or worker threads.
- Does the event loop block? Yes. It can block efficiently in the poll phase while waiting for I/O events.
- Can one callback block other requests? Yes. JavaScript callbacks execute synchronously, so CPU-intensive work can delay other callbacks.
- Does `setTimeout(fn, 0)` execute immediately? No. It schedules a callback subject to timer thresholds and event-loop scheduling.
- Why can `setImmediate()` execute before `setTimeout(fn, 0)`? They run under different scheduling mechanisms, and their ordering depends on context.
- Is `process.nextTick()` an event-loop phase? No. It uses a separate queue processed before Node.js continues with other event-loop work.
- What is I/O starvation? When continuously executing higher-priority or long-running callbacks prevents the event loop from processing pending I/O.

## Final Mental Model

The event loop is a continuously running scheduling mechanism that coordinates JavaScript callbacks with asynchronous operations.

- libuv manages the event loop and underlying I/O interactions.
- OS monitors socket readiness and handles applicable I/O operations.
- Poll phase processes ready I/O events and can sleep when no work is available.
- Timers phase runs timer callbacks after their minimum delay.
- Check phase executes `setImmediate()` callbacks.
- nextTickQueue executes callbacks before the event loop proceeds.
- JavaScript main thread executes callbacks one at a time.

The most important principle: Node.js achieves concurrency not by executing multiple JavaScript callbacks simultaneously on the main thread, but by allowing multiple asynchronous operations to progress while the event loop coordinates when their callbacks execute.

> If the Event Loop runs on the main thread, and my JavaScript application also runs on the main thread, how can both run? Wouldn't the Event Loop occupy that thread continuously?

The answer is that the Event Loop and your JavaScript application do not execute simultaneously on the main thread. They take turns using the same thread.

This is the fundamental idea you need to understand.

## 1. Where does the Event Loop run?

The Node.js Event Loop runs on the same main thread that executes your JavaScript application code.

However, the Event Loop is not another JavaScript function that runs continuously alongside your application.

Instead, it's a loop implemented primarily in native code (through Node.js and libuv) that controls when JavaScript callbacks execute.

Think of the relationship like this:

Only one of these activities is executing on that thread at a particular instant.

For example:

1. The main thread executes your JavaScript.
2. Once the initial JavaScript finishes, control returns to the Node.js runtime.
3. The Event Loop processes ready events and invokes a callback.
4. The main thread executes that JavaScript callback.
5. Once the callback returns, control goes back to the Event Loop.
6. The process repeats.

The Event Loop is the mechanism controlling the execution of callbacks. It doesn't compete with your JavaScript code for the same thread.

## 2. Let's walk through a real example

Consider:

```
const fs = require("node:fs");

console.log("1. Application started");

fs.readFile("data.txt", "utf8", (err, data) => {
  console.log("3. File read callback executed");
});

console.log("2. Application continues");
```

The output is:

```
1. Application started
2. Application continues
3. File read callback executed
```

Let's understand what happens on the main thread.

Stage A — Initial JavaScript execution

The main thread executes:

```
console.log("1. Application started");
```

Next:

```
fs.readFile("data.txt", callback);
```

Node.js initiates an asynchronous filesystem operation, normally using libuv's worker thread pool.

It doesn't synchronously wait for the file read to finish.

The main thread continues:

```
console.log("2. Application continues");
```

Stage B — Control returns to the Event Loop

When the initial JavaScript completes, the runtime can proceed with event-loop processing.

Meanwhile, a worker thread may be performing the filesystem operation.

Stage C — The filesystem operation completes

The worker thread reports its result to libuv, making the corresponding completion callback eligible for dispatch.

Stage D — The Event Loop invokes the callback

When the event loop reaches the appropriate point, Node.js invokes:

```
(err, data) => {
  console.log("3. File read callback executed");
}
```

The callback runs on the same main JavaScript thread.

When it returns, the runtime can continue processing other ready work.

Notice that the initial JavaScript execution, the Event Loop, and the callback execution are all coordinated sequentially on the main thread.

The actual filesystem operation may run on another thread.

## 3. One correction to your understanding

You said:

> Application code submits the request to the synchronous demultiplexer and returns immediately.

There's a subtle distinction here.

The application doesn't directly call the blocking demultiplexer to submit an operation.

Instead, the sequence is:

1. Your JavaScript calls an asynchronous Node.js API.
2. Node.js/libuv sets up the I/O operation and registers interest in relevant events.
3. That setup returns control to your JavaScript.
4. Later, when the event loop reaches its polling phase, it may call the synchronous OS demultiplexer and block waiting for events.
5. When an event becomes available, polling returns and the event loop can dispatch the relevant callback.

So, there are two different operations:

| Operation                                   | Blocking?   | Purpose                                  |
| ------------------------------------------- | ----------- | ---------------------------------------- |
| Register interest in socket readiness       | Normally no | Tell the OS which events matter          |
| Wait for I/O readiness (`epoll_wait`, etc.) | Can block   | Sleep until relevant I/O activity occurs |

And another small correction: Node.js doesn't have just one universal event queue. Its event loop has multiple phases with associated callback queues, along with microtask processing.&#x20;

## 4. What happens if I/O completes while JavaScript is executing?

Consider:

```
const fs = require("node:fs");

fs.readFile("data.txt", () => {
  console.log("File completed");
});

const start = Date.now();

while (Date.now() - start < 5000) {
  // Block the main thread for 5 seconds
}

console.log("Synchronous code completed");
```

Even if the filesystem operation completes after 10 milliseconds, its JavaScript callback cannot run while the `while` loop is executing.

The output will be:

```
Synchronous code completed
File completed
```

Why?

Because the main thread is occupied executing synchronous JavaScript. The event loop cannot dispatch another JavaScript callback until that execution yields control.

The underlying I/O can complete independently, but callback execution must wait.

## 5. Your understanding, corrected

Here's your explanation rewritten with the precise mechanics:

> My Node.js application executes its initial JavaScript on the main thread. Whenever it initiates asynchronous network I/O, Node.js/libuv registers the appropriate operation or readiness interest with the operating system, without waiting for the I/O to finish.
>
> The main thread continues executing JavaScript.
>
> Once the current JavaScript execution finishes, control returns to the Node.js runtime and its Event Loop. During its polling phase, the Event Loop may synchronously wait on the OS event demultiplexer for I/O readiness.
>
> When I/O events become available, libuv processes them, and Node.js dispatches the associated callbacks at the appropriate time.
>
> These callbacks execute on the same main thread as my application code. Once a callback finishes, control returns to the runtime, which continues processing other work.
>
> The Event Loop repeats this process for as long as the Node.js application has work that keeps it alive.

That's the mental model I'd recommend retaining.

## 6. Final summary

The Event Loop is not a separate thread. It is the scheduling and dispatch mechanism running on the main Node.js thread.

- When your JavaScript is executing, the main thread is occupied with that JavaScript.
- When your JavaScript yields or finishes, the runtime can continue event-loop processing.
- When no immediate work is available, the event loop can block efficiently inside the OS polling mechanism.
- When an I/O event becomes ready, the event loop can dispatch its callback.
- When that callback runs, it occupies the same JavaScript thread.
- The cycle continues until no work remains to keep the process alive.

One last distinction: The Event Loop does not run your initial JavaScript statement by statement. Node.js first executes the entry-point script, then continues processing asynchronous work through the event loop, although event-loop-related mechanisms are initialized beforehand.

Your understanding is very close. The missing piece was recognizing that the Event Loop and application callbacks are alternating activities on the same thread, not two independently running entities.

That's also why Node.js documentation emphasizes that developers must avoid blocking the event loop.
