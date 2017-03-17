'use strict'

// collects test argument and executes them later (on timeout) according to whether 'only'
// was called or not.
function TestRunner (test_fn, enrich_fns) {
  this.args = []
  this.only_called = false
  this.running = false
  this.test_fn = test_fn
  this.enrich_fns = assign({}, enrich_fns)
}

TestRunner.prototype = {
  constructor: TestRunner,
  run: function () {
    var self = this
    setTimeout(function () {
      self.running = true
      self.args.forEach(function (a) {
        self.test_fn.apply(null, enrich_test_arguments(a, self.enrich_fns))
      })
    })
  },
  addTest: function (args, only) {
    if (this.running) {
      throw Error('cannot add test - already running')
    }
    if (only) {
      if (this.only_called) {
        throw Error('there can only be one only test')
      }
      this.only_called = true
      this.args = [args]
    } else {
      if (!this.only_called) {
        this.args.push(args)
      }
    }
  }
}

// given the arguments to tap.test(...), alter the first function to return an enriched 't' object as in:
//
//      test('mytest', function(t) {...} )
//
function enrich_test_arguments (args, enrich_fns) {
  args = Array.prototype.slice.call(args)
  var fi = args.findIndex(function (a) { return typeof (a) === 'function' })
  args[fi] = enrich_t(args[fi], enrich_fns)
  return args
}

// enrich the test or 't' object by applying transforms in enrich_fns
// 'fn' is the user function that we will call with the new enriched 't':  fn(t)
function enrich_t (fn, enrich_fns) {
  return function (torig) {
    var tnew = Object.create(torig)
    var funcnames = Object.keys(enrich_fns)
    funcnames.forEach(function (n) { tnew[n] = enrich_fns[n](torig, tnew) })
    fn(tnew)
  }
}

