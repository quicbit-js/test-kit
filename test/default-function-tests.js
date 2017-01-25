'use strict'

// these tests are run both with tape and tap

function test_defaults(test) {
    test(test.engine + ': lines', (t) => {
        t.plan(6)
        let lines = `
        
        input
        
            with indentation
                and blank lines
                
            that will...
            
        be preserved
        in an array of strings.
        
        ...but with leading and trailing blank lines
        removed.
        
    `

        t.same(t.lines(lines), [
            'input',
            '',
            '    with indentation',
            '        and blank lines',
            '',
            '    that will...',
            '',
            'be preserved',
            'in an array of strings.',
            '',
            '...but with leading and trailing blank lines',
            'removed.'
        ])

        t.same(t.lines(''), [])
        t.same(t.lines('hi') ['hi'])
        t.same(t.lines('\nhi') ['hi'])
        t.same(t.lines('hi\n') ['hi'])
        t.same(t.lines('\n\n'), [])
    })

    test(test.engine + ': hector', (t) => {
        let args = [
            [null, 5, 'a'],
            [undefined, 7, 'b'],
            [{a: [2]}, 9, ''],
            [],
            [{}, 11, 'end'],
        ]
        let names = ['a0', 'a1', 'a2']

        let tbl = t.table([
            ['name', 'i', 'exp'],
            ['a0', 0, [null, undefined, {a: [2]}, undefined, {}]],
            ['a1', 1, [5, 7, 9, undefined, 11]],
            ['a2', 2, ['a', 'b', '', undefined, 'end']],
            ['foo', 3, null],
        ])

        t.plan(tbl.length * 2)
        tbl.rows.forEach(r => {
            let hec = t.hector(names)
            args.forEach(a => hec.apply(hec, a))
            t.sames(hec.arg(r.i), r.exp, t.desc('hector', [r.names, r.i], r.exp))
            t.sames(hec.arg(r.name), r.exp, t.desc('hector', [r.names, r.name], r.exp))
        })
    })

    test(test.engine + ': count len = 1', function (t) {
        let tbl = t.table([
            ['s', 'v', 'exp'],
            ['', 'x', 0],
            [' ', 'x', 0],
            ['x', 'x', 1],
            ['axa', 'x', 1],
            ['xax', 'x', 2],
        ])

        t.plan(tbl.length * 4)
        tbl.rows.forEach((r) => {
            t.equal(t.count(r.s, r.v), r.exp, t.desc('count str', [r.s, r.v], r.exp))
            t.equal(t.count(Buffer.from(r.s), r.v), r.exp, t.desc('count buf', [r.s, r.v], r.exp))
            let vcode = r.v.charCodeAt(0)
            t.equal(t.count(Buffer.from(r.s), vcode), r.exp, t.desc('count buf', [r.s, vcode], r.exp))
            t.equal(t.count(r.s.split(''), r.v), r.exp, t.desc('count arr', [r.s, r.v], r.exp))
        })
    })

    test(test.engine + ': count len > 1', function (t) {
        let tbl = t.tableAssert([
            ['s', 'v', 'exp'],
            ['', '10', 0],
            ['10', '10', 1],
            ['101', '10', 1],
            ['1010', '10', 2],
            ['0100101001', '10', 3],
        ], t.count)
    })

    test(test.engine + ': sum', (t) => {
        let tbl = t.tableAssert([
            ['a', 'prop', 'exp'],
            [[], null, 0],
            [[0, 1, 2], null, 3],
            [[, 1, , 3], null, 4],
            [[], 'foo', 0],
            [[{}], 'foo', 0],
            [[{a: 1}, {a: -2}, {}], 'a', -1],
            [[{a: 1, b: 3}, {a: -2}, {}], 'a', -1],
            [[], (v) => v.length, 0],
            [[''], (v) => v.length, 0],
            [['abcd', 'ef', 'ghi'], (v) => v.length, 9],

        ], t.sum)
    })

    test(test.engine + ': tableAssert - auto-plan', (t) => {
        let tbl = t.table([
            ['a', 'b', 'exp'],
            [[], [1], [1]],
            [[1], [2, 3], [1, 2, 3]],
            [[1, 2], [], [1, 2]],
        ])
        t.tableAssert(tbl, (a, b) => a.concat(b))
    })

    test(test.engine + ': tableAssert - pre-plan', (t) => {
        let tbl = t.table([
            ['a', 'b', 'exp'],
            [[], [1], [1]],
            [[1], [2, 3], [1, 2, 3]],
            [[1, 2], [], [1, 2]],
        ])
        t.plan(tbl.length * 2)
        t.tableAssert(tbl, (a, b) => a.concat(b), {plan:false})
        t.tableAssert(tbl, (a, b) => a.concat(b), {plan:false})
    })

    test(test.engine + ': tableAssert - end', (t) => {
        let tbl = t.table([
            ['a', 'b', 'exp'],
            [[], [1], [1]],
            [[1], [2, 3], [1, 2, 3]],
            [[1, 2], [], [1, 2]],
        ])
        t.tableAssert(tbl, (a, b) => a.concat(b), {plan:false})
        t.tableAssert(tbl, (a, b) => a.concat(b), {plan:false})
        t.end()
    })

    test(test.engine + ': str', (t) => {
        t.tableAssert([
            ['v', 'exp'],
            [1, '1'],
            [null, 'null'],
            [[undefined], '[null]'],
            [[1, 2], '[1,2]'],
            [{a: 1, b: [null]}, "{'a':1,'b':[null]}"],
            [undefined, 'null'],
        ], t.str)
    })

    test(test.engine + ': type', (t) => {
        class A {
            constructor() {this.x = 3}
        }
        let tbl = t.tableAssert([
            ['v', 'exp'],
            [1, 'number'],
            [null, 'null'],
            [undefined, 'undefined'],
            [[1, 2], 'array'],
            [{a: 1}, 'object'],
            [new A(), 'object'],
            [() => 1, 'function'],
        ], t.type)
    })

    if(typeof test.onFinish === 'function') {
        test.onFinish(() => {
            // there is no way to assert this using the test harness itself (test is finished)
            // so print to indicate done.
            console.log('# ' + test.engine + ' finished defaults')
        })
    }
}

module.exports.test_defaults = test_defaults
