'use strict'

let test = require('.').tap()

test('test-tap: count', function(t) {
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

test('test-tap: sum', (t) => {
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
