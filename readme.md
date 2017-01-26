# test-kit

Enrich [tape](https://github.com/substack/tape) or 
[(node-)tap](https://github.com/tapjs/node-tap) with productivity functions.  

test-kit adds new functions to the callback argument 
(named 't', below), where they are most accessible in your tests.  
You can simply use the functions provided by test-kit or specify your own.

## Install

Install tape or tap, whichever you prefer:

    npm install tape --save-dev
    // or
    npm install tap --save-dev
    
... and install test-kit

    npm install test-kit --save-dev


## Usage

Enrich your chosen tape or node-tap test harness with:

    let test = require('test-kit').tape()
    // or...
    let test = require('test-kit').tap()

... then call the test\* function using the basic arguments

    test('testing my-thingy', function(t) {
       ...
    })
    
The callback argument 't' will now include enriched features.

\* the function returned includes the .only() function, which is normally only
available in tape, but we make it available in node-tap as well.

# Functions Included By Default

Quicbit Inc's philosphy is to create simple and open software.  
These functions are very simple and open.  We recommend looking at
DEFAULT_FUNCTIONS in index.js 
to understand them and to become comfortable with defining your own.    

## t.table()

Creates a simple table for data-driven testing:

    var test = require('test-kit).tape()

    test('test-defaults: count', function(t) {
        let tbl = t.table([
            [ 's',           'v',      'exp' ],
            [ '',            '10',      0  ],
            [ '10',          '10',      1  ],
            [ '101',         '10',      1  ],
            [ '1010',        '10',      2  ],
            [ '0100101001',  '10',      3  ],
        ])
        t.plan(tbl.length)
        tbl.forEach(function(r) {
            t.equal(t.count(r.s, r.v), r.exp)
        })
    })


This example comes directly from default-function-tests.js included with the package.
Representing data in tabular form can make it easier to create comprehensive 
coverage and highlight the test variations.

## t.tableAssert()

If your test table adheres to the convention where the first columns
are inputs and the last column is expected output (should deep-equal output)
of a single function test, 
then you can write the above test even more concisely as:

    var test = require('test-kit).tape()
    
    test('test-defaults: count len > 1', function(t) {
        let tbl = t.tableAssert([
            [ 's',           'v',      'exp' ],
            [ '',            '10',      0  ],
            [ '10',          '10',      1  ],
            [ '101',         '10',      1  ],
            [ '1010',        '10',      2  ],
            [ '0100101001',  '10',      3  ],
        ], t.count)
    })

... which is equivalent to defining these tests with descriptive messages:

    test('test-defaults: count', function(t) {
        t.plan(5)
        
        t.equal(t.count('', '10'), 0, t.desc('', ['', '10'], 0))
        t.equal(t.count('10', '10'), 1, t.desc('', ['10', '10'], 1))
        t.equal(t.count('101', '10'), 1, t.desc('', ['101', '10'], 1))
        t.equal(t.count('1010', '10'), 2, t.desc('', ['1010', '10'], 2))
        t.equal(t.count('0100101001', '10'), 3, t.desc('', ['0100101001', '10'], 3))
    }


## t.desc()   "describe"

Create **desc**riptive assertion messages with expected input/output:

    desc(label, inputs, expected_output)
    
For example, the following test:

    var test = require('test-kit').tape
    
    test('ftree: checkbase', function(t) {
        var tbl = t.table([
            ['base',      'exp'],
            ['/',         '/',  ],
            ['/a/',       '/a', ],
            ['/a/b/',     '/a/b'],
        ])
    
        t.plan(tbl.length)
        tbl.rows.forEach(function(r){
            t.equal(bpath.checkbase(r.base),  r.exp, t.desc('checkbase', [r.base], r.exp))
        })
    })

prints:

    # ftree: checkbase
    ok 1 checkbase: ('/') -expect-> ('/')
    ok 2 checkbase: ('/a/') -expect-> ('/a')
    ok 3 checkbase: ('/a/b/') -expect-> ('/a/b')

**shorter form**

If input is a row object and there is no expected_output param, then return 
a string using first row values as input and last value as expected output.

        t.plan(tbl.length)
        tbl.rows.forEach(function(r){
            t.equal(bpath.checkbase(r.base),  r.exp, t.desc('checkbase', r))
        })


## t.hector()
    Hector the Collector
    Collected bits of string...
    
http://belz.net/teaching/hector.html
    
    t.hector(names)
    
... returns a function that records arguments as it is called.

The returned function has two properties:
    
    f.args                  the array/stack of arguments collected
    f.arg(name_or_number)   function returning array of arguments of the given 
                                name (if names was used, above), or number/index.

## t.count()

    t.count(buf, value)
    
Return the number of occurrences of value in a Uint8Array (or string or array).  Counting
substrings in a string can handle different length substring values and employs a incrementing
indexOf check for the count.  However, 
uint8arrays currently only count single byte or single string (character code) occurences 
and arrays only count values using '==='.
    
## t.sum()

    t.sum(array, property_or_function)

Return the sum of values in an array, buffer, or string.  If second argument is a function,
return the sum of the results of the function applied to each array value.  If second
argument is a string or number, return the sum of that property of all items in the 
array.

## t.str()

A simple but crude string transform based on JSON.stringify()

## t.lines()

Easy capture of formatted text into string-array.

Given a string, return an array of strings trimming start and end blank lines but preserving
interim blank lines and relative space-indentation.  (using first space-indented line as the minimum indent).

    t.lines(`
    
            some text
    
            that is formatted
                with some indentation
            on some lines
    
    `)

... returns:

    [
         'some text',
         '',
         'that is formatted',
         '   with some indentation',
         'on some lines',
    ]

## t.type()

Return the value type using Object.prototype.toString.  The implementation from index.js:
    
    function type(v) {
        let ret = Object.prototype.toString.call(v)
        return ret.substring(8, ret.length-1).toLowerCase()
    }
    
For the cases below, type(v) yields the exp(ected) outputs 

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

(the table was copied from [test/default-function-tests.js](https://github.com/quicbit-js/test-kit/blob/master/test/default-function-tests.js))
    

## test.only()

We liked it in [tape](https://github.com/substack/tape), so now it is available with 
[(node-)tap](https://github.com/tapjs/node-tap) .  Awkward and a bit ugly 
to implement, but so darn handy, we just didn't want to give it up after getting hooked on it
in tape

    var test = require('test-kit').tape()

    test.only('test assertions', function(t) {
       ...
    })
    
... will only run the one test, regardless of how many others are in the file.


# Understanding and Extending test-kit

For transparency and to help developers understand how the package works,
test-kit exposes a 
DEFAULT_FUNCTIONS object, which holds all of test-kits test functions: 
 
Most of these extra functions are tiny and can be understood by looking
at the index.js file:  

    // Creation functions are passed the original test object and the new test
    // object so they may invoke new or prior-defined functions (delegate).
    
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

Each entry in the map returns a test function.  Returned functions may use the original and/or new test
objects (torig, tnew) as part of their implementation.

Reading the tests for these functions themselves in [test/default-function-tests.js](https://github.com/quicbit-js/test-kit/blob/master/test/default-function-tests.js) 
also helps explain how these functions work. 
    
You can define your own test functions by passing them into tape() or tap():

    var test = require('test-kit').tap({ myfunc: () => ... } )
    
... or enrich a different test library (e.g. your own 'mytap').

    var test = require('test-kit)(require('mytap'), { myfunc: () => ... } )
    

# Packaging Tests with Browserify and Other Tools

Calling <code>require('test-kit').tape()</code> is convenient, but if you are packaging your tests
with browserify or similar tools, use the <code>require(...)(require(...))</code> form instead:

    var test = require('test-kit')(require('tap'))               // OK
    var test = require('test-kit')(require('tape'))              // OK
    var test = require('test-kit')(require('tape'), custom_fns)  // OK
    

    var test = require('test-kit').tap()             // not traceable
    var test = require('test-kit').tape()            // not traceable
    var test = require('test-kit')('tap')            // not traceable
    var test = require('test-kit')('tape')           // not traceable
   
