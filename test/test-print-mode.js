// test a couple edge cases not availabe using print() (which uses only())

var test = require('..').tape()

test('test-print-mode', (t) => {
  t.tkprop()
  t.same(t.tkprop('print_mode'), undefined)
  t.tkprop('print_mode', false)
  t.same(t.tkprop('print_mode'), false)
  t.tkprop('print_mode', null)
  t.same(t.tkprop('print_mode'), undefined)
  t.tkprop('print_mode', true)
  t.same(t.tkprop('print_mode'), true)

  let tbl = t.table([
    ['a', 'b',      'opt', 'exp'],
    [[1], [2, 3],   {reverse: true},       [2, 3, 1]],
  ])
    var hector = t.hector()
    t.table_assert(
      tbl,
      function (a, b, opt) {
        return (opt && opt.reverse) ? b.concat(a) : a.concat(b)
      },
      {trunc: true}
      // no print_out option - allow console.log to execute
    )
})



