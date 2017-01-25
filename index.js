'use strict'

// collects test argument and executes them later (on timeout) according to whether 'only'
// was called or not.
class TestRunner {
    constructor(test_fn, enrich_fns) {
        this.args = []
        this.only_called = false
        this.running = false
        this.test_fn = test_fn
        this.enrich_fns = Object.assign({}, enrich_fns)
    }
    run() {
        var self = this
        setTimeout(function () {
            if(this.running) { throw Error('already running') }
            self.running = true
            self.args.forEach(function (a) {
                self.test_fn(...enrich_test_arguments(a, self.enrich_fns))
            })
        })
    }
    addTest(args, only) {
        if(this.running) { throw Error('cannot add test - already running') }
        if(only) {
            if(this.only_called) {
                throw Error('two calls to only()')
            }
            this.only_called = true
            this.args = [args]
        } else {
            if(!this.only_called) {
                this.args.push(args)
            }
        }
    }
}

// given the arguments to tap.test(...), alter the first function to return an enriched 't' object as in:
//
//      test('mytest', function(t) {...} )
//
function enrich_test_arguments(args, enrich_fns) {
    args = [...args]
    let fi = args.findIndex(a => typeof(a) == 'function')
    args[fi] = enrich_t(args[fi], enrich_fns)
    return args
}


