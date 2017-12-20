module.exports = function(test) {

    test('test-print: this function should not run', (t) => {
        t.plan(1)
        t.fail('should not have run')
    })

    test.print('test-print: this function should run', (t) => {
        let tbl = t.table([
            ['a', 'b',      'opt', 'exp'],
            [[], [1],       null,     [1]],
            [[1], [2, 3],   {},       [1, 2, 3]],
            [[1], [2, 3],   {reverse: true},       [2, 3, 1]],
            [[1, 2], [],    {},        [1, 2]],
        ])
        var hector = t.hector()
        t.table_assert(
            tbl,
            function (a, b, opt) {
                return (opt && opt.reverse) ? b.concat(a) : a.concat(b)
            },
            {print_out: hector}
        )
        var out_lines = t.lines(hector.args.join('\n'))
        var exp_lines = t.lines(
            `
            PRINT TABLE:
            [ 'a',      'b',      'opt',             'exp' ],
            [ [],       [ 1 ],    null,              [ 1 ] ],
            [ [ 1 ],    [ 2, 3 ], {},                [ 1, 2, 3 ] ],
            [ [ 1 ],    [ 2, 3 ], { reverse: true }, [ 2, 3, 1 ] ],
            [ [ 1, 2 ], [],       {},                [ 1, 2 ] ],
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
            [ 's',          'v',    'expect' ],
            [ '',           '10',   0 ],
            [ '10',         '10',   1 ],
            [ '101',        '10',   1 ],
            [ '1010',       '10',   2 ],
            [ '0100101001', '0',    6 ],
            [ '0100101001', '1',    4 ],
            [ '0100101001', '10',   3 ],
            [ '0100101001', '100',  2 ],
            [ '0100101001', '1000', 0 ],
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

