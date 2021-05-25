
window.onload = function(){
	doThisOnce();
	var makeit = new CAD(document.getElementsByClassName('fc')[0], 25);

}
class Multiset{
	constructor(){
		this.pairset = new SortedSet({ allowSetValue:true, comparator : function(a, b){
			if(a.f == b.f) return a.s - b.s;
			return a.f - b.f;
		}});
	}
	insert(v){
		var it = this.pairset.findIterator({f: v, s: 0});
		//so left to v
		if(it.value() == null || it.value().f != v){
			//this elem is not present add it
			this.pairset.insert({f:v, s:1});
		} else {
			var x = it.value();
			//slow --> 
			// 	this.pairset.remove(x);
			// 	x.s++;
			// 	this.pairset.insert(x);
			//fast --> (use this only when you know the set will be sorted)
					x.s++;
					it.setValue(x);
		}
	}
	remove(v){
		var it = this.pairset.findIterator({f: v, s: 0});
		//so left to v
		if(it.value() == null || it.value().f != v){
			//this elem is not present add it
			//do nothing
		} else {
			var x = it.value();
			this.pairset.remove(x);
			// console.log(x);
			x.s--;

			if(x.s != 0)	
				this.pairset.insert(x);
		}
	}
	getNearest(v){ // left
		var it = this.pairset.findIterator({f: v, s: 0});
		
		if(it.value() == null){
			if(it.hasPrevious()){
				return it.previous().value().f;
			} 
			else 
				return null; // this can't happen
		} else { // the next 
			// console.log(it.hasPrevious());
			if((it.hasPrevious()) && (v - it.previous().value().f) <= (it.value().f - v))
				return it.previous().value().f;
			else 
				return it.value().f;
		}
	}
}
class CADNode{
	constructor(id, parent){
		if(id != 0){
			this.parent = parent;
			this.id = id;
			this.children = [];

			this.parent.addChild(id);
		} else {
			this.id = id;
			this.children = [];
		}
	}
	addChild(childId){
		this.children.push(childId);
	}
}
class CAD{
	static LIMIT = 1e7;
	static className = 'cad';
	static iHTML = `
			<select class = "cad-menu">
				<option value = "editable" selected>Editable</option>
				<option value = "draggable">Draggable</option>
			</select>
		`;

	constructor(elem, proximityQ){
		this.root = elem; // this will be the root, only edit mode

		this.root.classList.add('cad');
		this.root.setAttribute('data-tag', 'editable');
		this.root.id = 'cad-0';

		this.pq = proximityQ; //proximity quotient
		this.snapMode = 'elem-edges'; // current snap-mode

		this.listeners = []; //holding all current listeners
		
		this.CADAsNodes = [new CADNode(0)]; // holding all cad elements in order

		//horizontal lines
		this.linesX = new Multiset();
		//vertical lines
		this.linesY = new Multiset();
		
		// The Boundaries

		this.idCounter = 0;

		var obj =  this;

		this.addLines(this.root, obj);

		this.addListener(obj.root, 'mousedown', obj.mousedown, obj);
	}
	mousedown(event, obj){
		
		// console.log(obj.elem);

		obj.start = {
			x: event.pageX, 
			y: event.pageY,
			wpxo: window.pageXOffset, 
			wpyo: window.pageYOffset
		};
		var start = obj.start;
		
		var eb = document.elementFromPoint(start.x - window.pageXOffset, start.y - window.pageYOffset);
		obj.elem = eb;

		var rect = obj.elem.getBoundingClientRect();
		obj.rect = {
			x : rect.left + window.pageXOffset, 
			y : rect.top + window.pageYOffset, 
			w : rect.width, 
			h : rect.height
		};
		if(eb.getAttribute('data-tag') == 'editable'){
			obj.create(obj);
		} 
		else if(eb.getAttribute('data-tag') == 'draggable'){
			obj.drag(obj);
		}
		// console.log(obj);
	}
	create(obj){
		obj.addListener(obj.root, 'mousemove', obj.creating, obj);
		obj.addListener(obj.root, 'mouseup', obj.created, obj);
	}
	creating(event, obj){
		
		var start = obj.start;
		var end = {
			x : event.pageX, 
			y : event.pageY,
			wpxo : window.pageXOffset,
			wpyo : window.pageYOffset
		};

		if(!obj.telem){
			obj.telem = document.createElement('div');
			obj.telem.classList.add('cad');
			obj.telem.setAttribute('data-tag', 'editable');
			obj.root.appendChild(obj.telem);
			obj.telem.style.zIndex =  (window.getComputedStyle(obj.elem, null).getPropertyValue("zIndex") || 0) + 1;
			obj.telem.id = 'cad-'+ (++obj.idCounter);


		}
		var x = Math.min(start.x, end.x);
		var y = Math.min(start.y, end.y);
		var w = Math.abs(start.x - end.x);
		var h = Math.abs(start.y - end.y);

		obj.telem.style.top = y + "px";
		obj.telem.style.left = x + "px";
		obj.telem.style.width = w + "px";
		obj.telem.style.height = h + "px";
	}
	created(event, obj){
		if(obj.telem)
			obj.telem.innerHTML = CAD.iHTML;
		obj.resetListeners(event, obj);

		obj.addLines(obj.telem, obj);

		obj.telem = null;
		obj.elem = null;

	}