// enrich the test or 't' object by applying transforms in enrich_fns
// 'fn' is the user function that we will call with the new enriched 't':  fn(t)
function enrich_t(fn, enrich_fns) {
    return function(torig) {
        let tnew = Object.create(torig)
        let funcnames = Object.keys(enrich_fns)
        funcnames.forEach(n => { tnew[n] = enrich_fns[n](torig, tnew) })
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
function str(v) {
    if(v === undefined) return 'null'
    return JSON.stringify(v).replace(/([^\\])"/g, "$1'").replace(/\\"/g, '"')
}
function parens(args) {
    var ret = str(args)
    return '(' + ret.substr(1, ret.length-2) + ')'
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
//`)
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
function text_lines(s) {
    let lines = s.split('\n')

    for(var beg=0; beg < lines.length &&    /^\s*$/.test(lines[beg]); beg++);
    for(var end=lines.length-1; end >= 0 && /^\s*$/.test(lines[end]); end--);
    if(beg > end) { return [] }
    let ind = countws(lines[beg])
    for(let i=beg; i<=end; i++) {
        let line = lines[i]
        let ws = countws(line, ind)
        lines[i] = ws === line.length ? '' : line.substring(Math.min(ws, ind))
    }
    return lines.slice(beg, end+1)
}

function countws(s) {
    for(var c=0; c<s.length && s[c] === ' '; c++);
    return c
}

function sum(a, prop_or_func) {
    if(prop_or_func === null || prop_or_func === undefined) {
        return a.reduce((s,v) => s + (v || 0), 0)
    } else if(typeof prop_or_func === 'function') {
        return a.reduce((s,v) => s + prop_or_func(v), 0)
    } else {
        return a.reduce((s,v) => s + (v[prop_or_func] || 0), 0)
    }
}

function table(data) {
    return require('test-table').create(data)
}

// input can be a 2D array or a Table object - for every row, assert that
//
//    fn(first-n-columns) == last-column
//
// If opt.plan === true will plan the tests to the table length: t.plan(table.length).  opt.plan
// will also default to true if t.plan() has not yet been called.  That is, tableAssert sets the plan unless
// you pass {plan: false}, or call t.plan(n) prior to t.tableAssert().
function tableAssert(torig, tnew) {
    return (dataOrTable, fn, opt) => {
        let tbl = tnew.table(dataOrTable)
        opt = opt || {}
        opt.plan = opt.plan == null ? !tnew.planned_tests : opt.plan
        if(opt.plan) {
            torig.plan(tbl.length)
        }
        tbl.rows.forEach((r) => {
            let vals = r._vals
            let exp = vals.pop()
            let out = fn.apply(null, vals)
            tnew.same(out, exp, tnew.desc('', vals, exp))
        })
    }
}

function err(msg) { throw Error(msg) }

function type(v) {
    let ret = Object.prototype.toString.call(v)
    return ret.substring(8, ret.length-1).toLowerCase()
}

function plan(torig, tnew) {
    return function(n) {
        tnew.planned_tests = n       // mark tests as planned (see tableAssert)
        return torig.plan(n)
    }
}

function countstr(s, v) {
    type(v) === 'string' || err('value should be a string: ' + type(v))
    v.length > 0 || err('cannot count zero-length string')

    let c=0;
    if(v.length === 1) {
        let len = s.length
        for(let i=0; i<len; i++) { if(s[i] === v) c++ }
    } else {
        for(let i=s.indexOf(v); i !== -1; i=s.indexOf(v, i+1)) { c++ }
    }
    return c
}

function countbuf(b, v) {
    switch(type(v)) {
        case 'string':
            v.length === 1 || err('long strings not supported')
            v = v.charCodeAt(0)
            break
        case 'number':
            break
        default:
            throw Error('type not handled: ' + type(v))
    }
    let c = 0, len = b.length
    for(let i=0; i<len; i++) { if(b[i] === v) c++ }
    return c
}

function count(s, v) {
    switch(type(s)) {
        case 'uint8array':
            return countbuf(s, v)
        case 'string':
            return countstr(s, v)
        case 'array':
            for(var i=0,c=0; i<s.length; i++) { if(s[i] === v) c++ }
            return c
        default:
            throw Error('type not handled: ' + type(s))
    }
}

// Hector the Collector
// Collected bits of string...
// (http://belz.net/teaching/hector.html)
//
// Return a callback function that collects callback arguments in the 'args' array, provides access to
// columns of results with the arg(i) function.  also supports args('name') if names are provided.
function hector(names) {
    let args = []
    let max_num_args = 0
    let ret = function() {
        args.push([...arguments])
        max_num_args = arguments.length > max_num_args ? arguments.length : max_num_args
    }
    ret.args = args                             // make args a simple/visible property
    ret.arg = function arg(which) {
        let i = which
        if(typeof i === 'string') {
            if(!names) return null
            i = names.indexOf(which)
        }
        if(i < 0 || i >= max_num_args) return null
        return args.map( (list) => list[i] )
    }
    return ret
}

// return a one-line string describing expected input and output.
// If inp is a row object and there is no 'out' param, then return the string using first row values as input and
// last value as expected output.
function desc(s, inp, out) {
    if(arguments.length === 2) {
        let vals = inp._vals || err('expected second argument to be a table Row, not ' + type(inp))
        inp = vals.slice(0,vals.length-1)
        out = vals[vals.length-1]
    } else {
        arguments.length === 3 || err('expected 2 or 3 arguments')
    }
    return s + ': ' + parens(inp) + ' -expect-> ' + parens([out])
}

// created functions may be given the original test object and the new test object to invoke new or prior-defined
// functions (delegate).
let DEFAULT_FUNCTIONS = {
    count:       () => count,
    desc:        () => desc,
    hector:      () => hector,
    lines:       () => text_lines,
    str:         () => str,
    sum:         () => sum,
    table:       () => table,
    tableAssert: (torig, tnew) => tableAssert(torig, tnew),
    type:        () => type,
    plan:        (torig, tnew) => plan(torig, tnew)
}

function testfn(name_or_fn, custom_fns, opt) {
    opt = opt || {custom_only: false}
    let enrich_fns = Object.assign({},  opt.custom_only ? {} : DEFAULT_FUNCTIONS, custom_fns )
    let ret

    let test_orig = name_or_fn
    if(typeof name_or_fn === 'string') {
        test_orig = require(name_or_fn).test || err(name_or_fn + ' has no test function')
    }
    if(test_orig.only) {
        ret =      function() { return      test_orig(...enrich_test_arguments(arguments, enrich_fns )) }
        ret.only = function() { return test_orig.only(...enrich_test_arguments(arguments, enrich_fns )) }
    } else {
        let runner = new TestRunner(test_orig, enrich_fns)
        ret =      function() { runner.addTest(arguments, false) }
        ret.only = function() { runner.addTest(arguments, true) }
        runner.run()
    }
    ret.engine = test_orig.only && test_orig.onFinish ? 'tape' : 'tap'  // just a guess by what is likely
    Object.keys(test_orig).forEach((k) => {
        if(!ret[k]) {
            let orig = test_orig[k]
            if(typeof orig === 'function') {
                ret[k] = function() {return orig.apply(test_orig, arguments)}  // call function with original context
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
module.exports.tap =  function(custom_fns, opt) { return testfn('tap',  custom_fns, opt) }
module.exports.tape = function(custom_fns, opt) { return testfn('tape', custom_fns, opt) }

