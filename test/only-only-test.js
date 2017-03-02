function err(msg) { throw Error(msg) }
module.exports = function(test) {
    try {
        test('test-only: function (1/5) should not run', (t) => {
            t.fail('should not have run')
        })
        test('test-only: function (2/5) should not run', (t) => {
            t.fail('should not have run')
        })
        test.only('test-only: function (3/5) can run', (t) => {
            t.plan(1)
            t.ok('should not have run')
        })
        test('test-only: function (4/5) should not run', (t) => {
            t.fail('should not have run')
        })
        test.only('test-only: function (5/5) should not run', (t) => {
            t.fail('should not have run')
        })
    } catch(e) {
        // throw an error for this failed test because we can't
        // run any tests here (tests erroring out by calling only twice)
        /there can only be one only test/.test(e.toString()) || err('did not get expected output: ' + e )
    }
}

