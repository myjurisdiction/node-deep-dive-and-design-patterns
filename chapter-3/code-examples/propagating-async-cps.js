import { readFile } from "node:fs";

export function readJson(filename, callback) {
  readFile(filename, "utf8", (err, data) => {
    if (err) {
      // error reading the file
      // propagate the error and exit the current function
      return callback(err);
    }

    let parsed;
    try {
      // parse the file contents
      parsed = JSON.parse(data);
    } catch (err) {
      // catch parsing errors
      return callback(err);
    }

    // It is best practice to always check for the presence of an error, as not doing so will make it harder for you to debug your code and discover the possible points of failure. Another important convention to consider is that the error must always be an instance of the Error class. This means that simple strings or numbers should never be passed as error objects.

    // no errors, propagate just the data
    callback(null, parsed);
  });
}
