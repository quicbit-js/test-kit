var test = require('..').tap()

test('already-running', function(t) {
    t.throws(function() {
        test('test-already-running', (t) => {
            t.fail('should not have run')
        })
    }, /already running/)
    t.end()
})

