// to an inverse string replacement by passing non-matched segments of s into fn and replacing those
// non-matched segments with fn result.
function nreplace(s, re, fn) {
}




console.log(negmatch('a%F2%F3b', /%../g, {empty: true}))
console.log(negmatch('a%F2%F3b', /%../g, {empty: false}))
console.log(negmatch('a%F2b%F3%F4zzz', /%../g, {empty: true, index: true}))
console.log(negmatch('%F2%F3', /%../g,         {empty: true, index: false}))
console.log(negmatch('%F2%F3', /%../g,         {empty: true, index: true}))
console.log(negmatch('a%F2b%F3%F4zzz', /%../g, {empty: true, index: false }))

// nreplace('a%F2b%F3%F4def', /%../, (a, off, str) => {
//
// })