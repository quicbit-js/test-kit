'use strict'

let test = require('.').tape()   // or use require('.').tap

test('test-defaults: lines', (t) => {
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

    t.deepEqual(t.lines(lines), [
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

    t.deepEqual(t.lines(''), [])
    t.deepEqual(t.lines('hi') ['hi'])
    t.deepEqual(t.lines('\nhi') ['hi'])
    t.deepEqual(t.lines('hi\n') ['hi'])
    t.deepEqual(t.lines('\n\n'), [])
})

test('test-defaults: hector', (t) => {
    let args = [
        [null,      5,  'a'],
        [undefined, 7,  'b'],
        [{a:[2]},   9,  '' ],
        [],
        [{},        11, 'end' ],
    ]
    let names = ['a0', 'a1', 'a2']

    let tbl = t.table([
        [ 'name',  'i', 'exp'                                       ],
        [ 'a0',    0,   [null, undefined, {a:[2]}, undefined, {}]   ],
        [ 'a1',    1,   [5, 7, 9, undefined, 11]   ],
        [ 'a2',    2,   ['a', 'b', '', undefined, 'end']],
        [ 'foo',   3,   null ],
    ])

    t.plan(tbl.length * 2)
    tbl.rows.forEach(r => {
        let hec = t.hector(names)
        args.forEach(a => hec.apply(hec, a))
        t.deepEquals(hec.arg(r.i),    r.exp, t.desc('hector', [r.names, r.i], r.exp))
        t.deepEquals(hec.arg(r.name), r.exp, t.desc('hector', [r.names, r.name], r.exp))
    })
})

test('test-defaults: count', function(t) {
    let tbl = t.table([
        [ 's',           'v',      'exp' ],
        [ '',            'x',       0  ],
        [ ' ',           'x',       0  ],
        [ 'x',           'x',       1  ],
        [ 'axa',         'x',       1  ],
        [ 'xax',         'x',       2  ],
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

test('test-defaults: sum', (t) => {
    let tbl = t.table([
        [ 'a',                          'prop',             'exp' ],
        [ [],                            null,                  0  ],
        [ [0,1,2],                       null,                  3  ],
        [ [,1,,3],                       null,                  4  ],
        [ [],                            'foo',                 0  ],
        [ [{}],                          'foo',                 0  ],
        [ [{a:1}, {a:-2}, {}],           'a',                  -1  ],
        [ [{a:1, b:3}, {a:-2}, {}],      'a',                  -1  ],
        [ [],                            (v) => v.length,      0  ],
        [ [''],                          (v) => v.length,      0  ],
        [ ['abcd', 'ef', 'ghi'],         (v) => v.length,      9  ],

    ])

    t.plan(tbl.length)
    tbl.rows.forEach((r) => {
        t.equal(t.sum(r.a, r.prop), r.exp, t.desc('sum', [r.a, r.prop], r.exp))
    })
})

test('test-defaults: str', (t) => {
    let tbl = t.table([
        [ 'v',              'exp' ],
        [  1,               '1' ],
        [  null,            'null' ],
        [ [undefined],      '[null]'],
        [  [1,2],           '[1,2]'],
        [  {a:1,b:[null]},  "{'a':1,'b':[null]}" ],
        [  undefined,       'null' ],
    ])

    t.plan(tbl.length)
    tbl.rows.forEach((r) => {
        t.equal(t.str(r.v), r.exp, t.desc('str', [r.v], r.exp))
    })
})
