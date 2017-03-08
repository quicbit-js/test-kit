var test = require('tape')

var testkit = require('..')
var taptest = testkit.tap()

test('already-running', function (t) {
    t.throws(function() {
        taptest('outer', function (tt) {
            taptest('inner', (tt) => {
            })
        })
    }, '/cannot add .* already running/' )
    t.end()
})
