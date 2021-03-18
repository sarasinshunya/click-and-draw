let start, end, cad, eb;



document.addEventListener('mousedown', CAD_OnDown);
document.addEventListener('mouseup', CAD_OnUp);

function CAD_OnDown(event){

	start = {x: event.clientX, y: event.clientY};
	eb = document.elementFromPoint(start.x, start.y);
	
	document.addEventListener('mousemove', CAD_OnDrag);
	
}
function CAD_OnDrag(event){
	
	end = {x: event.clientX, y: event.clientY};
	
	if(!cad){
		cad = document.createElement('div');
		cad.classList.add('cad-element');
		document.body.appendChild(cad);
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
}
