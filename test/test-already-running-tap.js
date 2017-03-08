var test = require('tape')

var taptest = require('..')(function() {})

test('already-running', function (t) {
    t.throws(function() {
        taptest('outer', function () {
            taptest('inner', () => {})
        })
    }, '/cannot add .* already running/' )
    t.end()
})
