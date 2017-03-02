module.exports = function(test) {

    test('test-only: this function should not run', (t) => {
        t.plan(1)
        t.fail('should not have run')
    })

    test.only('test-only: this function should run', (t) => {
        t.plan(1)
        t.ok(1, 'only this test should run')
    })

    test('test-only: this function also should not run', (t) => {
        t.plan(1)
        t.fail('should not have run')
    })
}

