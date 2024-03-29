module.exports = function(test) {

    test.java('test-java: this function should run', (t) => {
        let tbl = t.table([
            ['a', 'b',      'opt',              'exp'],
            [[], [1],       null,               [1]],
            [[1], [2, 3],   {},                 [1, 2, 3]],
            '# test reverse arguments',
            [[1], [2, 3],   {reverse: true},    [2, 3, 1]],
            [[1, 2], [],    {},                 [1, 2]],
        ])
        var hector = t.hector()
        t.table_assert(
            tbl,
            function () {
                t.same(arguments.length, 3)
                var a = arguments[0]
                var b = arguments[1]
                var opt = arguments[2] || {}
                return (opt.reverse) ? b.concat(a) : a.concat(b)
            },
            {print_out: hector}
        )
        var out_lines = t.lines(hector.args.join('\n'))
        var exp_lines = t.lines(
            `
            PRINT TABLE:
            a(
                a( "a",       "b",       "opt",                "exp" ),
                a( a(),       a( 1 ),    null,                 a( 1 ) ),
                a( a( 1 ),    a( 2, 3 ), o(),                  a( 1, 2, 3 ) ),
                "# test reverse arguments",
                a( a( 1 ),    a( 2, 3 ), o( \"reverse\", true ), a( 2, 3, 1 ) ),
                a( a( 1, 2 ), a(),       o(),                  a( 1, 2 ) )
            );
            `
        )
        t.same(out_lines, exp_lines)


        hector = t.hector()
        t.table_assert([
            [ 's',             'v',   'expect' ],
            [ '',             '10',          0 ],
            [ '10',           '10',          1 ],
            [ '101',          '10',          1 ],
            [ '1010',         '10',          2 ],
            [ '0100101001',    '0',          6 ],
            [ '0100101001',    '1',          4 ],
            [ '0100101001',   '10',          3 ],
            [ '0100101001',  '100',          2 ],
            [ '0100101001', '1000',          0 ],
        ], t.count, { assert: 'none', print_out: hector } )

        out_lines = t.lines(hector.args.join('\n'))
        exp_lines = t.lines(
            `
            PRINT TABLE:
            a(
                a( "s",          "v",    "expect" ),
                a( "",           "10",   0 ),
                a( "10",         "10",   1 ),
                a( "101",        "10",   1 ),
                a( "1010",       "10",   2 ),
                a( "0100101001", "0",    6 ),
                a( "0100101001", "1",    4 ),
                a( "0100101001", "10",   3 ),
                a( "0100101001", "100",  2 ),
                a( "0100101001", "1000", 0 )
            );
            `
        )
        t.same(out_lines, exp_lines)


        t.end()
    })


    test('test-print: this function also should not run', (t) => {
        t.plan(1)
        t.fail('should not have run')
    })
}

