array = [1, 2, 3]


mapped = array.map(function(o) {
	return new Buffer(o);
})



console.log(mapped)