# test-kit

Enrich [tape](https://github.com/substack/tape) or 
[tap](https://github.com/tapjs/node-tap) with productivity functions.  

test-kit adds new functions to the callback argument 
(named 't', below), where they are most accessible.  You can enrich with functions included
in test-kit, and/or specify your own.

## Install

Install tape or tap, whichever you prefer:

    npm install tape --save-dev
    // or
    npm install tap --save-dev
    
... and install test-kit

    npm install test-kit --save-dev


## Usage

Enrich your chosen tape or node-tap test harness with:

    let test = require('test-kit').tape
    // or...
    let test = require('test-kit').tap

... then call the test\* function using the basic arguments

    test('testing my-thingy', function(t) {
       ...
    })
    
The callback argument 't' will now include enriched features.

\* the function returned includes the .only() function, which is normally only
available in tape, but we make it available in node-tap as well.

# Functions Included By Default

The following functions are available in the t callback argument.

## t.table()

Creates a simple table for data-driven testing:

    var test = require('test-kit)
    var match = require('my-super-matcher-thingy')
    
    test('test assertions', function(t) {
       var tbl = t.table([
          [ 'str', 'match', 'expect' ],
          [ 'foo', /.*o/,   true     ],
          [ '1234', '34',   true     ],
          [ 'barry', 'rrr', false    ],
       ])
       
       t.plan(tbl.length)
       tbl.forEach(function(r) {
          t.equal(match( r.str, r.match), r.expect)
       })
    })

Representing data in tabular form improves brevity and helps highlight test variations and 
can be very effective at showing expected behavior.

## t.desc()   "describe"

Create **desc**riptive assertion messages with expected input/output:

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

prints out:

    # ftree: checkbase
    ok 1 checkbase: ('/') -expect-> ('/')
    ok 2 checkbase: ('/a/') -expect-> ('/a')
    ok 3 checkbase: ('/a/b/') -expect-> ('/a/b')


## t.sum(array, prop)

Return the sum of values in an array

If prop is given, return the sum of values of the given property.

    

## test.only()

We liked it very much in 'tape', so now it is available with node-tap.  Awkward and a bit ugly 
to implement, but so darn handy, we just didn't want to give it up after getting hooked on it
in tape

    var test = require('test-kit)

    test.only('test assertions', function(t) {
       ...
    })
    
... will only run the one test, regardless of how many others are in the file.



