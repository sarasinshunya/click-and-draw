
window.onload = function(){
	doThisOnce();
	var makeit = new CAD(document.getElementsByClassName('fc')[0], 15);

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
			// this one is the fast one
			// console.log(x);
			if(x.s != 1){
				x.s--;
				it.setValue(x);
			} else {
				this.pairset.remove(x);
			}
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
	gimmeArray(){
		return this.pairset.map(function(x){ return x.f;});
	}
}
class CADNode{
	constructor(id, parent){
		if(id != 0){
			this.parent = parent;
			this.id = id;
			this.children = [];

			this.parent.children.push(id);
		} else {
			this.id = id;
			this.children = [];
		}
	}
	makeChildOf(parent){
		this.parent.children.splice(this.parent.children.indexOf(this.id), 1);
		this.parent = parent;
		parent.children.push(this.id);
	}
}
class CAD{
	static LIMIT = 1e7;
	static iHTML = `
			<select class = "cad-menu">
				<option value = "editable" selected>Draw Rectangle</option>
				<option value = "editable-curve">Draw Line/Curve</option>
				<option value = "editable-ellipse">Draw Ellipse</option>
				<option value = 'editable-freehand'>Draw Freehand</option>
				<option value = "draggable">Drag</option>
			</select>
		`;
	static borderWidth = 1;

