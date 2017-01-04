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

The functions described below are available in the t callback argument.
Most of these functions are tiny and can be understood by looking
at the index.js file.  

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
    
You can define your own test functions by passing them into tape() or tap():

    var test = require('test-kit').tap({ myfunc: () => ... } )
    
... or wrap some other test library:

    var test = require('test-kit)('my_tap', { myfunc: () => ... } )
    
To pander to the control-freak common to many of us engineers, test-kit also exports default 
functions to allow full flexibility:

    // roll-your-own kit
    var tk = require('test-kit')
    var test = tk('my_tap', Object.assign({}, tk.DEFAULT_FUNCTIONS, my_functions))

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
    
## t.sum()

    t.sum(a, v)

Return the sum of values in an array, buffer, or string.  Handles substrings.
If prop is given, return the sum of values of the given property.

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

)

... returns:

    [
         'some text',
         '',
         'that is formatted',
         '   with some indentation',
         'on some lines',
    ]

## t.type()

Return the value type using Object.prototype.toString
    
    function type(v) {
        Object.prototype.toString.call(v)
        return ret.substring(8, ret.length-1)
    }

## test.only()

We liked it in [tape](https://github.com/substack/tape), so now it is available with 
[(node-)tap](https://github.com/tapjs/node-tap) .  Awkward and a bit ugly 
to implement, but so darn handy, we just didn't want to give it up after getting hooked on it
in tape

    var test = require('test-kit)

    test.only('test assertions', function(t) {
       ...
    })
    
... will only run the one test, regardless of how many others are in the file.



