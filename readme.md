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

## Examples

[qb-uint/test](https://github.com/quicbit-js/qb-uint/blob/master/test.js) and 
[test-kit/test/default-function-tests.js](https://github.com/quicbit-js/test-kit/blob/master/test/default-function-tests.js) 
have good examples of how to create concise tests with tables.

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

    t.tableAssert(table_or_data, fn, options)
    
If your test table adheres to the convention where the first columns of a table
are inputs and the last column is expected output (should deep-equal output)
of a single function test, 
then you can write the above test even more concisely as:

    var test = require('test-kit).tape()
    
    test('count len > 1', function(t) {
        let tbl = t.tableAssert([
            [ 's',           'v',      'exp' ],
            [ '',            '10',      0  ],
            [ '10',          '10',      1  ],
            [ '101',         '10',      1  ],
            [ '1010',        '10',      2  ],
            [ '0100101001',  '10',      3  ],
        ], t.count)
    })

Which outputs:

    # tape: count len > 1
    ok 1 : ('",'10') -expect-> (0)
    ok 2 : ('10','10') -expect-> (1)
    ok 3 : ('101','10') -expect-> (1)
    ok 4 : ('1010','10') -expect-> (2)
    ok 5 : ('0100101001','10') -expect-> (3)
    

This is similar to asserting imperitively:

    test('count len > 1', function(t) {
        t.plan(5);
        
        t.same( t.count( '',           '10'), 0);
        t.same( t.count( '10',         '10'), 1);
        t.same( t.count( '101',        '10'), 1);
        t.same( t.count( '1010',       '10'), 2);
        t.same( t.count( '0100101001', '10'), 3);
    }
    
But the output for using this traditional approach doesn't reveal detail:

    # tape: count len > 1
    ok 1 should be equivalent
    ok 2 should be equivalent
    ok 3 should be equivalent
    ok 4 should be equivalent
    ok 5 should be equivalent
    
The detailed input and expected output that tableAssert gives speeds up trouble-shooting.
    
### Table assert options - more control

A major benefit of t.tableAssert is the common need for its default behavior.  Many tests can
be written using first several columns for input and last column to assert output - tableAssert()
will plan one assert per row, print full descriptions, and assert 'same' on each function
result.  But what if we want another type of assert?  You can use the options parameter
to use tables with different assert requirements:

    t.tableAssert( table_or_data, fn, options )
    
    options is an object with properties:
        plan:  (number) number of tests to plan() per row.  defaults to 1.  Set to zero to
                not do any plans and use t.end() instead.
               (string) a string plan will use the given column name and total up values in
               a given column to plan the test.
        assert: (string) - gives the test assert method to apply for every row.  'same' is the
                          default.  Works for any assert that operates on two inputs.
                'throws' - will assert that the fn applied to the first columns will
                          throw an error that matches the expression in the last table column.
                'none'   - will do no assertions and leave that up you (your function).
                           The function will use all columns as input.
               
**{assert: 'throws'}** is a great way to cover edge cases in your tests.  For example, sI used
this little table to cover some edge cases in test-table to quickly sweep out those corner cases
and get 98% coverage:

    test(test.engine + ': tableAssert - assert throws', (t) => {
        let tbl = t.table([
            [ 'fn',           'input',                     'expect' ],
            [ t.count,        [4,     4],                  /type not handled/  ],
            [ t.count,        [new Uint8Array(2), false],  /type not handled/  ],
            [ t.count,        ['abc', 4],                  /should be a string/  ],
            [ t.count,        ['abc', ''],                 /zero-length string/  ],
            [ t.count,        [new Uint8Array(2), 'aa'],   /long strings not supported/  ],
            [ t.tableAssert,  [[['a'],[1]],,{plan:3}],     /plan has already been set/  ],  // tableAssert set default plan (1 per row)
        ])
        t.tableAssert(
            tbl,
            function(fn, input){ fn.apply(null, input) },
            {assert: 'throws'}
        )
    })

               
As with other table tests, the test output includes revealing detail for every test:

    # tape: tableAssert - assert throws
    ok 69 : ('count',[4,4]) -expect-> ('/type not handled/')
    ok 70 : ('count',[{'0':0,'1':0},false]) -expect-> ('/type not handled/')
    ok 71 : ('count',['abc',4]) -expect-> ('/should be a string/')
    ok 72 : ('count',['abc','"]) -expect-> ('/zero-length string/')
    ok 73 : ('count',[{'0':0,'1':0},'aa']) -expect-> ('/long strings not supported/')
    ok 74 : ('tableAssert',[[['a'],[1]],null,{'plan':3}]) -expect-> ('/plan has already been set/')



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
   
