let start, end, cad, eb;



document.addEventListener('mousedown', CAD_OnDown);
document.addEventListener('mouseup', CAD_OnUp);

function CAD_OnDown(event){

	start = {x: event.pageX, y: event.pageY};
	eb = document.elementFromPoint(start.x - window.pageXOffset, start.y - window.pageYOffset);
	
	console.log(eb);


	start = relativePosition(eb, start);
	

	document.addEventListener('mousemove', CAD_OnDrag);
	
}
function CAD_OnDrag(event){

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

function CAD_OnUp(){
	document.removeEventListener('mousemove', CAD_OnDrag);
	cad = null;
	eb = null;
}


function relativePosition(elem, start){
	
	return {x: start.x - elem.getBoundingClientRect().left - window.scrollX, y: start.y - elem.getBoundingClientRect().top - window.scrollY};
}