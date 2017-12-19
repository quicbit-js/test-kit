module.exports = function(test) {

  test('test-only1: this function should not run', (t) => {
    t.plan(1)
    t.fail('should not have run')
  })

  test.only1('test-only1: should test only first row', (t) => {
    var hec = t.hector()
    t.table_assert([
      [ 'n',       'exp' ],
      [ 3,           16 ],
      [ 4,           25 ],
      [ 5,           36 ],
    ], function (n) {
      hec(n)
      return (n + 1) * (n + 1)
    })

    if (hec.args.length !== 1 || hec.args[0].length !== 1 || hec.args[0][0] !== 3) {
      throw Error('expected only 1 row assertion')
    }
  })

  test('test-only1: this function also should not run', (t) => {
    t.plan(1)
    t.fail('should not have run')
  })
}

