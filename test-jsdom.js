const { JSDOM } = require('jsdom');
JSDOM.fromURL("http://localhost:3000", { runScripts: "dangerously", resources: "usable" }).then(dom => {
  dom.window.console.log = (...args) => console.log('JSDOM LOG:', ...args);
  dom.window.console.error = (...args) => console.log('JSDOM ERROR:', ...args);
  setTimeout(() => {
    console.log("BODY:", dom.window.document.body.innerHTML.substring(0, 500));
  }, 5000);
});