	drag(obj){
		// remove them all
		obj.removeLines(obj.elem, obj);

		obj.addListener(obj.root, 'mousemove', obj.dragging, obj);
		// obj.addListener(window, 'scroll', obj.dragging, obj);
		obj.addListener(obj.root, 'mouseup', obj.dragged, obj);

	}
	dragging(event, obj){
		var start = obj.start;
		var end = (event.type == 'scroll') ? {
			x : event.pageX, 
			y : event.pageY,
			wpxo : window.pageXOffset,
			wpyo : window.pageYOffset
		} : {
			x : event.pageX, 
			y : event.pageY,
			wpxo : window.pageXOffset,
			wpyo : window.pageYOffset
		};

		var delta = {
			x:end.x - start.x, 
			y:end.y - start.y, 
			wpxo: end.wpxo - start.wpxo, 
			wpyo: end.wpyo - start.wpyo
		};
		obj.elem.style.top = (obj.rect.y + delta.y) + 'px';// + delta.wpxo);
		obj.elem.style.left = (obj.rect.x + delta.x) + 'px';// + delta.wpyo);
		
		var pos = {
			x : obj.rect.x + delta.x, 
			y : obj.rect.y + delta.y,
			w : obj.rect.w,
			h : obj.rect.h
		};

		obj.snap(pos, obj);
	}
	snap(pos, obj){
		if(obj.snapMode == 'elem-edges'){
			//now, we need to get the lines of this element
			//obj.elem

		} else if(obj.snapMode == 'elem-vertices'){

		} else if(obj.snapMode == 'grid-lines'){

		} else if(obj.snapMode == 'grid-points'){

		}
	}
	snapToElemEdges(){
		// ?? START WORKING HERE
	}
	dragged(event, obj){

		obj.addLines(obj.elem, obj);
		obj.resetListeners(event, obj);

		obj.elem = null;
	}

	addLines(elem, obj){
		var rect = elem.getBoundingClientRect();
		obj.linesX.insert(rect.top + window.pageYOffset);
		obj.linesX.insert(rect.top + window.pageYOffset + rect.height);
		obj.linesY.insert(rect.left + window.pageXOffset);
		obj.linesY.insert(rect.left + window.pageXOffset + rect.width);
	}
	removeLines(elem, obj){
		var rect = elem.getBoundingClientRect();
		obj.linesX.remove(rect.top + window.pageYOffset);
		obj.linesX.remove(rect.top + window.pageYOffset + rect.height);
		obj.linesY.remove(rect.left + window.pageXOffset);
		obj.linesY.remove(rect.left + window.pageXOffset + rect.width);
	}
	
	resetListeners(event, obj){
		obj.removeAllListeners(obj);
		obj.addListener(obj.root, 'mousedown', obj.mousedown, obj);
	}
	addListener(domElement, events, func, obj){
		var x = function(event){
			func(event, obj);
		}
		obj.listeners.push({domElement: domElement, events: events, func: x});
		domElement.addEventListener(events, x);
	}
	removeAllListeners(obj){
		// console.log(obj);
		for (var i = obj.listeners.length - 1; i >= 0; i--) {
			obj.listeners[i].domElement.removeEventListener(obj.listeners[i].events, obj.listeners[i].func);
		}
		obj.listeners = [];
	}
}

//utility functions
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
		// console.log(e.srcElement.tagName);
		if(e.srcElement.tagName.toLowerCase() == selector.toLowerCase()) {
			doit(e);
		}
	})
};

function doThisOnce(){
	addClassListener('change', 'cad-menu', function(e){
		e = e.srcElement;
		e.parentNode.setAttribute('data-tag', e.value);
	});
	addTagListener('change', 'select', function(e){
		var selectElem = e.srcElement;
		var arr = selectElem.getElementsByTagName("option");
		for (var i = arr.length - 1; i >= 0; i--) {
			var sel = arr[i];
			// console.log(sel);
			if(sel.hasAttribute('selected')){
				sel.removeAttribute('selected');
			} 
			if(sel.value == selectElem.value){
				sel.setAttribute('selected', 'selected');
			}
		}
		// console.log('we are here');
	});
}