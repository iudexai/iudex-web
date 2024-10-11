// Sometimes we get a `Error [ReferenceError]: navigator is not defined`
// when running tests in Node.js environment. This is because the `navigator`
// object is only available in the browser. To fix this, we can use the
// following code to check if the `navigator` object is available before
// using it:

let cuid: () => string;

if (typeof window !== 'undefined' && window.navigator) {
  // Browser environment
  cuid = require('cuid');
} else {
  // Node.js environment
  cuid = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 5);
    return `${timestamp}-${randomPart}`;
  };
}

export default cuid;
