window.onload = async function(){
   await engine.processRequest('CAD', {elem:document.getElementsByClassName('fc')[0], proximityQ:20})
}