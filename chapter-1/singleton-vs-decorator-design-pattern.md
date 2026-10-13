The Singleton and Decorator patterns are two important design patterns in JavaScript, particularly for Node.js backend development and senior software engineering interviews.

They solve very different problems:

- Singleton: Ensures that only one instance of a particular object exists within a defined scope.
- Decorator: Adds new functionality to an existing object or function without modifying its original implementation.

Let's understand them with practical JavaScript examples, their use cases, advantages, disadvantages, and interview considerations.

# 1. Singleton Design Pattern

## What is Singleton?

The Singleton pattern is a creational design pattern that ensures a class has only one instance and provides a common way to access it.

Imagine you're building a Node.js backend with the following components:

- User Service
- Payment Service
- Order Service

All three need application configuration. Instead of creating separate configuration manager instances, you might want them to share a single instance.

## Implementation in JavaScript

Let's implement a singleton using an ES6 class.

```

class ConfigManager {
  static #instance = null;

  constructor() {
    if (ConfigManager.#instance) {
      return ConfigManager.#instance;
    }

    this.config = {
      apiUrl: "https://api.example.com",
      environment: "production",
    };

    ConfigManager.#instance = this;
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
  }
}

const config1 = new ConfigManager();
const config2 = new ConfigManager();

console.log(config1 === config2); // true

config1.set("environment", "development");

console.log(config2.get("environment"));
// development

```

### What's happening internally?

1. The first time `new ConfigManager()` executes, the constructor creates an instance and stores it in the static `#instance` field.
2. The second time `new ConfigManager()` executes, the constructor returns the already-created instance.
3. Both `config1` and `config2` reference the same object.
4. Any changes to the shared configuration are visible through both references.

Important: JavaScript constructors can explicitly return an object, which overrides the newly created `this`. Our implementation uses that behavior.

This is a basic illustration, not a completely airtight singleton: callers can manipulate the prototype or subclass it in ways that bypass the intended restriction.

## A more idiomatic approach in Node.js

In Node.js, you often don't need a Singleton class at all.

You can use the module system.

`config.js`

```

class ConfigManager {
  constructor() {
    this.config = {
      environment: "production",
    };
  }

  get(key) {
    return this.config[key];
  }
}

module.exports = new ConfigManager();

```

`userService.js`

```
const config = require("./config");

console.log(config.get("environment"));
```

`paymentService.js`

```
const config = require("./config");

console.log(config.get("environment"));
```

Both services receive the same exported object under normal CommonJS module-caching behavior.

Why? Node.js caches loaded CommonJS modules using their resolved filenames. Subsequent `require()` calls usually reuse the cached exports.

ES modules behave similarly:

```
// config.js
export const config = {
  environment: "production",
};
```

Every importer of the same resolved module shares that exported object.

However, module caching doesn't guarantee one instance across separate processes, worker threads, or all possible module-loading contexts.

## When should you use Singleton?

| Use case                  | Why it can help                             |
| ------------------------- | ------------------------------------------- |
| Application configuration | Shared access to configuration              |
| Logger                    | Consistent logging configuration            |
| Metrics collector         | Centralized in-process metrics              |
| Connection pool manager   | Avoid accidentally creating redundant pools |
| In-process cache          | Multiple services can share cached data     |

For example, with PostgreSQL, you may want one shared connection pool per Node.js process.

That does not mean one database connection. A pool manages multiple reusable connections.

### Advantages

- Controlled instantiation: Avoids unnecessary duplicate objects.
- Shared state: Different parts of an application can access the same state.
- Lazy initialization: The instance can be initialized only when needed.
- Consistency: Useful for centralized configuration or logging.

### Disadvantages

- Global mutable state: Changes made in one component can unexpectedly affect another.
- Testing difficulties: Tests may interfere with each other through shared state.
- Hidden dependencies: Components can access the singleton without clearly declaring what they depend on.
- Concurrency concerns: Shared mutable state may require synchronization, especially across threads.
- Scope limitations: A singleton in one Node.js process is not a singleton across multiple server instances.

