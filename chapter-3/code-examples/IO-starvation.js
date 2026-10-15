import { readFile } from "node:fs";

readFile("data.txt", "utf8", (_err, data) => {
  console.log(`Data from file: ${data}`);
});

let scheduledNextTicks = 0;
function recursiveNextTick() {
  if (scheduledNextTicks++ >= 100) {
    return;
  }
  console.log("Keeping the event loop busy");
  process.nextTick(() => recursiveNextTick());
}
recursiveNextTick();
