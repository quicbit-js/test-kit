'use strict'

// these tests are run both with tape and tap

function test_defaults(test) {

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
        t.tableAssert([
            [ 's',             'v',   'expect' ],
            [ '',             '10',         0  ],
            [ '10',           '10',         1  ],
            [ '101',          '10',         1  ],
            [ '1010',         '10',         2  ],
            [ '0100101001',    '0',         6  ],
            [ '0100101001',    '1',         4  ],
            [ '0100101001',   '10',         3  ],
            [ '0100101001',  '100',         2  ],
            [ '0100101001', '1000',         0  ],
        ], t.count)
    })

    test(test.engine + ': desc', (t) => {
        t.tableAssert([
            [ 'label',        'input',   'output',    'exp'                 ],
            [ 'msg',          ['a'],     0,           "msg: ('a') -expect-> (0)" ],
            [ 'msg',          [1,2],     3,           "msg: (1,2) -expect-> (3)" ],
        ], t.desc)
    })

    test(test.engine + ': sum', (t) => {
        t.tableAssert([
            [ 'array',                'prop_or_function', 'expect'],
            [ [],                                   null,     0],
            [ [0, 1, 2],                            null,     3],
            [ [, 1, , 3],                           null,     4],
            [ [],                                  'foo',     0],
            [ [{}],                                'foo',     0],
            [ [{a: 1},{a: -2},{}],                   'a',    -1],
            [ [{a: 1, b: 3},{a: -2},{}],             'a',    -1],
            [ [],                        (v) => v.length,     0],
            [ [''],                      (v) => v.length,     0],
            [ ['abcd', 'ef', 'ghi'],     (v) => v.length,     9],

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
        t.tableAssert(tbl, (a, b) => a.concat(b))
        t.tableAssert(tbl, (a, b) => a.concat(b))
    })

    test(test.engine + ': tableAssert - plan per row', (t) => {
        let tbl = t.table([
            ['a',    'b',    'exp'],
            [[],     [1],    [1]],
            [[1],    [2, 3], [1, 2, 3]],
            [[1, 2], [],     [1, 2]],
        ])

        t.tableAssert(tbl, (a,b,exp) => {
            t.same(a.concat(b), exp)
            t.ok(exp)
        }, {assert: 'none', plan:2})    // 2 asserts per row
    })

    test(test.engine + ': tableAssert - plan none', (t) => {
        let tbl = t.table([
            ['a',    'b',    'exp'],
            [[],     [1],    [1]],
            [[1],    [2, 3], [1, 2, 3]],
            [[1, 2], [],     [1, 2]],
        ])
        t.tableAssert(tbl, (a, b) => a.concat(b), {plan:0})
        t.tableAssert(tbl, (a, b) => a.concat(b), {plan:0})
        t.same(4, 4)
        t.end()
    })

    test(test.engine + ': tableAssert - plan column', (t) => {
        let tbl = t.table([
            ['a',    'b',      'p',       'exp'      ],
            [[],     [1],       3,       [1]        ],
            [[1],    [2, 3],    2,       [1, 2, 3]  ],
            [[1, 2], [],        0,       [1, 2]     ],
        ])
        // test that column 'p' designates the plan total
        t.tableAssert(tbl, (a, b, p) => {for(let i=0; i<p; i++){t.ok(true)}} , {assert:'none', plan:'p'})
    })

    // Notice how this test can cover many inconvenient corner cases in one table.
    // I used tap test coverage to find cases and then add one-liners here to cover them.
    test(test.engine + ': tableAssert - assert throws', (t) => {
        let tbl = t.table([
            [ 'fn',           'input',                             'expect' ],
            [ 'count',        [4,     4],                          /type not handled/  ],
            [ 'count',        [new Uint8Array(2), false],          /type not handled/  ],
            [ 'count',        ['abc', 4],                          /should be a string/  ],
            [ 'count',        ['abc', ''],                         /zero-length string/  ],
            [ 'count',        [new Uint8Array(2), 'aa'],           /long strings not supported/  ],
            [ 'tableAssert',  [[['a'],[1]],,{plan:3}],             /plan has already been set/  ],  // tableAssert set default plan (1 per row)
            [ 'imatch',       ['a%b%c',/X/,{no_match: 'throw'}],   /does not match/    ],
        ])
        t.tableAssert(
            tbl,
            function(fn, input){ t[fn].apply(null, input) },
            {assert: 'throws'}
        )
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
        t.tableAssert([
            [ 'v',       'exp'       ],
            [ 1,         'number'    ],
            [ null,      'null'      ],
            [ undefined, 'undefined' ],
            [ [1, 2],    'array'     ],
            [ {a: 1},    'object'    ],
            [ new A(),   'object'    ],
            [ () => 1,  'function'   ],
        ], t.type)
    })

    test(test.engine + ': imatch', (t) => {
        t.tableAssert([
            [ 's',     're',      'opt',                     'exp'                  ],
            [ '',      /x/,       null,                      [],                    ],
            [ 'b',     /x/,       null,                      ['b'],                 ],
            [ 'b',     /b/,       null,                      [],                    ],
            [ 'abc',   /b/,       null,                      ['a', 'c'],            ],
            [ 'abb',   /b/,       null,                      ['a','b'],             ],
            [ 'abb',   /b$/,      null,                      ['ab'],                ],
            [ 'abb',   /..$/,      null,                     ['a'],                 ],
            [ 'abb',   /.*/,      null,                      [],                    ],
            [ 'abcbb', /b/,       null,                      ['a', 'cbb'],          ],
            [ 'bbb',   /b/g,      null,                      [],                    ],
            [ 'abcbb', /b/g,      null,                      ['a', 'c'],            ],
            [ 'a%b%c', /%/g,      null,                      ['a', 'b', 'c'],       ],
            [ 'abcbb', /b/g,      {return:'tuples'},         [[0,1], [2,1]],        ],
            [ 'a%b%c', /%/g,      {return:'tuples'},         [[0,1], [2,1], [4,1]], ],
            [ '',      /b/g,      {empties:'include'},       [''],                  ],
            [ 'b',     /b/g,      {empties:'include'},       ['', ''],              ],
            [ 'abb',   /.*/,      {empties:'include'},       ['', ''],              ],
            [ 'abcbb', /b/g,      {empties:'include'},       ['a', 'c', '', ''],    ],
            [ 'abcbb', /x/g,      {no_match:'null'},          null,                 ],
            [ 'abcbb', /b/g,      {empties:'include', return:'tuples'},  [ [0,1], [2,1], [4,0], [5,0] ], ],
        ], t.imatch)
    })

    test(test.engine + ': ireplace', (t) => {
        t.tableAssert([
            [ 's',       're',       'fn_or_string',   'opt',               'exp'                 ],
            [ 'b',       /b/,        'q',               null,                'b'                  ],
            [ '',        /x/,        'q',               null,                ''                   ],
            [ '',        /x/,        'q',              {no_match:'null'},    null                   ],
            [ 'b',       /x/,        'q',               null,                'q'                  ],
            [ 'abc',     /b/,        'q',               null,                'qbq'                ],
            [ 'a%b%c',   /%/,        'z',               null,                'z%z'                ],
            [ 'a%b%c',   /%/g,       'z',               null,                'z%z%z'              ],
            [ 'a%bb%ccc',   /%/g,   (ss,o,s)=> '{'+ss+o+s.length+'}',  null, '{a08}%{bb28}%{ccc58}'    ],
            [ 'a%F2b%D8%E6c',   /%../g, (s)=> '%'+s.charCodeAt(0).toString(16),  null, '%61%F2%62%D8%E6%63'    ],
        ], t.ireplace)
    })

    test(test.engine + ': utf8', (t) => {
        t.tableAssert([
            [ 'v',                   'exp'                                  ],
            [ 0x61,                  [0x61]                                 ],
            [ 'abc\uD801\uDC00',     [0x61,0x62,0x63,0xF0,0x90,0x90,0x80]   ],
            [ '在嚴寒的冬日裡',        [229,156,168,229,154,180,229,175,146,231,154,132,229,134,172,230,151,165,232,163,161] ],
        ], t.utf8)
    })

    test(test.engine + ': utf8_to_str', (t) => {
        t.tableAssert([
            [ 'a',                                    'v',                    ],
            [ [0x61],                                 'a',                     ],
            [ [0x61,0x62,0x63,0xF0,0x90,0x90,0x80],  'abc\uD801\uDC00',        ],
        ], t.utf8_to_str)
    })

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
            ['foo', 3, [ undefined, undefined, undefined, undefined, undefined ]],
        ])

        t.plan(tbl.length * 2)
        tbl.rows.forEach(r => {
            let hec = t.hector(names)
            args.forEach(a => hec.apply(hec, a))
            t.same(hec.arg(r.i),    r.exp, t.desc('hector', [r.names,    r.i], r.exp))
            t.same(hec.arg(r.name), r.exp, t.desc('hector', [r.names, r.name], r.exp))
        })
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
