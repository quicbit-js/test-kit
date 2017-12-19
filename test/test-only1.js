'use strict'

// no need to test both tape and tap - the logic is related to the same table and functions used in each.
require('./only1-test')(require('..').tape())
