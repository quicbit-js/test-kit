'use strict'

var test = require('..').tape()


// /Users/dad/.nvm/versions/node/v6.2.1/bin/node test.js /Users/dad/ghub/qb-utf8-to-str-tiny
// TAP version 13
// # utf8_to_str
// ok 1 : ([97]) -expect-> ('a')
// ok 2 : ([97,98,99,240,144,144,128]) -expect-> ('abc𐐀')
// not ok 3 : ([34,97,98,99,34,37]) -expect-> ('"zabc"%')
// ---
//     operator: deepEqual
//     expected: '"zabc"%'
//     actual:   '"abc"%'
//     at: tbl.rows.forEach (/Users/dad/ghub/qb-utf8-to-str-tiny/node_modules/test-kit/index.js:198:29)
// ...
// ok 4 : ([34,97,98,99,34,37,10]) -expect-> ('"abc"%\n')
//
// 1..4
// # tests 4
// # pass  3
// # fail  1



test('other-engine', function(t) {
    var log     // set to t.hector() instances to check output
    function my_tap_engine() {
        log('TAP version 0')
        var info = function(operator, actual, expect) {
            return {
                operator: operator,
                expected: expect,
                actual: actual
            }
        }
        var padr = function(s,l) { while(s.length<l) s += ' '; return s }
        var ret = function(name, cb) {
            var checkdone = function() {
                if(results.length === plan) {
                    mytest.end()
                }
            }
            var results = []
            var plan = 0
            var mytest = {
                equal: function(actual, expect, msg) {
                    results.push(actual == expect ? {
                        passed: true,
                        msg: msg || 'equal',
                    } : {
                        passed: false,
                        msg: msg || 'one of these things is not like the other',
                        info: info('equal', actual, expect)
                    })
                    checkdone()
                },
                is_lucky: function(actual, msg) {
                    results.push(actual === 7 ? {
                        passed: true,
                        msg: msg || 'lucky!'
                    } : {
                        passed: false,
                        msg: msg || ('not lucky'),
                        info: info('is_lucky', actual, 'a value with better luck')
                    })
                    checkdone()
                },
                ok: function(actual, msg) {
                    results.push(actual ? {
                        passed: true,
                        msg: msg || 'ok'
                    } : {
                        passed: false,
                        msg: msg || ('not ok'),
                        info: info('ok', actual, 'a truthy value')
                    })
                    checkdone()
                },
                plan: function(n) {
                    plan = n
                },
                end: function() {
                    var num_tests = results.length
                    if(results.length !== plan) {
                        results.push({
                            passed: false,
                            msg: 'planned test count',
                            info: info('plan', results.length, plan)
                        })
                    }
                    var failed = 0
                    results.forEach(function(r, i) {
                        if(r.passed) {
                            log('ok ' +  (i + 1) + ' : ' + r.msg)
                        } else {
                            failed++
                            var keys = Object.keys(r.info)
                            var maxlen = keys.reduce(function(m, k) { return k.length > m ? k.length : m }, 0)
                            log('not ok ' + (i + 1) + ' : ' + r.msg)
                            log('---')
                            Object.keys(r.info).forEach(function(k) {
                                log('    ' + padr(k + ': ', maxlen + 6) + r.info[k])
                            })
                            log('...')
                        }
                    })
                    log( '' )
                    log( '1..' + num_tests )
                    log( '# ' + num_tests + ' tests' )
                    log( '# pass ' + (num_tests - failed) )
                    log( '# fail ' + failed )
                }
            }
            log('# ' + name)
            cb(mytest)
        }
        ret.x = 'property x'  // test that properties are copied to the target engine
        return ret
    }

    log = t.hector()
    var my_test = require('..')(my_tap_engine(), {
            // override count
            count: () => (a,v) => {
                for(var i=0,c=0; i<a.length; i++) { if(a[i] === v) c++ }
                return -c   // reversed
            },
            fooequal: (myt) => (a,b)=> {
                return a + 'foo' === b
            },
        }
    )
    t.same(log.args, [
        [ 'TAP version 0' ]
    ])

    my_test('test-custom: functions defined', (myt) => {
        log = t.hector()
        myt.plan(5)
        myt.ok( myt.sum )
        myt.ok( myt.desc )
        myt.ok( myt.table )
        myt.ok( myt.count )
        myt.ok( myt.fooequal )
        t.same(log.arg(0), [
            'ok 1 : ok',
            'ok 2 : ok',
            'ok 3 : ok',
            'ok 4 : ok',
            'ok 5 : ok',
            '',
            '1..5',
            '# 5 tests',
            '# pass 5',
            '# fail 0' ]
        )
    })

    my_test( 'test-custom: count() override', (myt) => {
        log = myt.hector()  // no reason we can't our own test.hector() this time
        myt.plan(2)
        myt.equal(myt.count([1,0,1,1,1], 1), -4)
        myt.equal(myt.count([1,0,1,1,1], 0), -1)
        t.same(log.arg(0), [
            'ok 1 : equal', 'ok 2 : equal', '', '1..2', '# 2 tests', '# pass 2', '# fail 0'
        ])
    })


    my_test('test-custom: fooequal()', (myt) => {
        log = myt.hector()  // no reason we can't our own test.hector() this time
        myt.plan(2)
        myt.equal(myt.fooequal('a', 'afoo'), true)
        myt.equal(myt.fooequal('a', 'a'), false)
        t.same(log.arg(0), [
            'ok 1 : equal', 'ok 2 : equal', '', '1..2', '# 2 tests', '# pass 2', '# fail 0'
        ])
    })

    t.end()
})
