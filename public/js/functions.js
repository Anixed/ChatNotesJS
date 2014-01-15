// Quita los tags html del mensaje
function stripTags(element) {
	return element.replace(/(<([^>]+)>)/ig, '').trim();
	//return $(element).text();
}

// A JavaScript equivalent of PHP’s empty:
// Checks if the argument variable is empty
// undefined, null, false, number 0, empty string,
// string "0", objects without properties and empty arrays
// are considered empty
empty = function( v ) { var t = typeof v; return t === 'undefined' || ( t === 'object' ? ( v === null || Object.keys( v ).length === 0 ) : [false, 0, "", "0"].indexOf( v ) >= 0 ); };