
function relativePosition(elem, start){ // with respect to parent
	
	return {x: start.x - elem.getBoundingClientRect().left - window.scrollX, y: start.y - elem.getBoundingClientRect().top - window.scrollY};
}

function getNearestPoint(point, unit){
	var r = point;
	if(point.x - unit * parseInt(point.x / unit) > unit/2){
		r.x = parseInt(point.x / unit);
	} else {
		r.x = parseInt(point.x / unit) + unit;
	}
	if(point.y - unit * parseInt(point.y / unit) > unit/2){
		r.y = parseInt(point.y / unit);
	} else {
		r.y = parseInt(point.y / unit) + unit;
	}
}

function HYPOT(x, y){
	return Math.sqrt(x*x + y*y);
}

function distanceBoxParticle2D( x,  y,  x_min,  y_min,
         x_max,  y_max)
{
    if (x < x_min) {
        if (y <  y_min) return HYPOT(x_min-x, y_min-y);
        if (y <= y_max) return x_min - x;
                        return HYPOT(x_min-x, y_max-y);
    } else if (x <= x_max) {
        if (y <  y_min) return y_min - y;
        if (y <= y_max) return 0;
                        return y - y_max;
    } else {
        if (y <  y_min) return HYPOT(x_max-x, y_min-y);
        if (y <= y_max) return x - x_max;
                        return HYPOT(x_max-x, y_max-y);
    }
}

function addClassListener(event, selector, doit){
	document.addEventListener(event, function(e){
		if(e.srcElement.classList.contains(selector)) {
			doit(e);
		}
	})
}
function addTagListener(event, selector, doit){
	document.addEventListener(event, function(e){
		console.log(e.srcElement.tagName);
		if(e.srcElement.tagName.toLowerCase() == selector.toLowerCase()) {
			doit(e);
		}
	})
}