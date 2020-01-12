var assign = require('qb-assign')
var jstr = require('qb-js-string')

// collects test argument and executes them later (on timeout) according to whether 'only'
// was called or not.
function TestRunner (test_fn, enrich_fns) {
  this.inputs = []          // array of { args: [...], tk_props: { ... } }
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
      self.inputs.forEach(function (input) {
        self.test_fn.apply(null, enrich_test_arguments(input.args, self.enrich_fns, input.tk_props))
      })
    })
  },
  addTest: function (args, tk_props) {
    if (this.running) {
      throw Error('cannot add test - already running')
    }
    var input = { args: args, tk_props: tk_props }
    if (tk_props.only) {
      if (this.only_called) {
        throw Error('there can only be one only test')
      }
      this.only_called = true
      this.inputs = [input]
    } else {
      if (!this.only_called) {
        this.inputs.push(input)
      }
    }
  }
}

// given the arguments to tap.test(...), alter the first function to return an enriched 't' object as in:
//
//      test('mytest', function(t) {...} )
//
// tk_props (optional) is added to the enriched function as '_tk_props' - for use by other functions (test modes)
//
function enrich_test_arguments (args, enrich_fns, tk_props) {
  args = Array.prototype.slice.call(args)
  var fi = args.findIndex(function (a) { return typeof (a) === 'function' })
  args[fi] = enrich_t(args[fi], enrich_fns, tk_props)
  return args
}

