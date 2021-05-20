let start, end, cad, eb, ghost, levent, srel, ebP;

document.addEventListener('mousedown', CAD_CREATE_OnDown);
document.addEventListener('mouseup', CAD_CREATE_OnUp);

addClassListener('change', 'cad-menu', function(e){
	e = e.srcElement;
	e.parentNode.setAttribute('data-tag', e.value);
});
addTagListener('change', 'select', function(e){
	let selectElem = e.srcElement;
	let arr = selectElem.getElementsByTagName("option");
	for (var i = arr.length - 1; i >= 0; i--) {
		let sel = arr[i];
		// console.log(sel);
		if(sel.hasAttribute('selected')){
			sel.removeAttribute('selected');
		} 
		if(sel.value == selectElem.value){
			sel.setAttribute('selected', 'selected');
		}
	}
	console.log('we are here');
})
function cadElementInnerHTML(cadid = ""){
	let str = `
	<select class = "cad-menu">
		<option value = "editable" selected>Editable</option>
		<option value = "draggable">Draggable</option>
	</select>
`;
	return str; 

}

function CAD_CREATE_OnDown(event){

	start = {x: event.pageX, y: event.pageY};
	eb = document.elementFromPoint(start.x - window.pageXOffset, start.y - window.pageYOffset);
	
	console.log(eb);
	if(eb.getAttribute('data-tag') == 'draggable'){
		srel = relativePosition(eb, start);
		ebP = eb.getBoundingClientRect();
		document.addEventListener('mousemove', CAD_OnDrag);
	} else if(eb.getAttribute('data-tag') == 'editable') {
		start = relativePosition(eb, start);
		document.addEventListener('mousemove', CAD_CREATE_OnDrag);
	}
	
}
function CAD_OnDrag(event){ // create ghost
	levent = event;
	let delta = {x : event.pageX - start.x, y : event.pageY- start.y};
	if(!ghost){
		eb.style.display = "none";
		ghost = eb.cloneNode(true);
		document.body.appendChild(ghost);
		ghost.style.display = "block";
		ghost.classList.add("ghost");
		ghost.getElementsByTagName('select')[0].value="draggable";
		ghost.style.left = (window.scrollX + ebP.left + delta.x) + 'px';
		ghost.style.top = (window.scrollY + ebP.top + delta.y) + 'px';
	}
	ghost.style.left = (window.scrollX + ebP.left + delta.x) + 'px';
	ghost.style.top = (window.scrollY + ebP.top + delta.y) + 'px';

}
function CAD_CREATE_OnDrag(event){

	end = relativePosition(eb, {x: event.pageX, y: event.pageY});

	if(!cad){
		cad = document.createElement('div');
		cad.classList.add('cad-element');
		cad.setAttribute('data-tag', "editable");
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
	document.removeEventListener('mousemove', CAD_OnDrag);
	if(ghost){
		ghost.parentNode.removeChild(ghost);
		let elem = document.elementFromPoint(levent.pageX - window.pageXOffset, levent.pageY - window.pageYOffset);

		if(elem){
			let newchild = eb.cloneNode(true);
			elem.appendChild(newchild);
			
			newchild.getElementsByTagName('select')[0].value="draggable";
			newchild.style.display = "block";
			newchild.style.left = (levent.pageX - srel.x - (elem.getBoundingClientRect().left + window.scrollX) ) + 'px' ;
			newchild.style.top = (levent.pageY - srel.y - (elem.getBoundingClientRect().top + window.scrollY) ) + 'px';
			newchild.style.zIndex = (window.getComputedStyle(eb, null).getPropertyValue("zIndex") || 0) + 1;
		}
		eb.parentNode.removeChild(eb);
	} else if(cad){

		cad.innerHTML = cadElementInnerHTML();
	}
	cad = null;
	eb = null;
	ghost = null;
}

function relativePosition(elem, start){ // with respect to parent
	
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