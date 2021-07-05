var c, ctx;

function makeCurve(a){
   ctx.moveTo(a[0], a[1]);
   ctx.bezierCurveTo(a[4], a[5], a[6], a[7], a[2], a[3]);
}

function doit(){
   ctx.fillStyle = 'white';
   ctx.fillRect(0,0, c.width, c.height);
   ctx.fillStyle  = 'black';
   

   ctx.beginPath();     
   ctx.lineWidth=3;
   var els = document.getElementsByTagName('INPUT');
   var a = new Array(els.length);

   for(var i=0;i<els.length;i++){
      a[i] = els[i].value;
   }
   
   ctx.strokeText( ".", a[4], a[5]);
   ctx.strokeText( ".", a[6], a[7]);

   makeCurve(a);
   ctx.stroke();
}
window.onload = function(){
   c = document.getElementById('fc');
   ctx = c.getContext('2d');
   setInterval(doit, 50);
}