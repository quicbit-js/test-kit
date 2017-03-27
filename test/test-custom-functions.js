'use strict'

let test = require('..')('tape', {
        // override count
        count: () => (a,v) => {
            for(var i=0,c=0; i<a.length; i++) { if(a[i] === v) c++ }
            return -c   // reversed
        },
        fooequal: (t) => (a,b)=> {
            return a + 'foo' === b
        },
    },
    { custom_only: true }   // include only custom functions, no default functions
)

test('test-custom: functions defined', (t) => {
    t.plan(5)
    t.ok(!t.sum)
    t.ok(!t.desc)
    t.ok(!t.table)
    t.ok(t.count)
    t.ok(t.fooequal)
})

test('test-custom: count() override', (t) => {
    t.plan(2)
    t.equal(t.count([1,0,1,1,1], 1), -4)
    t.equal(t.count([1,0,1,1,1], 0), -1)
})


test('test-custom: fooequal()', (t) => {
    t.plan(2)
    t.equal(t.fooequal('a', 'afoo'), true)
    t.equal(t.fooequal('a', 'a'), false)
})