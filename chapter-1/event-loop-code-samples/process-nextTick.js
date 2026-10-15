{
  /**
   * The user defines someAsyncApiCall() to have an asynchronous signature, but it actually operates synchronously. When it is called, the callback provided to someAsyncApiCall() is called in the same phase of the event loop because someAsyncApiCall() doesn't actually do anything asynchronously. As a result, the callback tries to reference bar even though it may not have that variable in scope yet, because the script has not been able to run to completion.
   */
  let bar = null;

  // this has an asynchronous signature, but calls callback synchronously
  function someAsyncApiCall(callback) {
    callback();
  }

  // the callback is called before `someAsyncApiCall` completes.
  someAsyncApiCall(() => {
    // since someAsyncApiCall hasn't completed, bar hasn't been assigned any value
    console.log("bar", bar); // null
  });

  bar = 1;
}

{
  let bar = null;

  // this has an asynchronous signature, but calls callback synchronously
  function someAsyncApiCall(callback) {
    process.nextTick(callback);
  }

  // the callback is called before `someAsyncApiCall` completes.
  someAsyncApiCall(() => {
    console.log("bar", bar);
  });

  bar = 1;
}