A major interview point: Singleton does not mean distributed Singleton.

If you deploy your application across five Node.js processes, each process can have its own singleton instance.

For shared data across processes, you may need Redis, a database, or another external coordination mechanism.

# 2. Decorator Design Pattern

## What is Decorator?

The Decorator pattern is a structural design pattern that allows you to dynamically add responsibilities or behaviors to an existing object without modifying its underlying implementation.

The key idea is composition over inheritance.

Let's say you have an API function:

```
async function fetchUser(id) {
  return database.getUser(id);
}
```

You now want to add:

- Logging
- Caching
- Performance measurement
- Retry logic

You could modify `fetchUser()` directly and put everything inside it.

But that would mix several responsibilities into one function.

Instead, you can use decorators to wrap the original function with additional behavior.

## Implementation: Function Decorators in JavaScript

First, let's create a simple function.

```
function greet(name) {
  return `Hello, ${name}!`;
}
```

Now, a logging decorator:

```

function withLogging(fn) {
  return function (...args) {
    console.log("Function called with:", args);

    const result = fn.apply(this, args);

    console.log("Function returned:", result);

    return result;
  };
}

function greet(name) {
  return `Hello, ${name}!`;
}

const loggedGreet = withLogging(greet);

loggedGreet("Abhishek");

// Function called with: ["Abhishek"]
// Function returned: Hello, Abhishek!

```

Notice that we didn't modify the original `greet()` function.

Instead, `withLogging()` accepts an existing function and returns a new function that adds logging.

That is the core idea behind decorators.

## Understanding how multiple decorators work

Now let's implement three decorators.

```

function withLogging(fn) {
  return function (...args) {
    console.log("Starting function");

    const result = fn.apply(this, args);

    console.log("Finished function");

    return result;
  };
}

function withTiming(fn) {
  return function (...args) {
    const start = performance.now();

    try {
      return fn.apply(this, args);
    } finally {
      console.log(
        `Execution time: ${performance.now() - start}ms`
      );
    }
  };
}

function withValidation(fn) {
  return function (...args) {
    if (typeof args[0] !== "number") {
      throw new Error("Expected a number");
    }

    return fn.apply(this, args);
  };
}

function calculateSquare(number) {
  return number * number;
}

const enhancedFunction = withLogging(
  withTiming(
    withValidation(calculateSquare)
  )
);

console.log(enhancedFunction(5));
// Starting function
// Execution time: ...
// Finished function
// 25

```

Visually, the function has been wrapped in layers:

Execution flows inward through the wrappers and returns outward through them.

When you call `enhancedFunction(5)`, the order is:

1. Logging starts.
2. Timing starts.
3. Validation runs.
4. `calculateSquare(5)` executes.
5. Timing finishes.
6. Logging finishes.

This composition makes each behavior reusable and independent.

## Real-world example: Decorators in a Node.js API

Imagine you have an asynchronous function that fetches user data from PostgreSQL.

You want to implement caching without changing the database function.

```

function withCache(fn) {
  const cache = new Map();

  return async function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log("Cache HIT");
      return cache.get(key);
    }

    console.log("Cache MISS");

    const result = await fn.apply(this, args);

    cache.set(key, result);

    return result;
  };
}

async function fetchUser(id) {
  console.log("Querying database...");

  return {
    id,
    name: "John",
  };
}

const cachedFetchUser = withCache(fetchUser);

await cachedFetchUser(1);
// Cache MISS
// Querying database...

await cachedFetchUser(1);
// Cache HIT

```

The `fetchUser()` function knows nothing about caching.

The decorator manages caching independently.

In production, you'd also consider cache expiration, invalidation, bounded storage, concurrent request deduplication, and key generation.

## When should you use Decorator?

| Use case             | Why it fits                                   |
| -------------------- | --------------------------------------------- |
| Logging              | Add logs without modifying business logic     |
| Caching              | Add caching around expensive operations       |
| Authorization        | Check permissions before executing operations |
| Retry logic          | Retry operations after transient failures     |
| Performance tracking | Measure execution duration                    |
| Validation           | Validate inputs before calling a function     |

