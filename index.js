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
function enrich_t(fn, enrich_fns) {
    return function(t) {
        let funcnames = Object.keys(enrich_fns)
        funcnames.forEach(n => { t[n] = enrich_fns[n](t) })
        fn(t)
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

function err(msg) { throw Error(msg) }

function type(v) {
    let ret = Object.prototype.toString.call(v)
    return ret.substring(8, ret.length-1).toLowerCase()
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

function testfn(name_or_fn, enrich_fns) {
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
    return ret
}

// property/function transforms applied to the test object passed into each test:
//
//      test( 'my test', function(t) {...} )   // applied to the 't' object
//
// return a simple description of a function test: inputs -> outputs
testfn.DEFAULT_FUNCTIONS = {
    desc: () => function(s, inp, out) {
        return s + ': ' + parens(inp) + ' -expect-> ' + parens([out])
    },
    table: () => function(data) {
        return require('test-table').from_data(data)
    },
    str:    () => str,
    lines:  () => text_lines,
    hector: () => hector,
    sum:    () => sum,
    count:  () => count,
    type:   () => type
}

module.exports = testfn
module.exports.tap =  function(test_fns) { return testfn('tap',  Object.assign({}, testfn.DEFAULT_FUNCTIONS, test_fns)) }
module.exports.tape = function(test_fns) { return testfn('tape', Object.assign({}, testfn.DEFAULT_FUNCTIONS, test_fns)) }

