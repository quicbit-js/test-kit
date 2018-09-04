# test-kit

[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![dependencies][proddep-image]][proddep-link]
[![dev dependencies][devdep-image]][devdep-link]
[![code analysis][code-image]][code-link]


[npm-image]:       https://img.shields.io/npm/v/test-kit.svg
[downloads-image]: https://img.shields.io/npm/dm/test-kit.svg
[npm-url]:         https://npmjs.org/package/test-kit
[proddep-image]:   https://www.bithound.io/github/quicbit-js/test-kit/badges/dependencies.svg
[proddep-link]:    https://www.bithound.io/github/quicbit-js/test-kit/master/dependencies/npm
[devdep-image]:    https://www.bithound.io/github/quicbit-js/test-kit/badges/devDependencies.svg
[devdep-link]:     https://www.bithound.io/github/quicbit-js/test-kit/master/dependencies/npm
[code-image]:      https://www.bithound.io/github/quicbit-js/test-kit/badges/code.svg
[code-link]:       https://www.bithound.io/github/quicbit-js/test-kit

[tap-link]:        https://github.com/tapjs/node-tap
[tape-link]:       https://github.com/substack/tape 
An improved data-driven test experience using [tap][tap-link] or [tape][tape-link].

Enriches tape or tap (your choice) with productivity functions.  Most notable is
table_assert(), which shows coverage cases more clearly and improves test output as well.

test-kit adds new functions to the callback argument 
(named 't', below), where they are most accessible in your tests.  
You can simply use the functions provided by test-kit or specify your own.