// Return a string loosely based on JSON.stringify, but with single quotes and fewer escapes.
// (less precise, more readable)
//
//    instead of:
//
//    ok 1 - error: ("d--","/","a/b") -expect-> ("expect: parent \"a\" is not a directory")
//
//    ok 1 - error: ('d--','/','a/b') -expect-> ('expect: parent "a" is not a directory')
//
// str() converts undefined to null and doesn't handle cycles, so has room for improvement.
function str (v) {
  if (v === undefined) return 'null'
  return JSON.stringify(v).replace(/([^\\])"/g, "$1'").replace(/\\"/g, '"')
}

function parens (args) {
  var ret = str(args)
  return '(' + ret.substr(1, ret.length - 2) + ')'
}

// function escape_re(s) {
//     s = s.replace(/[-[\]{}()+?.,\\^$|#]/g, '\\$&')  // escape everything except '*'
//     return s.replace(/[*]/g, '.*')
// }

// Easy capture of formatted text into string-array.
//
// Given a string, return an array of strings trimming start and end blank lines but preserving
// interim blank lines and relative space-indentation.  (using first space-indented line as the minimum indent).
// t.lines(`
//
//      some text
//
//      that is formatted
//         with some indentation
//      on some lines
//
// `)
//
// ... gives:
// [
//      'some text',
//      '',
//      'that is formatted',
//      '   with some indentation',
//      'on some lines',
// ]
//
function text_lines (s) {
  var lines = s.split('\n')

  for (var beg = 0; beg < lines.length && /^\s*$/.test(lines[beg]); beg++);
  for (var end = lines.length - 1; end >= 0 && /^\s*$/.test(lines[end]); end--);
  if (beg > end) { return [] }
  var ind = countws(lines[beg])
  for (var i = beg; i <= end; i++) {
    var line = lines[i]
    var ws = countws(line, ind)
    lines[i] = ws === line.length ? '' : line.substring(Math.min(ws, ind))
  }
  return lines.slice(beg, end + 1)
}

function countws (s) {
  for (var c = 0; c < s.length && s[c] === ' '; c++);
  return c
}

function sum (a, prop_or_func) {
  if (prop_or_func == null) {
    return a.reduce(function (s, v) { return s + (v || 0) }, 0)
  } else if (typeof prop_or_func === 'function') {
    return a.reduce(function (s, v) { return s + prop_or_func(v) }, 0)
  } else {
    return a.reduce(function (s, v) { return s + (v[prop_or_func] || 0) }, 0)
  }
}

function table (data) {
  return require('test-table').create(data)
}

// 'dataOrTable' can be a 2D array with a header row or a Table object
//
//
// fn is the assertion function applied to each row
//
// opt settings control how the assertion function is applied and how tests are planned
//    {
//        assert:  'same',      // (default) all columns but the last are inputs to fn, and the last column
//                              //    will be asserted using t.same().  IOW, for each row, assert.same(fn(first-n-values), last-value)
//                 'throws',    // all columns but the last are inputs to fn, and the last column is
//                              //    a string or regular expression that should match an expected error
//                              //    using t.throws( function() { {fn(first-n-values)}, last-value)
//                 'none',      // Execute fn(all-column-values), without asserting fn output (fn should do asserts itself)
//                 anything else.... works like same but using whatever assert function is applied to assert the last column value.
//
//        plan: n-or-string  // Set t.plan() prior to running table tests, iff plan() was not
//                           // already called.  That is, t.plan(3) prior to tableAssert(tbl, fn) will simply plan(3), but
//                           // tableAssert(tbl, fn) will do plan(tbl.length), the default setting.
//                           //
//                           // (integer) (default is 1) plan this number of tests per row.  IOW, plan(tbl.length * n)
//                           // (string) if set to a column name, use that column as the expected plan count for each row (variable asserts)
//                           // If set to zero, then don't call plan during tableAssert().
//    }
function table_assert (torig, tnew) {
  return function (dataOrTable, fn, opt) {
    var tbl = tnew.table(dataOrTable)
    opt = assign({}, opt)
    if (opt.plan == null) {
      opt.plan = tnew.planned_tests ? 0 : 1
    } else {
      opt.plan === 0 || !tnew.planned_tests || err('plan has already been set: ' + tnew.planned_tests)
    }

    if (opt.plan) {      // non-zero
      var plan_total
      if (typeof opt.plan === 'string') {
        plan_total = tnew.sum(tbl.vals(opt.plan))
      } else {
        plan_total = tbl.length * opt.plan
      }
      tnew.plan(plan_total)   // sets planned_tests, which cannot be changed
    }

    var assert = opt.assert || 'same'
    tbl.rows.forEach(function (r) {
      var vals = r._vals
      var exp_val
      if (assert === 'none') {
        fn.apply(null, vals)
      } else if (assert === 'throws') {
        vals = vals.slice()
        exp_val = vals.pop()
        tnew.throws(function () { fn.apply(null, vals) }, exp_val, tnew.desc('', vals, exp_val.toString()))
      } else {
        vals = vals.slice()
        exp_val = vals.pop()
        tnew[assert](fn.apply(null, vals), exp_val, tnew.desc('', vals, exp_val))
      }
    })
  }
}

function err (msg) {
  throw Error(msg)
}

function type (v) {
  var ret = Object.prototype.toString.call(v)
  return ret.substring(8, ret.length - 1).toLowerCase()
}

function plan (torig, tnew) {
  return function (n) {
    tnew.planned_tests = n       // mark tests as planned (see tableAssert)
    return torig.plan(n)
  }
}

function countstr (s, v) {
  type(v) === 'string' || err('value should be a string: ' + type(v))
  v.length > 0 || err('cannot count zero-length string')

  var c = 0, i = 0
  if (v.length === 1) {
    var len = s.length
    for (i = 0; i < len; i++) { if (s[i] === v) c++ }
  } else {
    for (i = s.indexOf(v); i !== -1; i = s.indexOf(v, i + 1)) { c++ }
  }
  return c
}

function countbuf (b, v) {
  switch (type(v)) {
    case 'string':
      v.length === 1 || err('long strings not supported')
      v = v.charCodeAt(0)
      break
    case 'number':
      break
    default:
      throw Error('type not handled: ' + type(v))
  }
  var c = 0, len = b.length
  for (var i = 0; i < len; i++) { if (b[i] === v) c++ }
  return c
}

function count (s, v) {
  switch (type(s)) {
    case 'uint8array':
      return countbuf(s, v)
    case 'string':
      return countstr(s, v)
    case 'array':
      for (var i = 0, c = 0; i < s.length; i++) { if (s[i] === v) c++ }
      return c
    default:
      throw Error('type not handled: ' + type(s))
  }
}

// inverse match (see readme)
function imatch (s, re, opt) {
  opt = Object.assign({}, {empties: 'ignore', return: 'strings', no_match: 'string'}, opt)

  var prep_result = function (res) {
    if (opt.empties !== 'include') {
      res = res.filter(function (tpl) { return tpl[1] !== 0 })
    }
    return opt.return === 'tuples' ? res : res.map(function (tpl) { return s.substr(tpl[0], tpl[1]) })
  }

  var m = re.exec(s)

  if (!m) {
    switch (opt.no_match) {
      case 'null' : return null
      case 'string' : return prep_result([[0, s.length]])
      case 'throw' : // fall-through
      default : throw Error(re.toString() + ' does not match string ' + s)
    }
  }
  var ret = []
  var off = 0
  do {
    var len = m.index - off
    ret.push([off, len])
    off = m.index + m[0].length
  } while (re.lastIndex && (m = re.exec(s)) !== null)

  ret.push([off, s.length - off])
  return prep_result(ret)
}

// a simple and limited version of Object.assign for options - copies normal properties
function assign () {
  var dst = Object(arguments[0])
  for (var i = 1; i < arguments.length; i++) {
    var src = arguments[i]
    if (src != null) {
      Object.keys(src).forEach(function (k) { dst[k] = src[k] })
    }
  }
  return dst
}

function ireplace (s, re, fn_or_string, opt) {
  var fn = typeof fn_or_string === 'function' ? fn_or_string : function () { return fn_or_string }
  opt = assign({}, opt)
  opt.return = 'tuples'                 // other imatch options 'empty' and 'no_match' are client-controlled.
  var m = imatch(s, re, opt)
  if (m === null) {
    return null     // opt.empty was 'null'
  }
  var ret = []
  var off = 0
  m.forEach(function (tpl) {
    var toff = tpl[0], tlen = tpl[1]
    ret.push(s.substring(off, toff))              // matched portion   (added intact)
    ret.push(fn(s.substr(toff, tlen), toff, s))   // unmatched portion (transform)
    off = toff + tlen
  })
  ret.push(s.substring(off, s.length))        // remaining matched portion

  return ret.join('')
}

// Hector the Collector
// Collected bits of string...
// (http://belz.net/teaching/hector.html)
//
// Return a callback function that collects callback arguments in the 'args' array, provides access to
// columns of results with the arg(i) function.  also supports args('name') if names are provided.
function hector (names) {
  var args = []
  var max_num_args = 0
  var ret = function () {
    args.push(Array.prototype.slice.call(arguments))
    max_num_args = arguments.length > max_num_args ? arguments.length : max_num_args
  }
  ret.args = args                             // make args a simple/visible property
  ret.arg = function arg (which) {
    var i = which
    if (typeof i === 'string') {
      i = names ? names.indexOf(which) : -1   // no names will return array of undefined
    }
    return args.map(function (list) { return list[i] })
  }
  return ret
}

// return a one-line string describing expected input and output of the form:
//
//    lbl: [input_a, input_b..] -expect-> output
//
function desc (lbl, inp, out) {
  return lbl + ': ' + parens(inp) + ' -expect-> ' + parens([out])
}

// Creation functions are passed the original test object and the new test
// object so they may invoke new or prior-defined functions (delegate).

var DEFAULT_FUNCTIONS = {
  count: function () { return count },
  desc: function () { return desc },
  hector: function () { return hector },
  imatch: function () { return imatch },
  ireplace: function () { return ireplace },
  lines: function () { return text_lines },
  padl: function () { return function (s, l, c) { c = c || ' '; while (s.length < l) s = c + s; return s } },
  padr: function () { return function (s, l, c) { c = c || ' '; while (s.length < l) s = s + c; return s } },
  plan: function (torig, tnew) { return plan(torig, tnew) },
  str: function () { return str },
  sum: function () { return sum },
  table: function () { return table },
  tableAssert: function (torig, tnew) { return table_assert(torig, tnew) },    // backward-compatibility
  table_assert: function (torig, tnew) { return table_assert(torig, tnew) },
  type: function () { return type },
  utf8: function () { return require('qb-utf8-ez').buffer },
  utf8_to_str: function () { return require('qb-utf8-ez').string }
}

function testfn (name_or_fn, custom_fns, opt) {
  opt = opt || {custom_only: false}
  var enrich_fns = assign({}, opt.custom_only ? {} : DEFAULT_FUNCTIONS, custom_fns)
  var ret

  var test_orig = name_or_fn
  if (typeof name_or_fn === 'string') {
    test_orig = require(name_or_fn).test
  }
  if (test_orig.only) {
    ret = function () { return test_orig.apply(null, enrich_test_arguments(arguments, enrich_fns)) }
    ret.only = function () { return test_orig.only.apply(null, enrich_test_arguments(arguments, enrich_fns)) }
  } else {
    var runner = new TestRunner(test_orig, enrich_fns)
    ret = function () { runner.addTest(arguments, false) }
    ret.only = function () { runner.addTest(arguments, true) }
    runner.run()
  }
  ret.engine = test_orig.only && test_orig.onFinish ? 'tape' : 'tap'  // just a guess by what is likely
  Object.keys(test_orig).forEach(function (k) {
    if (!ret[k]) {
      var orig = test_orig[k]
      if (typeof orig === 'function') {
        ret[k] = function () { return orig.apply(test_orig, arguments) }  // call function with original context
      } else {
        ret[k] = orig
      }
    }
  })
    // ret.onFinish = test_orig.onFinish // only available in tape
  return ret
}

// property/function transforms applied to the test object passed into each test:
//
//      test( 'my test', function(t) {...} )   // applied to the 't' object
//
// return a simple description of a function test: inputs -> outputs
testfn.DEFAULT_FUNCTIONS = DEFAULT_FUNCTIONS

module.exports = testfn

// these convenience functions use dynamic 'require()' that allows test-kit to NOT depend on both tap and tape -
// so required dependencies are kept light.
module.exports.tap = function (custom_fns, opt) { return testfn('tap', custom_fns, opt) }
module.exports.tape = function (custom_fns, opt) { return testfn('tape', custom_fns, opt) }
