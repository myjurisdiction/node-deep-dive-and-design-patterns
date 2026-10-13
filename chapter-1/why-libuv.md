libuv exists to provide Node.js with a consistent, cross-platform way to perform asynchronous, non-blocking I/O.

### Why was libuv needed?

1. Different operating systems use different I/O mechanisms:
   - Linux → `epoll`
   - macOS → `kqueue`
   - Windows → `IOCP`
     Instead of Node.js implementing different I/O handling logic for every operating system, libuv abstracts these differences behind a common API.
2. Not all I/O operations support non-blocking behavior:

   For example, regular filesystem operations cannot be monitored using `epoll` like network sockets.

   To solve this, libuv uses a worker thread pool for operations such as filesystem I/O, allowing the main JavaScript thread to remain non-blocking.

3. libuv implements the Event Loop:

   It provides the underlying infrastructure to:
   - Monitor I/O events using OS mechanisms.
   - Manage asynchronous operations and callbacks.
   - Execute the event loop.
   - Manage a worker thread pool for operations that cannot use event-driven I/O directly.

### How it fits into Node.js

```
       Your JavaScript Application
                  |
             Node.js APIs
                  |
                libuv
                  |
        +---------+---------+
        |                   |
  OS Event Mechanisms   Worker Thread Pool
  (epoll, kqueue, IOCP) (Filesystem, etc.)
        |                   |
        +---------+---------+
                  |
        I/O completion / readiness
                  |
        Event Loop dispatches callbacks
                  |
        JavaScript callbacks execute
             on main thread
```

### Interview-ready summary

libuv is the low-level, cross-platform asynchronous I/O engine of Node.js. It abstracts operating-system differences, implements the event loop, and provides a worker thread pool for operations that cannot be efficiently handled through OS event notification mechanisms.

Remember: Node.js provides the JavaScript APIs, while libuv provides much of the underlying machinery that makes asynchronous I/O work efficiently across operating systems.