// enrich the test or 't' object by applying transforms in enrich_fns
// 'fn' is the user function that we will call with the new enriched 't':  fn(t)
function enrich_t (fn, enrich_fns, tk_props) {
  return function (torig) {
    var tnew = Object.create(torig)
    Object.keys(enrich_fns).forEach(function (n) { tnew[n] = enrich_fns[n](torig, tnew) })
    tnew.tk_props = tk_props
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
//    str() returns:
//
//    ok 1 - error: ('d--','/','a/b') -expect-> ('expect: parent "a" is not a directory')
//
// str() converts undefined to null and doesn't handle cycles, so has room for improvement.
function str (v) {
  if (v === undefined) return 'null'
  return JSON.stringify(v, replacer).replace(/([^\\])"/g, "$1'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

function replacer (ignore, v) {
  if(typeof v === 'function') {
    v = (v.name && v.name + ' ()') || 'function ()'
  }
  return v
}

function parens (args) {
  var ret = str(args)
  return '(' + ret.substr(1, ret.length - 2) + ')'
}

function last (a) { return a[a.length - 1] }
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

function padl (s, l, c) { c = c || ' '; while (s.length < l) s = c + s; return s }
function padr (s, l, c) { c = c || ' '; while (s.length < l) s = s + c; return s }

function trunc (a) {
  var i = a.length-1;
  while (a[i] == null && i >= 0)
    i--;
  return Array.prototype.slice.call(a, 0, i+1)
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

function table_assert (torig, tnew) {
  return function (dataOrTable, fn, opt) {
    fn && typeof fn === 'function' || err('invalid function argument: ' + fn)
    opt = assign({}, {assert: 'same'}, opt)

    var tbl = tnew.table(dataOrTable)
    var tp = tnew.tk_props

    if (tp.trows) {
      tbl = tbl.trows.apply(tbl, tp.trows)
    }
    if (tp.print_mode) {
      print_table(tnew, tbl, fn, opt, tp.print_mode)
    } else {
      assert_table(tnew, tbl, fn, opt)
    }
  }
}

function assert_table(tnew, tbl, fn, opt) {
  if (opt.plan == null) {
      opt.plan = (!tnew.planned_tests && opt.assert !== 'none') ? 1 : 0
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

  tbl.rows.forEach(function (r) {
    if (r._comments.length) {
      r._comments.forEach(function (c) {
        console.log(c)
      })
    }
    var vals = r._vals()
    var exp_val
    if (opt.assert === 'none') {
      if (opt.trunc) { vals = tnew.trunc(vals) }
      fn.apply(null, vals)
    } else {
      vals = vals.slice()
      exp_val = vals.pop()
      if (opt.trunc) { vals = tnew.trunc(vals) }
      if (opt.assert === 'throws') {
        tnew.throws(function () { fn.apply(null, vals) }, exp_val, tnew.desc('', vals, exp_val.toString()))
      } else {
        tnew[opt.assert](fn.apply(null, vals), exp_val, tnew.desc('', vals, exp_val))
      }
    }
  })
}

// same signature as table_assert, but pretty-print the table with results instead of running assertions
function print_table (tnew, tbl, fn, opt, print_mode) {
  var out = opt.print_out || console.log

  if (opt.assert === 'same' || opt.assert === 'equal') {
    var last_header = tbl.header[tbl.header.length - 1]
    // replace last column with results of output from first cols
    tbl.rows.forEach(function (row) {
      var vals = row._vals().slice()
      vals.pop()
      if (opt.trunc) { vals = tnew.trunc(vals) }
      row[last_header] = fn.apply(null, vals)
    })
  } // else just format all cols (we can add special assert handling as needed)

  var as_arrays = tbl.as_arrays({with_comments: true})
  out('PRINT TABLE:')
  out(jstr.table(as_arrays, {lang: print_mode}))

  if (!opt.print_out) {
    // if print out is set, then assume caller is doing the assertions.
    tnew.ok(1, 'print table finished')
    tnew.end()
  }
}

function err (msg) { throw Error(msg) }

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

function countstr (src, v) {
  type(v) === 'string' || err('value should be a string: ' + type(v))
  v.length > 0 || err('cannot count zero-length string')

  var c = 0, i = 0
  if (v.length === 1) {
    var len = src.length
    for (i = 0; i < len; i++) { if (src[i] === v) c++ }
  } else {
    for (i = src.indexOf(v); i !== -1; i = src.indexOf(v, i + 1)) { c++ }
  }
  return c
}

function countbuf (src, v) {
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
  v === (v & 0xFF) || err('value for uint8array should be a byte (0-255)')
  var c = 0, len = src.length
  for (var i = 0; i < len; i++) { if (src[i] === v) c++ }
  return c
}

function count (src, v) {
  switch (type(src)) {
    case 'uint8array':
      return countbuf(src, v)
    case 'string':
      return countstr(src, v)
    case 'array':
      for (var i = 0, c = 0; i < src.length; i++) { if (src[i] === v) c++ }
      return c
    default:
      throw Error('type not handled: ' + type(src))
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

function tkprop (torig, tnew) {
  return function () {
    var k = arguments[0]
    switch (arguments.length) {
      case 0: return
      case 1: return tnew.tk_props[k]
      default:
        var v = arguments[1]
        if (v == null) {
          delete tnew.tk_props[k]
        } else {
          tnew.tk_props[k] = v
        }
        return
    }
  }
}

// Heap's Algorithm for generating all permutations of array 'a'
function permut (a) { var p = []; _heaps(a.slice(), a.length, p); return p }
function swap(a, i, j) { var t = a[i]; a[i] = a[j]; a[j] = t }
function _heaps(a, n, p) {
  if (n === 1) {
    p.push(a.slice())
  } else {
    for (var i = 0; i < n; i++) {
      _heaps(a, n - 1, p)
      swap(a, n % 2 ? 0 : i, n - 1)
    }
  }
}

// Creation functions are passed the original test object and the new test
// object so they may invoke new or prior-defined functions (delegate).

var DEFAULT_FUNCTIONS = {
  count: function ()                   { return count },
  desc: function ()                    { return desc },
  hector: function ()                  { return hector },
  permut: function ()                  { return permut },
  imatch: function ()                  { return imatch },
  ireplace: function ()                { return ireplace },
  last: function ()                    { return last },
  lines: function ()                   { return text_lines },
  padl: function ()                    { return padl },
  padr: function ()                    { return padr },
  plan: function (torig, tnew)         { return plan(torig, tnew) },
  str: function ()                     { return str },
  sum: function ()                     { return sum },
  table: function ()                   { return table },
  tableAssert: function (torig, tnew)  { return table_assert(torig, tnew) },  // backward-compatibility
  table_assert: function (torig, tnew) { return table_assert(torig, tnew) },
  tkprop: function (torig, tnew)       { return tkprop(torig, tnew) },
  trunc: function ()                   { return trunc },
  type: function ()                    { return type },
  utf8: function ()                    { return require('qb-utf8-ez').buffer },
  utf8_to_str: function ()             { return require('qb-utf8-ez').string }
}

function testfn (name_or_fn, custom_fns, opt) {
  opt = opt || {}

  var test_orig = name_or_fn
  if (typeof name_or_fn === 'string') {
    try {
      test_orig = require(name_or_fn).test
    } catch(e) {
      var suggest = (typeof custom_fns === 'function') ? ' (It looks like the call to tape or tap was left out as in "require(\'test-kit\').tape()")' : ''
      err('could not load ' + name_or_fn + suggest + ': ' + e)
    }
  }
  typeof test_orig === 'function' || err(name_or_fn + ' is not a function')

  var enrich_fns = assign({}, opt.custom_only ? {} : DEFAULT_FUNCTIONS, custom_fns)
  var ret

  var runner = new TestRunner(test_orig, enrich_fns)
  ret = function () { runner.addTest(arguments, {}) }
  ret.only = function () { runner.addTest(arguments, {only: true}) }
  ret.print = function () { runner.addTest(arguments, {only: true, print_mode: 'js'}) }
  ret.java = function () { runner.addTest(arguments, {only: true, print_mode: 'java' }) }
  ret.only1 = function () { runner.addTest(arguments, {only: true, trows: [0,1] })}
  runner.run()

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