### Advantages

- Open/Closed Principle: Extend behavior without modifying existing implementations.
- Reusability: Apply the same decorator to different functions.
- Single Responsibility: Logging, caching, and validation remain separate.
- Composability: Combine decorators in different orders.
- Less inheritance: Avoid creating large class hierarchies just to add behavior.

### Disadvantages

- Debugging complexity: Multiple nested wrappers can make stack traces and execution flow harder to follow.
- Execution overhead: Each wrapper adds another function call and potentially extra work.
- Order dependency: `withCache(withLogging(fn))` can behave differently from `withLogging(withCache(fn))`.
- Async complexity: Wrappers must correctly manage promises, errors, and cleanup.
- Identity and metadata issues: Wrappers change function identity and may not preserve properties or metadata automatically.

For example, the synchronous `withTiming()` decorator above would only measure the time needed to create a promise for an asynchronous function, not the duration of the actual async operation.

To correctly measure asynchronous execution, you would use `await` within an async wrapper.

# 3. Decorator Pattern vs JavaScript Decorator Syntax

There's an important distinction for interviews.

The Decorator design pattern is a general concept. It doesn't depend on special language syntax.

JavaScript also has decorator syntax using `@`, supported in environments implementing modern decorators.

For example, conceptually:

```
class UserService {
  @logged
  getUser(id) {
    return { id };
  }
}
```

Here, `@logged` decorates a method.

However, you should distinguish the language feature from the design pattern. JavaScript decorator support also depends on the runtime, transpiler, and the decorator proposal/version being used.

Function wrappers are an excellent starting point because they work in ordinary JavaScript without any special decorator syntax.

# 4. Singleton vs Decorator: Key Differences

| Aspect           | Singleton                        | Decorator                           |
| ---------------- | -------------------------------- | ----------------------------------- |
| Pattern category | Creational                       | Structural                          |
| Main purpose     | Control instance creation        | Extend object behavior              |
| Core technique   | Reuse an instance                | Wrap an object or function          |
| Typical use      | Config, logger, connection pools | Logging, caching, validation, retry |
| State            | Often shared                     | Depends on the wrapper              |
| Composition      | Not the main objective           | Central feature                     |
| Main risk        | Hidden shared state              | Complexity from wrapper layers      |

## Interview perspective

For a senior JavaScript or Node.js interview, you should be able to explain not only how to implement these patterns but also their trade-offs.

Singleton: Be prepared to explain why Node.js module caching often removes the need for a manual singleton class, and why a singleton's scope is generally limited to a module-loading context within a process.

Decorator: Be prepared to implement `withLogging`, `withRetry`, or `withCache` using higher-order functions, especially for asynchronous code.

A particularly useful question is:

What's the difference between Decorator and Middleware?

Both can wrap functionality, but middleware generally operates as part of a request-processing pipeline, whereas the Decorator pattern extends the behavior of an individual object or operation. Middleware may itself use decorator-like composition.

# 5. Final Summary

Singleton — One shared instance

Use it when a resource should have one authoritative in-process instance, such as a configuration manager or a database connection pool.

Pros: Controlled instantiation, shared access, consistency.

Cons: Global state, testing difficulties, tight coupling.

Decorator — Add behavior through wrapping

Use it when you need reusable cross-cutting functionality, such as logging, caching, retry, authorization, or performance measurement.

Pros: Modularity, extensibility, composability.

Cons: Wrapper complexity, execution-order sensitivity, debugging overhead.

The easiest way to remember:

- Singleton: How many instances should exist?
- Decorator: How can I add functionality without changing the original implementation?

For your Node.js interview preparation, I would prioritize understanding Decorator deeply, including async function decorators, and knowing the limitations of Singleton in multi-process Node.js applications. Both are useful, but the decorator approach is especially common when designing reusable application infrastructure.