	constructor(elem, proximityQ){
		this.root = elem; // this will be the root, only edit mode

		this.root.classList.add('cad');
		this.root.classList.add('cad-root');

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

	getCADAncestorWhichContainsClass(elem, cl){
		var id = parseFloat(elem.id.substr(4));

		while(elem && (! elem.classList.contains(cl))){
			// console.log(elem);
			id = this.CADAsNodes[id].parent.id;
			elem = document.getElementById('cad-'+id);
		}

		return elem;
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
		
		console.log(eb.getAttribute('data-tag'));

		if(eb.getAttribute('data-tag') == 'editable'){
			obj.create(obj);
		} 
		else if(eb.getAttribute('data-tag') == 'draggable'){
			obj.drag(obj);
		}
		else if(eb.getAttribute('data-tag') == 'editable-curve'){
			obj.createCurve(obj);
		} else if(eb.getAttribute('data-tag') == 'drag-curve'){
			
			obj.elem = obj.getCADAncestorWhichContainsClass(obj.elem, 'cad-curve');
			obj.drag(obj);
		} else if(eb.getAttribute('data-tag') == 'drag-curve-point'){
			obj.dragPoint(obj);
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
			obj.telem.style.zIndex =  (parseFloat(window.getComputedStyle(obj.elem, null).getPropertyValue("zIndex")) || 0) + 1;
			
			obj.telem.id = 'cad-'+ (++obj.idCounter);
			var telemid = obj.idCounter;
			var parentid = parseFloat(obj.elem.id.substr(4)); // 4 to last

			obj.CADAsNodes.push(new CADNode(telemid, obj.CADAsNodes[parentid]));
		}
		var x = Math.min(start.x, end.x);
		var y = Math.min(start.y, end.y);
		var w = Math.abs(start.x - end.x);
		var h = Math.abs(start.y - end.y);

		obj.telem.style.top = (y - window.pageYOffset - obj.root.getBoundingClientRect().top) + "px";
		obj.telem.style.left = (x - window.pageXOffset - obj.root.getBoundingClientRect().left) + "px";
		obj.telem.style.width = w + "px";
		obj.telem.style.height = h + "px";
	}
	created(event, obj){
		if(obj.telem){
			obj.telem.innerHTML = CAD.iHTML;
			obj.addLines(obj.telem, obj);
		}
		obj.resetListeners(event, obj);
		console.log(obj.CADAsNodes);


		obj.telem = null;
		obj.elem = null;
	}
	createCurve(obj){
		// point -------------- point
		// 
		// CADPoint (x, y)
		// CADCurve(CADPoint1, CADPoint2, CadPointControl1, CADPointControl2)
		// We can drag the parabola by clicking on it
		// we can move the control points and points themselves
		// An Imaginary Point hub that can group some points, then they can move together
		// okay the next thing should be 
		// 
		// every cad-point has an imaginary point hub
		obj.addListener(obj.root, 'mousemove', obj.creatingCurve, obj);
		obj.addListener(obj.root, 'mouseup', obj.createdCurve, obj);
		
		

	}
	creatingCurve(event, obj){
		if(!obj.telem){
			obj.telem = document.createElement('div');
			
			obj.telem.classList.add('cad-curve');
			obj.telem.classList.add('cad');

			obj.telem.setAttribute('data-tag', 'draggable');
			obj.root.appendChild(obj.telem);
			obj.telem.style.zIndex =  (parseFloat(window.getComputedStyle(obj.elem, null).getPropertyValue("zIndex")) || 0) + 1;
			
			obj.telem.id = 'cad-'+ (++obj.idCounter);
			var telemid = obj.idCounter;
			var parentid = parseFloat(obj.elem.id.substr(4)); // 4 to last

			obj.CADAsNodes.push(new CADNode(telemid, obj.CADAsNodes[parentid]));

			var p1 = document.createElement('div');
			var p2 = document.createElement('div');
			var cp1 = document.createElement('div');
			var cp2 = document.createElement('div');
			var can = document.createElement('canvas');

			obj.p1 = p1;
			obj.p2 = p2;
			obj.cp1 = cp1;
			obj.cp2 = cp2;
			obj.can = can;

			p1.classList.add('cad-point');
			p2.classList.add('cad-point');
			cp1.classList.add('cad-point');
			cp2.classList.add('cad-point');
			can.classList.add('cad-canvas');


			p1.classList.add('cad-element');
			p2.classList.add('cad-element');
			cp1.classList.add('cad-element');
			cp2.classList.add('cad-element');
			can.classList.add('cad-element');

			p1.setAttribute('data-tag', 'drag-curve-point');
			p2.setAttribute('data-tag', 'drag-curve-point');
			cp1.setAttribute('data-tag', 'drag-curve-point');
			cp2.setAttribute('data-tag', 'drag-curve-point');
			can.setAttribute('data-tag', 'drag-curve');

			var curveId = parseFloat(obj.telem.id.substr(4));
			obj.curveId = curveId;

			var xp1 = new CADNode(++obj.idCounter, obj.CADAsNodes[curveId]);
			p1.id = 'cad-'+(obj.idCounter);

			var xp2 = new CADNode(++obj.idCounter, obj.CADAsNodes[curveId]);
			p2.id = 'cad-'+(obj.idCounter);
			
			var xcp1 = new CADNode(++obj.idCounter, obj.CADAsNodes[curveId]);
			cp1.id = 'cad-'+(obj.idCounter);

			var xcp2 = new CADNode(++obj.idCounter, obj.CADAsNodes[curveId]);
			cp2.id = 'cad-'+(obj.idCounter);

			var xcan = new CADNode(++obj.idCounter, obj.CADAsNodes[curveId]);
			can.id = 'cad-'+(obj.idCounter);
			
			obj.root.appendChild(can);
			obj.root.appendChild(p1);
			obj.root.appendChild(p2);
			obj.root.appendChild(cp1);
			obj.root.appendChild(cp2);
			
			can.style.zIndex = parseFloat(obj.telem.style.zIndex) + 1;
			p1.style.zIndex = parseFloat(obj.telem.style.zIndex) + 2;
			p2.style.zIndex = parseFloat(obj.telem.style.zIndex) + 2;
			cp1.style.zIndex = parseFloat(obj.telem.style.zIndex) + 2;
			cp2.style.zIndex = parseFloat(obj.telem.style.zIndex) + 2;

			obj.CADAsNodes.push(xcan);
			obj.CADAsNodes.push(xp1);
			obj.CADAsNodes.push(xp2);
			obj.CADAsNodes.push(xcp1);
			obj.CADAsNodes.push(xcp2);
		}
		var start = obj.start;
		var end = {
			x : event.pageX, 
			y : event.pageY,
			wpxo : window.pageXOffset,
			wpyo : window.pageYOffset
		};
		var p1 = obj.p1;
		var p2 = obj.p2;
		var cp1 = obj.cp1;
		var cp2 = obj.cp2;
		var can = obj.can;

		var x = Math.min(start.x, end.x);
		var y = Math.min(start.y, end.y);
		var w = Math.abs(start.x - end.x);
		var h = Math.abs(start.y - end.y);

		obj.telem.style.top = (y - window.pageYOffset - obj.root.getBoundingClientRect().top) + "px";
		obj.telem.style.left = (x - window.pageXOffset - obj.root.getBoundingClientRect().left) + "px";
		obj.telem.style.width = w + "px";
		obj.telem.style.height = h + "px";

		var rect = obj.telem.getBoundingClientRect();
		var roct = obj.root.getBoundingClientRect();

		p1.style.top = (rect.top - roct.top + 10)+"px";
		p1.style.left = (rect.left - roct.left + 10)+"px";

		p2.style.top = (rect.top - roct.top + rect.height - 10)+"px";
		p2.style.left = (rect.left - roct.left + rect.width - 10)+"px";
		
		cp1.style.top = (rect.top - roct.top + rect.height/2)+"px";
		cp1.style.left = (rect.left - roct.left + 10 )+"px";
		
		cp2.style.top = (rect.top - roct.top + rect.height/2)+"px";
		cp2.style.left = (rect.left - roct.left + rect.width - 10)+"px";


		obj.updateCurve(obj.curveId, obj);
	}
	createdCurve(event, obj){
		obj.addLines(obj.telem, obj);
		obj.resetListeners(event, obj);
		obj.telem = null;
	}
	updateCurve(curveId, obj){
		var a = [];
		var c = document.getElementById('cad-'+curveId)
		var p1 = document.getElementById('cad-'+(curveId+1));
		var p2 = document.getElementById('cad-'+(curveId+2));
		var cp1 = document.getElementById('cad-'+(curveId+3));
		var cp2 = document.getElementById('cad-'+(curveId+4));
		var can = document.getElementById('cad-'+(curveId+5));
		var rect = c.getBoundingClientRect();
		var roct = obj.root.getBoundingClientRect();
		function getPx(str){
			return parseFloat(str.substr(0, str.length-2));
		}
		var xmin, xmax, ymin, ymax, w, h;

		xmin = Math.min(getPx(p1.style.left), getPx(p2.style.left));
      xmin = Math.min(xmin, getPx(cp1.style.left));
      xmin = Math.min(xmin, getPx(cp2.style.left));

      xmax = Math.max(getPx(p1.style.left), getPx(p2.style.left));
      xmax = Math.max(xmax, getPx(cp1.style.left));
      xmax = Math.max(xmax, getPx(cp2.style.left));

      
      ymin = Math.min(getPx(p1.style.top), getPx(p2.style.top));
      ymin = Math.min(ymin, getPx(cp1.style.top));
      ymin = Math.min(ymin, getPx(cp2.style.top));

      ymax = Math.max(getPx(p1.style.top), getPx(p2.style.top));
      ymax = Math.max(ymax, getPx(cp1.style.top));
      ymax = Math.max(ymax, getPx(cp2.style.top));

      xmax += 10;
      ymax += 10;
      xmin -= 10;
      ymin -= 10;

      w = xmax - xmin;
      h = ymax - ymin;
      


      c.style.width = w + "px";
      c.style.height = h + "px";
      c.style.top = ymin + "px";
      c.style.left = xmin + "px";


		can.width = w;
		can.height = h;
      can.style.top = ymin + "px";
      can.style.left = xmin + "px";
		
		var ctx = can.getContext('2d');


	   ctx.fillStyle = 'transparent';
	   ctx.fillRect(0,0, can.width, can.height);

		function computeCoordinates(p){ // of a with relative to b

			var px = parseFloat(p.style.left.substr(0, p.style.left.length-2));
			var py = parseFloat(p.style.top.substr(0, p.style.top.length-2));
			px -= (rect.left - roct.left);
			py -= (rect.top - roct.top);
			return [px, py];
		}
		var a = [...computeCoordinates(p1), ...computeCoordinates(p2), ...computeCoordinates(cp1), ...computeCoordinates(cp2)];

		for(var i=0;i<a.length;i++){
			a[i]+=5;
		}
		ctx.beginPath();
		ctx.strokeStyle = '#000';

		ctx.moveTo(a[0], a[1]);
   	ctx.bezierCurveTo(a[4], a[5], a[6], a[7], a[2], a[3]);

   	ctx.stroke();

   	ctx.beginPath();
		ctx.strokeStyle = '#aaa';

   	ctx.moveTo(a[0], a[1]);
   	ctx.lineTo(a[4], a[5]);
   	ctx.moveTo(a[6], a[7]);
   	ctx.lineTo(a[2], a[3]);
   	
   	ctx.stroke();
	}

	dragPoint(obj){
		obj.subtreeElems = [], obj.subtreeRects = [];

		var curve = obj.getCADAncestorWhichContainsClass(obj.elem, 'cad-curve');

		obj.removeLines(curve, obj);

		obj.elemsinTree(parseFloat(obj.elem.id.substr(4)), obj.subtreeElems, obj.subtreeRects, curve);

		for(var i=0;i<obj.subtreeElems.length;i++){
			obj.subtreeElems[i].style.zIndex = CAD.LIMIT + obj.subtreeRects[i].d;
		}
		obj.curveId = parseFloat(curve.id.substr(4));



		obj.addListener(obj.root, 'mousemove', obj.draggingPoint, obj);
		obj.addListener(obj.root, 'mouseup', obj.draggedPoint, obj);
	}
	draggingPoint(event, obj){
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
		for (var i = 0; i < 1; i++) {
			obj.subtreeElems[i].style.top = (obj.subtreeRects[i].y + delta.y - obj.root.getBoundingClientRect().top - window.pageYOffset) + 'px';// + delta.wpxo);
			obj.subtreeElems[i].style.left = (obj.subtreeRects[i].x + delta.x - obj.root.getBoundingClientRect().left - window.pageXOffset) + 'px';// + delta.wpyo);
		}
		obj.updateCurve(obj.curveId, obj);
	}
	draggedPoint(event, obj){
		obj.addLines(document.getElementById('cad-'+obj.curveId), obj);
		for(var i=0;i<obj.subtreeElems.length;i++){
			var pid = obj.CADAsNodes[parseFloat(obj.subtreeElems[i].id.substr(4))].parent.id;
			obj.subtreeElems[i].style.zIndex = (parseFloat(document.getElementById('cad-'+pid).style.zIndex) || 0) + 1 + obj.subtreeRects[i].d;
		}	
		obj.resetListeners(event, obj);
		obj.elem = null;
	}
	drag(obj){		
		//we will hide every element in it's subtree
		obj.subtreeElems = [], obj.subtreeRects = [];

		obj.elemsinTree(parseFloat(obj.elem.id.substr(4)), obj.subtreeElems, obj.subtreeRects);

		for(var i=0;i<obj.subtreeElems.length;i++){
			obj.removeLines(obj.subtreeElems[i], obj);
			obj.subtreeElems[i].style.zIndex = CAD.LIMIT + obj.subtreeRects[i].d;
		}

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
		for (var i = 0; i < obj.subtreeElems.length; i++) {
			obj.subtreeElems[i].style.top = (obj.subtreeRects[i].y + delta.y - obj.root.getBoundingClientRect().top - window.pageYOffset) + 'px';// + delta.wpxo);
			obj.subtreeElems[i].style.left = (obj.subtreeRects[i].x + delta.x - obj.root.getBoundingClientRect().left - window.pageXOffset) + 'px';// + delta.wpyo);
		}
		
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
			obj.snapToElemEdges(obj.elem, obj);

		} else if(obj.snapMode == 'grid-lines'){
			obj.snapToGridLines(obj.elem, obj);
		}
	}
	snapToGridLines(elem, obj){
		var eLines = obj.getLines(elem);

		var distance = new Array(4);
		var nearest = new Array(4);
		for(var i = 0; i < 3; i++){
			nearest[i] = obj.getNearestGridLine(eLines[i]);
			distance[i] = Math.abs(eLines[i] - nearest[i]);
		}
		
		for(var i = 3; i < 6; i++){
			nearest[i] = obj.getNearestGridLine(eLines[i]);
			distance[i] = Math.abs(eLines[i] - nearest[i]);
		}
		
		var mindistance = CAD.LIMIT, minline = 0;
		for (var i = 2; i >= 0; i--) {
			if(distance[i] < mindistance){
				mindistance = distance[i];
				minline = i;
			}
		}
		var delta = {};
		if(mindistance <= obj.pq){
			if(minline == 0){
				delta.y = (nearest[minline] ) ;
			} else if(minline == 1){
				delta.y = (nearest[minline] - elem.getBoundingClientRect().height );
			} else {
				delta.y = (nearest[minline] - elem.getBoundingClientRect().height/2 );
			}
		}
		mindistance = CAD.LIMIT, minline = 2;
		for (var i = 5; i >= 3; i--) {
			if(distance[i] < mindistance){
				mindistance = distance[i];
				minline = i;
			}
		}
		if(mindistance <= obj.pq){
			if(minline == 3){
				delta.x = (nearest[minline] );
			} else if(minline == 4){
				delta.x = (nearest[minline] - elem.getBoundingClientRect().width );
			} else {
				delta.x = (nearest[minline] - elem.getBoundingClientRect().width/2  );
			}
		}
		delta.y -= (obj.elem.getBoundingClientRect().top + window.pageYOffset);
		delta.x -= (obj.elem.getBoundingClientRect().left + window.pageXOffset);


		for (var i = 0; i < obj.subtreeElems.length; i++) {
			var sy = obj.subtreeElems[i].style.top;
			var sx = obj.subtreeElems[i].style.left;
			sy = parseFloat(sy.substr(0, sy.length-2));
			sx = parseFloat(sx.substr(0, sx.length-2));
				
			obj.subtreeElems[i].style.top = (sy + delta.y ) + 'px';// + delta.wpxo);
			obj.subtreeElems[i].style.left = (sx + delta.x ) + 'px';// + delta.wpyo);
		}
	}
	snapToElemEdges(elem, obj){ //just telem, elem
		var eLines = obj.getLines(elem); // (top, bottom, left, right)
		
		var distance = new Array(4);
		var nearest = new Array(4);
		for(var i = 0; i < 3; i++){
			nearest[i] = obj.linesX.getNearest(eLines[i]);
			distance[i] = Math.abs(eLines[i] - nearest[i]);
		}
		
		for(var i = 3; i < 6; i++){
			nearest[i] = obj.linesY.getNearest(eLines[i]);
			distance[i] = Math.abs(eLines[i] - nearest[i]);
		}
		
		var mindistance = CAD.LIMIT, minline = 0;
		for (var i = 2; i >= 0; i--) {
			if(distance[i] < mindistance){
				mindistance = distance[i];
				minline = i;
			}
		}
		var delta = {};
		if(mindistance <= obj.pq){
			if(minline == 0){
				delta.y = (nearest[minline] ) ;
			} else if(minline == 1){
				delta.y = (nearest[minline] - elem.getBoundingClientRect().height );
			} else {
				delta.y = (nearest[minline] - elem.getBoundingClientRect().height/2 );
			}
		}
		mindistance = CAD.LIMIT, minline = 2;
		for (var i = 5; i >= 3; i--) {
			if(distance[i] < mindistance){
				mindistance = distance[i];
				minline = i;
			}
		}
		if(mindistance <= obj.pq){
			if(minline == 3){
				delta.x = (nearest[minline] );
			} else if(minline == 4){
				delta.x = (nearest[minline] - elem.getBoundingClientRect().width );
			} else {
				delta.x = (nearest[minline] - elem.getBoundingClientRect().width/2  );
			}
		}
		delta.y -= (obj.elem.getBoundingClientRect().top + window.pageYOffset);
		delta.x -= (obj.elem.getBoundingClientRect().left + window.pageXOffset);


		for (var i = 0; i < obj.subtreeElems.length; i++) {
			var sy = obj.subtreeElems[i].style.top;
			var sx = obj.subtreeElems[i].style.left;
			sy = parseFloat(sy.substr(0, sy.length-2));
			sx = parseFloat(sx.substr(0, sx.length-2));
				
			obj.subtreeElems[i].style.top = (sy + delta.y ) + 'px';// + delta.wpxo);
			obj.subtreeElems[i].style.left = (sx + delta.x ) + 'px';// + delta.wpyo);
		}
		// console.log(distance, obj.pq, mindistance);
	}
	dragged(event, obj){
		for(var i=0;i<obj.subtreeElems.length;i++)
			obj.subtreeElems[i].style.visibility = "hidden";

		var eb = document.elementFromPoint(event.clientX, event.clientY);
		
		for(var i=0;i<obj.subtreeElems.length;i++)	
			obj.subtreeElems[i].style.visibility = "visible";
		

		var ebid = parseFloat(eb.id.substr(4));
		var elid = parseFloat(obj.elem.id.substr(4));

		obj.CADAsNodes[elid].makeChildOf(obj.CADAsNodes[ebid]);

		for(var i=0;i<obj.subtreeElems.length;i++){
			obj.addLines(obj.subtreeElems[i], obj);
			obj.subtreeElems[i].style.zIndex = (eb.style.zIndex || 0) + 1 + obj.subtreeRects[i].d;
		}

		obj.resetListeners(event, obj);
		console.log(obj.CADAsNodes);

		obj.elem = null;
	}

