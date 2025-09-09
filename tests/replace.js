var fs = require('fs');
var someFile = './tests/fixtures/README.md';

fs.readFile(someFile, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  let replacement = `<!-- START_SECTION:codestats -->\nSuper stats ${new Date()}\n<!-- END_SECTION:codestats -->`;
  let result = data.replace(
    /((<!--.*START_SECTION:codestats.*-->)([\s\S]+)(<!--.*END_SECTION:codestats.*-->))/g,
    replacement
  );

  fs.writeFile(someFile, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});
