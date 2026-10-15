The operating system is the first to know when a new TCP connection arrives, not Node.js.

And your second intuition is also correct: if no connection arrives and there is no other work to execute, Node.js's main JavaScript thread can sleep (block) inside the event loop's poll phase.

This is one of the most important concepts behind Node.js's non-blocking I/O architecture.

Let's walk through exactly what happens.

## 1. What happens when you start the TCP server?

Consider your code:

```
const net = require("node:net");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    console.log("Received:", data.toString());
  });
});

server.listen(3000);
```

When `server.listen(3000)` executes:

1. Node.js asks the OS to create a TCP socket, bind it to port 3000, and start listening.
2. Through libuv, Node.js registers the listening socket with the OS's I/O readiness mechanism, such as `epoll` on Linux or `kqueue` on macOS.
3. The operating system's networking stack manages incoming TCP connections.
4. Node.js returns control to the event loop.

At this point, the OS is responsible for detecting incoming connection activity.

Node.js does not continuously check the listening socket in a JavaScript loop.

## 2. What happens if no connection arrives?

Imagine your TCP server is running, but nobody connects to it.

Conceptually:

Here is the important part:

The event loop eventually reaches its I/O polling operation. libuv calls an OS function that can block the main thread until an I/O event becomes ready or another wake-up condition occurs.

For example, on Linux, this is conceptually:

```
epoll_wait(epoll_fd, events, max_events, timeout);
```

If no socket activity occurs and no timer or other work requires attention, the thread can remain blocked.

During this time:

- No JavaScript is executing on the main thread.
- The OS continues handling network activity.
- The main thread isn't consuming CPU by repeatedly checking for connections.
- The Node.js process remains alive because the listening server is an active handle.

This is exactly why Node.js can efficiently manage thousands of mostly idle TCP connections.

## 3. What happens when a connection finally arrives?

Suppose a client connects after 30 seconds.

More precisely:

1. The OS processes the incoming TCP connection and makes it available for acceptance.
2. The listening socket becomes readable, indicating that a connection can be accepted.
3. The OS polling call returns with a readiness event.
4. libuv handles that event and accepts the connection through the appropriate OS API.
5. Node.js creates a JavaScript `Socket` object and invokes your `createServer` connection callback.
6. Your callback registers the `socket.on("data", ...)` listener.
7. When data later arrives, the OS again reports socket readiness, and Node.js eventually executes your `data` callback.

A small but important correction to your wording: the event loop doesn't start when a connection arrives. It was already running, but was blocked waiting for events. The incoming connection makes the polling operation return, allowing the event loop to continue.

Also, the OS doesn't directly invoke your JavaScript callback. libuv and Node.js handle the readiness event and invoke the registered callback.

This is consistent with the [Node.js event loop documentation](https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick) and [libuv networking documentation](https://docs.libuv.org/en/v1.x/guide/networking.html).

## 4. But isn't blocking the event loop contradictory to non-blocking I/O?

No. This is the subtle distinction worth understanding.

Blocking on the OS polling mechanism is different from blocking on an individual socket operation.

In the first case, the thread efficiently waits for any registered I/O event. In the second case, a blocking `read()` on one socket could prevent the thread from handling other sockets.

With libuv, one polling operation can watch thousands of sockets and return when any of them is ready.

So, conceptually:

```
while (serverIsActive) {
    // Execute pending work

    // Sleep efficiently until I/O is ready
    events = pollOSForReadyIO();

    // Dispatch callbacks associated with ready events
    processEvents(events);
}
```

This is simplified pseudocode, not the actual Node.js event loop implementation.

The thread can sleep when there is no work, wake when work becomes available, execute JavaScript callbacks, and then return to waiting. Timers and other scheduled work can also cause the loop to continue without a network event.

## 5. The key takeaway for your Node.js Design Patterns notes

The Node.js event loop uses an OS-provided I/O multiplexing mechanism to monitor multiple sockets efficiently. When there are no ready events or callbacks to execute, the main thread can block inside the poll phase without wasting CPU cycles.

When an I/O event occurs, the OS polling operation returns, libuv processes the event, and Node.js dispatches the corresponding JavaScript callback on the main thread.

This is why the event demultiplexer is described as synchronous, even though Node.js supports non-blocking I/O: the call that waits for ready events is synchronous and may block the event-loop thread, while individual socket operations are configured to be non-blocking.

One final distinction: your server keeps the process alive even when completely idle, but if you call `server.close()` and there are no other active handles or requests, Node.js can exit instead of waiting indefinitely.