	getLines(elem){
		var rect = elem.getBoundingClientRect();
		return [
			rect.top + window.pageYOffset,
			rect.top + window.pageYOffset + rect.height,
			rect.top + window.pageYOffset + rect.height/2,
			rect.left + window.pageXOffset,
			rect.left + window.pageXOffset + rect.width,
			rect.left + window.pageXOffset + rect.width/2
		];
	}
	addLines(elem, obj){
		if(! elem.classList.contains('cad')) return;
		var rect = elem.getBoundingClientRect();
		obj.linesX.insert(rect.top + window.pageYOffset);
		obj.linesX.insert(rect.top + window.pageYOffset + rect.height);
		obj.linesX.insert(rect.top + window.pageYOffset + rect.height/2);
		obj.linesY.insert(rect.left + window.pageXOffset);
		obj.linesY.insert(rect.left + window.pageXOffset + rect.width);
		obj.linesY.insert(rect.left + window.pageXOffset + rect.width/2);
		obj.drawLines(obj);
	}
	removeLines(elem, obj){
		if(! elem.classList.contains('cad')) return;
		var rect = elem.getBoundingClientRect();
		obj.linesX.remove(rect.top + window.pageYOffset);
		obj.linesX.remove(rect.top + window.pageYOffset + rect.height);
		obj.linesX.remove(rect.top + window.pageYOffset + rect.height/2);
		obj.linesY.remove(rect.left + window.pageXOffset);
		obj.linesY.remove(rect.left + window.pageXOffset + rect.width);
		obj.linesY.remove(rect.left + window.pageXOffset + rect.width/2);
		obj.drawLines(obj);
	}
	drawLines(obj){
		var canvas = document.getElementById('drawlines');
		var ctx = canvas.getContext('2d');
		canvas.width = document.getElementsByClassName("fc")[0].getBoundingClientRect().width ;//+ 'px';
		canvas.height = document.getElementsByClassName("fc")[0].getBoundingClientRect().height ;//+ 'px';
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		var linesX = this.linesX.gimmeArray();
		var linesY = this.linesY.gimmeArray();

		for (var i = linesX.length - 1; i >= 0; i--) {
			ctx.moveTo(0, linesX[i]-obj.root.getBoundingClientRect().top-window.pageYOffset);
			ctx.lineTo(canvas.width, linesX[i]-obj.root.getBoundingClientRect().top-window.pageYOffset);
		}
		for (var i = linesY.length - 1; i >= 0; i--) {
			ctx.moveTo(linesY[i]-obj.root.getBoundingClientRect().left-window.pageXOffset, 0);
			ctx.lineTo(linesY[i]-obj.root.getBoundingClientRect().left-window.pageXOffset, canvas.height);
		}
		ctx.stroke();
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

	elemsinTree(nodeId, response = [], rect = [], ref = null){
		
		var el = document.getElementById('cad-'+nodeId);
		if(ref === null) ref = el;

		var re = el.getBoundingClientRect();
		
		response.push(el); //nodeId is basically a CADNode id
		var rec = {
			x : re.left + window.pageXOffset, 
			y : re.top + window.pageYOffset, 
			w : re.width, 
			h : re.height,
			d : parseFloat(el.style.zIndex) - parseFloat(ref.style.zIndex)
		};
		
		rect.push(rec);

		if(this.CADAsNodes[nodeId].children)
		for (var i = 0; i < this.CADAsNodes[nodeId].children.length; i++) {
			this.elemsinTree(this.CADAsNodes[nodeId].children[i], response, rect, ref);
		}
	}
	getNearestGridLine(line){
		//gridsize
		this.gridpixel = this.gridpixel || 70;
		var gline = line/this.gridpixel;
		return Math.round(gline) * this.gridpixel;
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