**Complies with the 100% test coverage and minimum dependency requirements** of 
[qb-standard](http://github.com/quicbit-js/qb-standard) . 

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

    let test = require('test-kit).tape()

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


### table comments

*new feature* s of version 2.8.1, *comments* can included in tables like so:

    let test = require('test-kit).tape()

    test('test-defaults: count', function(t) {
        let tbl = t.table([
            '# Table Comment',
            [ 's',           'v',      'exp' ],
            [ '',            '10',      0  ],
            [ '10',          '10',      1  ],
            '# A Row Comment',
            [ '101',         '10',      1  ],
            [ '1010',        '10',      2  ],
            [ '0100101001',  '10',      3  ],
        ])
        t.plan(tbl.length)
        tbl.forEach(function(r) {
            t.equal(t.count(r.s, r.v), r.exp)
        })
    })
    
Comments are kept internally in the table and are printed again when using the 
handy [test.print()](#test_print) feature.

## t.table_assert ()

    t.table_assert(table_or_data, fn, options)
    
Instead of: 

    var test = require('tape')
    var illegal = require('qb-utf8-illegal-bytes')
    
    test('illegal', function (t) {
      t.plan(7)
      
      t.deepEqual(illegal([167, 168, 169]),             [[0,3]] )
      t.deepEqual(illegal([167, 168, 169], 1),          [[1,3]] )
      t.deepEqual(illegal([167, 168, 169], 2),          [[2,3]] )
      t.deepEqual(illegal([167, 168, 169], 3),          [] )
      t.deepEqual(illegal([167, 168, 169], null, 2),    [[0,2]] )
      t.deepEqual(illegal([167, 97, 168, 98, 169]),     [[0,1], [2,3], [4,5]] )
      t.deepEqual(illegal([97, 98, 0x63, 167, 97, 98]), [[3,4]] )
    })
    
Try this (the first three columns are 
used as inputs to illegal(), the 'expect' column is asserted to be deepEqual to the result).

    var test = require('test-kit').tape()
    var illegal = require('qb-utf8-illegal-bytes')
    
    test('illegal', function (t) {
      t.table_assert([
        [ 'src',                         'off',  'lim',      'expect'                ],
        [ [ 167, 168, 169 ],              null,   null,      [ [0,3] ]               ],
        [ [ 167, 168, 169 ],              1,      null,      [ [1,3] ]               ],
        [ [ 167, 168, 169 ],              2,      null,      [ [2,3] ]               ],
        [ [ 167, 168, 169 ],              3,      null,      []                      ],
        [ [ 167, 168, 169 ],              null,   2,         [ [0,1] ]               ],
        [ [ 167, 97, 168, 98, 169 ],      null,   null,      [ [0,1], [2,3], [4,5] ] ],
        [ [ 97, 98, 0x63, 167, 97, 98 ],  null,   null,      [ [3,4] ]               ],
      ], illegal)
    })
    
I find spotting and updating special test cases works better when inputs and expected output
are laid out in table form.
    
Using table_assert() **also enriches the test output** so instead of:

    # illegal
    ok 1 should be equivalent
    ok 2 should be equivalent
    ok 3 should be equivalent
    ok 4 should be equivalent
    not ok 5 should be equivalent
      ---
        operator: deepEqual
        expected: [ [ 0, 1 ] ]
        actual:   [ [ 0, 2 ] ]
        at: Test.<anonymous> (/Users/dad/ghub/qb-utf8-illegal-bytes/t.js:10:12)
      ...
    ok 6 should be equivalent
    ok 7 should be equivalent

We get:

    # illegal
    ok 1 : ([167,168,169],null,null) -expect-> ([[0,3]])
    ok 2 : ([167,168,169],1,null) -expect-> ([[1,3]])
    ok 3 : ([167,168,169],2,null) -expect-> ([[2,3]])
    ok 4 : ([167,168,169],3,null) -expect-> ([])
    not ok 5 : ([167,168,169],null,2) -expect-> ([[0,1]])
      ---
        operator: deepEqual
        expected: [ [ 0, 1 ] ]
        actual:   [ [ 0, 2 ] ]
        at: Test.table_assert (/Users/dad/ghub/qb-utf8-illegal-bytes/node_modules/test-kit/index.js:171:14)
      ...
    ok 6 : ([167,97,168,98,169],null,null) -expect-> ([[0,1],[2,3],[4,5]])
    ok 7 : ([97,98,99,167,97,98],null,null) -expect-> ([[3,4]])

... which has been a big time-saver for me personally.  These little tools have helped raise the practice of testing
from a tedious chore to something almost fun.   *almost*.

### Table assert options - more control

A major benefit of t.table_assert is the common need for its default behavior.  Many tests can
be written using first several columns for input and last column to assert output - table_assert()
will plan one assert per row, print full descriptions, and assert 'same' on each function
result.  But what if we want another type of assert?  You can use the options parameter
to use tables with different assert requirements:

    t.table_assert( table_or_data, fn, options )
    
    options is an object with properties:
        plan:  (number) number of tests to plan() per row.  defaults to 1 (if assert !== 'none').  
                        Set plan to zero to do no plan() and use t.end() instead.
               (string) a string plan will use the given column name and total up values in
               a given column to plan the test.
        assert: (string) - gives the test assert method to apply for every row.  'same' is the
                          default.  Works for any assert that operates on two inputs.
                'throws' - will assert that the fn applied to the first columns will
                          throw an error that matches the expression in the last table column.
                'none'   - will do no assertions and leave that up you (your function).
                           The function will use all columns as input.  No default plan is set.
        trunc: (boolean) - if set, the arguments passed to the callback will first have t.trunc() applied (removing
                             null and undefined values from the end)
               
**{assert: 'throws'}** is a great way to cover edge cases in your tests.  For example, sI used
this little table to cover some edge cases in test-table to quickly sweep out those corner cases
and get 98% coverage:

    test(test.engine + ': table_assert - assert throws', (t) => {
        let tbl = t.table([
            [ 'fn',           'input',                     'expect' ],
            [ t.count,        [4,     4],                  /type not handled/  ],
            [ t.count,        [new Uint8Array(2), false],  /type not handled/  ],
            [ t.count,        ['abc', 4],                  /should be a string/  ],
            [ t.count,        ['abc', ''],                 /zero-length string/  ],
            [ t.count,        [new Uint8Array(2), 'aa'],   /long strings not supported/  ],
            [ t.table_assert,  [[['a'],[1]],,{plan:3}],     /plan has already been set/  ],  // table_assert set default plan (1 per row)
        ])
        t.table_assert(
            tbl,
            function(fn, input){ fn.apply(null, input) },
            {assert: 'throws'}
        )
    })

               
As with other table tests, the test output includes revealing detail for every test:

    # tape: table_assert - assert throws
    ok 69 : ('count',[4,4]) -expect-> ('/type not handled/')
    ok 70 : ('count',[{'0':0,'1':0},false]) -expect-> ('/type not handled/')
    ok 71 : ('count',['abc',4]) -expect-> ('/should be a string/')
    ok 72 : ('count',['abc','"]) -expect-> ('/zero-length string/')
    ok 73 : ('count',[{'0':0,'1':0},'aa']) -expect-> ('/long strings not supported/')
    ok 74 : ('table_assert',[[['a'],[1]],null,{'plan':3}]) -expect-> ('/plan has already been set/')


## t.tkprop ()  "get/set property"

get or set a test-kit property on the running test.  Currently there is only one property "print_mode",
which is truthy.

    t.tkprop('print_mode')              // one argument queries the property
    > null
    
    t.tkprop('print_mode', true)        // set print mode to enabled
    t.tkprop('print_mode')          
    > true
    
See test.print() for more info - (similar to the only() function)

## t.desc ()   "describe"

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

## t.permut ()

Generates every permutation of a given series (array of values).  Handy for covering all cases of some types of tests.

    t.permut([1,2,3])
    
    > [ [1,2,3], [2,1,3], [3,1,2], [1,3,2], [2,3,1], [3,2,1] ]

## t.hector ()

    Hector the Collector
    Collected bits of string...
    
http://belz.net/teaching/hector.html
    
    t.hector(names)
    
... returns a function that records arguments as it is called.

The returned function has two properties:
    
    f.args                  the array/stack of arguments collected
    f.arg(name_or_number)   function returning array of arguments of the given 
                                name (if names was used, above), or number/index.

## t.count ()

    t.count(source, value)
    
Return the number of occurrences of value in a source string, array, or uint8array.  Counts
any-length substrings in a string, but only single bytes in a uint8array.  Uses
String.indexOf for string checking and equivalence (===) for arrays.
    
## t.sum ()

    t.sum(array, property_or_function)

Return the sum of values in an array, buffer, or string.  If second argument is a function,
return the sum of the results of the function applied to each array value.  If second
argument is a string or number, return the sum of that property of all items in the 
array.

## t.trunc ()

    t.trunc(a)
    
Given an array or array-like object, return a new array with trailing null and undefined values removed.  

    t.trunc( [1, 2, 3, undefined] )
    > [1, 2, 3]
    t.trunc( [0, null, null] )
    > [0]
    t.trunc( ['a', 2] )
    >['a', 2]

This can be helpful when using table_assert testing variable-arg functions:

    // test padl() with and without the 3rd character argument:
    
    t.table_assert([
        [ 's',  'len',  'ch',  'expect' ],
        [ 'a',  '3'     '.',   'a..'    ],
        [ 'a',  '3',   null,   'a  '    ],
    ], function () {
        return t.padl.apply(null, t.trunc( arguments ) )
    })
    
t.trunc() is also available as a [table_assert](#ttable_assert-and-ttableassert) option.

## t.imatch ()

    imatch(s, regex, options)

Return an inverse match of the given string.  That is, return all substrings (or ranges) that do 
not match the regex.

    imatch( 'abcbb', /b/ )   ->    [ 'a', 'cbb' ]
    imatch( 'abcbb', /b/g )  ->    [ 'a', 'c' ]           // global match


imatch can be easier to understand than regex using negative-lookahead.

options:

    empties :  'ignore' (default)  - return only strings between matches that have characters
               'include'           - return the empty spaces between matches as empty strings

    return :   'strings' (default) - return results as array of substrings
               'tuples'            - return results as [ offset, length ] tuples

    no_match : 'string' (default)  - when regex does not match, return the entire string as the only result in the array.
               'null'              - when regex does not match any part of the string, return null
               'error'             - when regex does not match, throw an error


**Examples** 

    imatch( 'abcbb', /b/g, {index:true} )  ->   [ [0,1], [2,1] ]

    // include the zero-space "empties" around any matches (as strings or offset/length tuples):

    imatch( 'b',     /b/g, {empties:'include'} )  ->                    [ '', '']
    imatch( 'abcbb', /b/g, {empties:'include'} )  ->                    [ 'a', 'c', '', '' ]
    imatch( 'abcbb', /b/g, {empties:'include', return:'tuples'} )  ->   [ [0,1], [2,1], [4,0], [5,0] ] ]

    // unmatched expression returns the entire string by default:

    imatch( 'b',     /a/ } ->  [ 'b' ]

    // but can return null, or throw error, if preferred:

    imatch( 'b', /a/, { no_match: 'null' } }
    imatch( 'b', /a/, { no_match: 'error' } }
    
...more examples in [default-function-tests](https://github.com/quicbit-js/test-kit/blob/master/test/default-function-tests.js)


## t.ireplace ()

    t.ireplace(s, regex, string_or_fn, opt)
    
Return a string with an inverse replacement - that is, replacement of parts of the string that
did not match the given regex.

    t.ireplace( 'a%F2b%D8%E6c', /%../, (s) => '%'+s.charCodeAt(0).toString(16) )  
    
    ... gives: '%61%F2%62%D8%E6%63'
    
Options for controlling substrings matched and no-match handling are the same as for imatch, 
with the exception of the 'return' option which is ignored.

## t.padl (str, length, char)

Return string <code>str</code> left-padded up to <code>length</code> characters using char as padding.
char (defaults to single-space) can be and length-1 string.
    
## t.padr (str, length, char)

Return string <code>str</code> right-padded up to <code>length</code> characters using char as padding.
char (defaults to single-space) can be and length-1 string.
    
## t.str (value)

Returns a string representation of value.  A simple but crude string transform based on JSON.stringify()


## t.last (a) 
## t.lines (text)

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
    
## t.utf8( value )

Symmetrical with t.utf8_to_str()

Return an array of UTF-8 encoded bytes for the given value which may be:

   * a unicode code point (integer), such as 0x10400 [DESERET CAPITAL LETTER LONG I](http://www.fileformat.info/info/unicode/char/10400/index.htm)
   * an array of unicode code points
   * a string
   
  

## t.utf8_to_str( utf8_buf_or_array )

Symmetrical with t.utf8()

Return a string decoded from the given utf8 encoded bytes.


## t.type( value )

Return the value type using Object.prototype.toString.  The implementation from index.js:
    
    function type(v) {
        let ret = Object.prototype.toString.call(v)
        return ret.substring(8, ret.length-1).toLowerCase()
    }
    
For the cases below, type(v) yields the exp(ected) outputs 

        t.table_assert([
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
    

## test.print()

Using lots of rich table asserts?  That's great.  Tired of changing output and having to update your
table output all by hand?  Yeah.  Me too.

This was the test that pushed me over the edge.  It's a JSON parse module called
[qb-json-tokv](https://github.com/quicbit-js/qb-json-tokv) 
that saves detailed
information for incremental parsing and recovery:

    test('incremental', function (t) {
      t.table_assert(
        [
          [ 'input',               'exp'                                               ],
          [ '"abc", ',             [ 'B@0,S5@0,E@7', '0.7/-/B_V/null' ]                ],
          [ '[',                   [ 'B@0,[@0,E@1', '0.1/[/BFV/null' ]                 ],
          [ '[ 83 ',               [ '[@0,N2@2,E@5', '0.5/[/A_V/null' ]                ],
          [ '[ 83 ,',              [ '[@0,N2@2,E@6', '0.6/[/B_V/null' ]                ],
          [ '[ 83 , "a"',          [ 'N2@2,S3@7,E@10', '0.10/[/A_V/null' ]             ],
          [ '[ 83 , "a",',         [ 'N2@2,S3@7,E@11', '0.11/[/B_V/null' ]             ],
          [ '[ 83 , "a", 2',       [ 'N2@2,S3@7,E@12', '0.13/[/B_V/2' ]                ],
          [ '{',                   [ 'B@0,{@0,E@1', '0.1/{/BFK/null' ]                 ],
          [ '{ "a"',               [ 'B@0,{@0,K3@2:E@5', '0.5/{/A_K/null' ]            ],
          [ '{ "a":',              [ 'B@0,{@0,K3@2:E@6', '0.6/{/B_V/null' ]            ],
          [ '{ "a": 9',            [ 'B@0,{@0,K3@2:E@7', '0.8/{/B_V/9' ]               ],
          [ '{ "a": 93, ',         [ '{@0,K3@2:N2@7,E@11', '0.11/{/B_K/null' ]         ],
          [ '{ "a": 93, "b',       [ '{@0,K3@2:N2@7,E@11', '0.13/{/B_K/"b' ]           ],
          [ '{ "a": 93, "b"',      [ '{@0,K3@2:N2@7,K3@11:E@14', '0.14/{/A_K/null' ]   ],
          [ '{ "a": 93, "b":',     [ '{@0,K3@2:N2@7,K3@11:E@15', '0.15/{/B_V/null' ]   ],
          [ '{ "a": 93, "b": [',   [ 'K3@2:N2@7,K3@11:[@16,E@17', '0.17/{[/BFV/null' ] ],
          [ '{ "a": 93, "b": []',  [ 'K3@11:[@16,]@17,E@18', '0.18/{/A_V/null' ]       ],
          [ '{ "a": 93, "b": [] ', [ 'K3@11:[@16,]@17,E@19', '0.19/{/A_V/null' ]       ],
      ...

Lot's of dense output for parsing.  With every enrichment of information, I had to edit multiple 
lines of expected output.  Soon had enough of that - and instead added the new print() function.
It works like test.only(), in that you add it to the test you are working on and it will run
only the assertions in that test.  If there is a table_assert, it will pretty-print it out
in javascript so you can verify and paste the whole table in if you like to save yourself from
of tedious effort.

For a test like this:

    test('incremental', function (t) {
      t.table_assert(
        [
          [ 'input'              , 'exp'                                               ],
          [ '"abc", '            , [ 'B@0,S5@0,E@7', '0.7/-/B_V/null' ]                ],
          [ '['                  , [ 'B@0,[@0,E@1', '0.1/[/BFV/null' ]                 ],
          ...


Simply change the first line to:

    test.print('incremental', function (t) {


and the table prints itself out with new assertions in the last column.  Paste it in and check the diff...
and i'm on to more exciting things.  Enjoy!

**One caveat** - while print handles strings, numbers, objects, arrays, booleans... quite nicely, the 
table has to be full of these basic things to do what you want.  If your table is using many variables to 
complex data, then it won't be fun for you... and neither will inspections/debugging, imho, but that's something
to keep in mind.



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


## test.only1()

"There can be only one".

Going even beyond the convenience of test.only(), test.only1() tests only the first row in any given
test table.  Very useful for honing in on a single problem:

    test.only1('types', (t) => {
        t.table_assert([
            [ 'v',       'exp'       ],
            [ 1,         'number'    ],
            [ null,      'null'      ],
            [ undefined, 'undefined' ],
            [ [1, 2],    'array'     ],
        ], t.type)
    })
    
... Will only run the first row test <code>[ 1, 'number' ]</code>, setting t.plan(1) etc.

In combination with an editor that comments out lines, we can very quickly isolate and run one test.  For
example:

    test.only1('types', (t) => {
        t.table_assert([
            [ 'v',       'exp'       ],
    //        [ 1,         'number'    ],
    //        [ null,      'null'      ],
            [ undefined, 'undefined' ],
            [ [1, 2],    'array'     ],
        ], t.type)
    })

... runs the <code>[ undefined, undefined ]</code> test and nothing else.

# Understanding and Extending test-kit

For transparency and to help developers understand how the package works,
test-kit exposes a 
DEFAULT_FUNCTIONS object, which holds all of test-kits test functions: 
 
Most of these extra functions are tiny and can be understood by looking
at the index.js file:  

    // Creation functions are passed the original test object and the new test
    // object so they may invoke new or prior-defined functions (delegate).
    
    var DEFAULT_FUNCTIONS = {
      count: function ()                   { return count },
      desc: function ()                    { return desc },
      hector: function ()                  { return hector },
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
   
