# Node.js Design Patterns — Notes & Implementations

A collection of technical notes, JavaScript implementations, and practical experiments documenting my journey into Node.js internals, design patterns, asynchronous programming, and backend engineering.

This repository follows concepts explored in **Node.js Design Patterns** by Mario Casciaro and Luciano Mammino, with an emphasis on understanding how Node.js works under the hood and applying those concepts to real-world backend systems.

## Objectives

The goal is to move beyond simply using Node.js APIs and develop a deeper understanding of the architecture, mechanisms, and design principles behind scalable Node.js applications.

Key areas of focus include:

- **Node.js Internals:** Event loop, libuv, event demultiplexing, reactor pattern, and concurrency model.
- **Asynchronous Programming:** Callbacks, Promises, async/await, event emitters, and asynchronous control flow.
- **JavaScript Design Patterns:** Singleton, Factory, Decorator, Observer, and other commonly used patterns.
- **Streams and Backpressure:** Efficient data processing, buffering, and resource management.
- **Concurrency and Parallelism:** Worker threads, child processes, and managing concurrent workloads.
- **Backend Architecture:** Modularity, dependency management, scalability, and maintainable application design.
- **Practical Implementations:** Code examples and experiments that demonstrate concepts beyond theoretical explanations.

## Repository Structure

The repository will evolve as I progress through the book.

```text
nodejs-design-patterns/
├── README.md
├── 01-nodejs-platform/
│   ├── notes.md
│   └── examples/
├── 02-module-system/
│   ├── notes.md
│   └── examples/
├── 03-callbacks-and-events/
│   ├── notes.md
│   └── examples/
├── 04-asynchronous-control-flow/
│   ├── notes.md
│   └── examples/
├── design-patterns/
│   ├── singleton/
│   ├── decorator/
│   └── observer/
└── projects/
```

_This is a proposed structure and will be updated as new topics are covered._

## Learning Approach

For each topic, I aim to:

1. Understand the underlying problem and why the concept exists.
2. Explore how Node.js implements or supports the concept internally.
3. Implement simplified examples using JavaScript.
4. Analyze trade-offs, limitations, and real-world use cases.
5. Document key takeaways and insights relevant to backend system design.

## References

**Primary reference:** _Node.js Design Patterns_ — Mario Casciaro and Luciano Mammino.

Additional references include:

- [Official Node.js Documentation](https://nodejs.org/docs/latest/api/)
- [Node.js — The Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [libuv Documentation](https://docs.libuv.org/)

## Purpose

This repository serves as a personal knowledge base and a growing collection of practical Node.js examples.

The focus is not just on learning design patterns, but on understanding **why they exist, how they work internally, when to use them, and what trade-offs they introduce**.

---

_Learning through implementation, experimentation, and documentation._
