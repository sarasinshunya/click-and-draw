let start, end, cad, eb;



document.addEventListener('mousedown', CAD_CREATE_OnDown);
document.addEventListener('mouseup', CAD_CREATE_OnUp);

function CAD_CREATE_OnDown(event){

	start = {x: event.pageX, y: event.pageY};
	eb = document.elementFromPoint(start.x - window.pageXOffset, start.y - window.pageYOffset);
	
	console.log(eb);

	start = relativePosition(eb, start);

	document.addEventListener('mousemove', CAD_CREATE_OnDrag);
	
}
function CAD_CREATE_OnDrag(event){

	end = relativePosition(eb, {x: event.pageX, y: event.pageY});

	if(!cad){
		cad = document.createElement('div');
		cad.classList.add('cad-element');
		eb.appendChild(cad);
		cad.style.zIndex = (window.getComputedStyle(eb, null).getPropertyValue("zIndex") || 0) + 1;
	}	
	let x = Math.min(start.x, end.x);
	let y = Math.min(start.y, end.y);
	let w = Math.abs(start.x - end.x);
	let h = Math.abs(start.y - end.y);

	cad.style.top = y + "px";
	cad.style.left = x + "px";
	cad.style.width = w + "px";
	cad.style.height = h + "px";
}

function CAD_CREATE_OnUp(){
	document.removeEventListener('mousemove', CAD_CREATE_OnDrag);
	cad = null;
	eb = null;
}

function relativePosition(elem, start){
	
	return {x: start.x - elem.getBoundingClientRect().left - window.scrollX, y: start.y - elem.getBoundingClientRect().top - window.scrollY};
}

// aligning to grid basically
// so what we need is a grid, 
// approximation of points to locate the nearest grid point out there
// so, we will create the things as it is , and have fun with it
// there are 4 points surrounding a point and we need the closest one.

// Ok, so when it is inside it's parent, follow the grid, else 
// follow the borders
// Ok, so what we need is an N*M grid
// and sticking it to the least / 

// stick to the grid damn
// O(1) 
// relative postion than, if (decimalMod(posx, unit) > unit/2) return unit
// ok, so snap the ghost to the grid, not the actual element being dragged

function getNearestPoint(point, unit){
	let r = point;
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