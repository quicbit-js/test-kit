var test = require('tape')
var tkit = require('..')

test('test error', function (t) {
    t.throws(function () { tkit('bad_pkg') },             /could not load bad_pkg/)
    t.throws(function () { tkit('./test/dummy_module') }, /dummy_module is not a function/)
    t.end()
})