
class MultisetUtil{
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
var Multiset = function () {return new MultisetUtil();}

var elemById = {objectModel:'document', method:'getElementById'};
var elemByPoint = {objectModel:'document', method:'elementFromPoint'};
var createElem = {
   objectModel:'document',
   method:'createElement',
   arguments:'div',
   response:'__elem',
   callback:[
      {
         
         objectModel:'document',
         method:'appendChild',

         
      }
      //do Everything else here
   ]
}
var CADGetId = [ // (obj, elem)
   {
      condition: '$!l.elem',
      callback:{
         objectModel:'console',
         method:'log',
         arguments:['$l.obj.idCounter']
      },
      return:'$ (++ l.obj.idCounter)'
   }, 
   {
      condition: '$l.elem',
      declare:{
         cadid: '$l.elem.id'
      },
      objectModel:'$l.elem.id',
      method:'substr',
      arguments:4,
      response:'cadid2',
      // callback:{
      //    objectModel:'console',
      //    method:'log',
      //    arguments: ['CADGetId[1]', '$l.cadid2']
      // },
      return:'$l.cadid2'
   }
]
var CADNodeMakeChildOf = { //{obj:CADNode(this), parent:CADNode}
   objectModel: '$l.obj.parent.children',
   method:'indexOf',
   arguments: '$l.obj.id',
   response: 'childrenindex',
   callback:{
      objectModel: '$l.obj.parent.children',
      method: 'splice',
      arguments:['$l.childrenindex', 1],
      callback:{
         declare: {
            obj:{
               parent:'$l.parent'
            }
         },
         callback:{
            objectModel:'$l.parent.children',
            method:'push',
            arguments:'$l.obj.id'
         }
      }
   }
};

var CADNode = { //(id:number, parent:CADNode)
   
   declare: {
      makeChildOf : 'CADNodeMakeChildOf',
      children:[]
   },
   callback:{
      condition: '$l.parent',
      objectModel:'$l.parent.children',
      method:'push',
      arguments:'$l.id',
      callback:{
         objectModel:'console',
         method:'log',
         arguments:['Created node  with ', '$l']
      }
   },
   return: '$l' 
}
var CADIhtml = `
         <select class = "cad-menu">
            <option value = "editable" selected>Editable</option>
            <option value = "draggable">Draggable</option>
         </select>
      `;
var CAD = { // constructor(elem:HTMLObject, proximityQ:number)
   declare:{

      //properties

      root: '$l.elem',
      pq: '$l.proximityQ',
      snapMode:'elem-edges',
      CADAsNodes:[],
      idCounter:0,
      obj:'$l',

      //functions

      mousedown:'CADMouseDown',
      create:'CADCreate',
      creating:'CADCreating',
      created:'CADCreated',
      drag:'CADDrag',
      dragging:'CADDragging',
      dragged:'CADDragged',
      snap:'CADSnap',
      snapToElemEdges:'CADSnapToElemEdges',
      getLines:'CADGetLines',
      addLines:'CADAddLines',
      removeLines:'CADRemoveLines',
      drawLines: 'CADDrawLines',           //baad mein

      resetListeners:'CADResetListeners'
   },
   callback: [ //properties which require some function call
      {
         declare:{
            root:{
               id:'cad-0'
            }
         },
         objectModel:'$l.root.classList',
         method:'add',
         arguments:'cad'
      },
      {
         objectModel:'$l.root',
         method:'setAttribute',
         arguments:['data-tag', 'editable']
      },
      {
         objectModel:'engine',
         method:'processRequest',
         arguments:['CADNode', {id:0}, true],
         response:'nodething',
         callback:{
            objectModel:'$l.CADAsNodes',
            method:'push',
            arguments: '$l.nodething'
         }
      },
      {
         objectModel:'window',
         method:'Multiset',
         response: 'linesX'
      },
      {
         objectModel:'window',
         method:'Multiset',
         response:'linesY'
      },
      // {
      //    declare:{
      //          args4:{
      //             elem : '$l.obj.root',
      //             obj : '$l.obj'
      //          }
      //       }
      //    objectModel:'engine',
      //    method:'processRequest',
      //    arguments:['$l.obj.addLines', '$l.args4', true]
      // },
      {
         declare:{
            args:{
               obj:'$l.obj'
            }
         },
         objectModel:'eventManager',
         method:'addRequestListener',
         arguments:['$l.obj.root', 'mousedown', '$l.obj.mousedown', '$l.args']
      }
   ]
}
var CADMouseDown = { //(event:Event, obj:obj)
   declare :{
      obj:{
         start:{
            x: '$l.event.pageX',
            y: '$l.event.pageY',
            wpxo: '$window.pageXOffset',
            wpyo: '$window.pageYOffset'
         }
      },
      start : '$l.obj.start'
   },
   callback: {
      extends:'elemByPoint',
      arguments:['$l.start.x - window.pageXOffset', '$l.start.y - window.pageYOffset'],
      response:'eb',
      callback:{
         declare:{
            obj:{
               elem:'$l.eb'
            }
         },
         callback:{
            objectModel:'$l.obj.elem',
            method:'getBoundingClientRect',
            response:'rect',
            callback:{
               declare:{
                  obj:{
                     rect:{
                        x : '$l.rect.left + window.pageXOffset', 
                        y : '$l.rect.top + window.pageYOffset', 
                        w : '$l.rect.width', 
                        h : '$l.rect.height'
                     }
                  }
               },
               objectModel:'$l.eb',
               method:'getAttribute',
               arguments:'data-tag',
               response:'ebga',
               callback:[
                  {
                     condition:'$(l.ebga == "editable")',
                     declare:{
                        args:{
                           obj: '$l.obj'
                        }
                     },
                     objectModel:'engine',
                     method:'processRequest',
                     arguments: ['$l.obj.create', '$l.args', true]
                  },
                  // {
                  //    condition:'$(l.ebga == "draggable")',
                  //    objectModel:'$l.obj',
                  //    method:'drag',
                  //    arguments: '$l.obj'
                  // }

               ]
            }
         }
      }
   }
}
var CADCreate = [ //(obj)
   {
      objectModel:'eventManager',
      method:'addRequestListener',
      arguments:['$l.obj.root', 'mousemove', '$l.obj.creating', '$l.obj']
   },
   {
      objectModel:'eventManager',
      method:'addRequestListener',
      arguments:['$l.obj.root', 'mouseup', '$l.obj.created', '$l.obj']
   }
];
var CADCreating = {//(event, obj)
   declare:{
      start:'$l.obj.start',
      end:{
         x:'$l.event.pageX',
         y:'$l.event.pageY',
         wpxo: '$window.pageXOffset',
         wpyo: '$window.pageYOffset'
      }
   },
   callback:[
      // {
      //    objectModel:'console', 
      //    method:'log',
      //    arguments:'$l'
      // },
      {
         condition: '$(!l.obj.telem)',
         extends:'createElem',
         response:'telem',
         callback:[
            {
               objectModel:'$l.root',
               //appending element here
               arguments:'$l.telem',   
               declare:{
                  obj:{
                     telem: '$l.telem'
                  }
               },
               // callback:{
               //    objectModel:'console',
               //    method:'log',
               //    arguments:'L325 runs'
               // }
            },
            {
               objectModel:'$l.obj.telem.classList',
               method:'add',
               arguments:'cad'
            },
            {
               objectModel:'$l.obj.telem',
               method:'setAttribute',
               arguments:['data-tag', 'editable']
            }, 
            {
               declare:{
                  obj:{
                     telem:{
                        style:{
                           zIndex: '$ (l.obj.elem.style.zIndex || 0) + 1'
                        }
                     }
                  }
               },
               // callback:{
               //    objectModel:'console',
               //    method:'log',
               //    arguments:["Setting zIndex on ", '$l.obj.telem', " to ", "$ (l.obj.elem.style.zIndex || 0) + 1"]
               // }
            },
            {
               declare:{
                  args:{
                     obj:'$l.obj'
                  }
               },
               objectModel:'engine',
               method:'processRequest',
               arguments:['CADGetId', '$l.args'],
               response:'cadid',
               callback:{
                  objectModel:'engine',
                  method:'processRequest',
                  declare:{
                     args1:{
                        elem:'$l.obj.elem',
                        obj:'$l.obj'
                     }
                  },
                  arguments:['CADGetId', '$l.args1'],
                  response:'pcadid',
                  callback:{
                     declare:{
                        args2:{
                           id:'$l.cadid[0]',
                           parent:'$l.obj.CADAsNodes[l.pcadid[1]]'
                        },
                        obj:{
                           telem:{
                              id:'$"cad-" + l.cadid[0]'
                           }
                        }
                     },
                     objectModel:'engine',
                     method:'processRequest',
                     arguments:['CADNode', '$l.args2', true],
                     response:'nodething',
                     callback:{
                        objectModel:'$l.CADAsNodes',
                        method:'push',
                        arguments: '$l.nodething',
                        callback:{
                           objectModel:'console',
                           method:'log',
                           arguments:["Pushed to cadas nodes" ,'$l.CADAsNodes', "with", "$l.args2"]
                        },
                        passStates:false
                     },
                     passStates:false
                  }
               }
            }
         ],
         passStates:false
      },
      {
         declare:{
            x: '$Math.min(l.start.x, l.end.x)',
            y: '$Math.min(l.start.y, l.end.y)',
            w: '$Math.abs(l.start.x - l.end.x)',
            h: '$Math.abs(l.start.y - l.end.y)',
            
         },
         objectModel:'$l.obj.root',
         method:'getBoundingClientRect',
         response:'rect6',
         callback:{
            declare:{
               obj:{
                  telem:{
                     style:{
                        top: '$(l.y - l.rect6.top - window.pageYOffset) + "px"',
                        left: '$(l.x - l.rect6.left - window.pageXOffset) + "px"',
                        width: '$l.w + "px"',
                        height: '$l.h + "px"'
                     }
                  }
               }
            }
         }
      }
   ]
};
var CADCreated = [ //(event, obj)
   {
      condition:'$l.obj.telem',
      declare:{
         obj:{
            telem:{
               innerHTML:'$CADIhtml'
            }
         },
         args4:{
            elem : '$l.obj.root',
            obj : '$l.obj'
         }
      },
      // objectModel:'engine',
      // method:'processRequest',
      // arguments:['$l.obj.addLines', '$l.args4', true]
   },
   {
      declare:{
         args1:{
            event:'$l.event', 
            obj: '$l.obj'
         }
      },
      // callback:{
         objectModel:'console',
         method:'log',
         arguments:'$l.args1',
      // }
      callback:{
         objectModel:'engine',
         method:'processRequest',
         arguments:['$l.obj.resetListeners', '$l.args1', true],
         callback:{
            declare:{
               obj:{
                  telem:null,
                  elem:null
               }
            }
         }
      }
   }
];
var CADResetListeners = [ //(event, obj)
   {
      objectModel:'eventManager',
      method:'removeElemListener',
      arguments:['$l.obj.root', 'mousemove'],
   },
   {
      objectModel:'eventManager',
      method:'removeElemListener',
      arguments:['$l.obj.root', 'mouseup'],
   }
]
var CADDrag = [ //obj
   {
      declare:{
         args6:{
            elem:'$l.obj.elem',
            obj:'$l.obj'
         },
         obj:{
            subtreeElems:[],
            subtreeRects:[]
         }
      },
      objectModel:'engine',
      method:'processRequest',
      arguments:['$l.obj.removeLines', '$l.args6', true]
   },
   {
      declare:{
         args7:{
            elem:'$l.obj.elem'
         }
      },
      objectModel:'engine',
      method:'processRequest',
      arguments:['CADGetId','$l.args7'],
      response:'cadid',
      callback:{
         declare:{
            args8:{
               nodeId: '$l.cadid[1]',
               response: '$l.obj.subtreeElems',
               rect: '$l.subtreeRects',
            }
         },
         objectModel:'engine',
         method:'processRequest',
         arguments:['$l.obj.elemsinTree', '$l.args8']
      }
   },
   {
      objectModel:'eventManager',
      method:'addRequestListener',
      arguments:['$l.obj.root', 'mousemove', '$l.obj.dragging', '$l.obj']
   },
   {
      objectModel:'eventManager',
      method:'addRequestListener',
      arguments:['$l.obj.root', 'mouseup', '$l.obj.dragged', '$l.obj']
   }
]
var CADDragging = { //(event, obj)
   declare:{
      start:'$l.obj.start',
      end:{
         x:'$l.event.pageX',
         y:'$l.event.pageY',
         wpxo: '$window.pageXOffset',
         wpyo: '$window.pageYOffset'
      },
      delta:{
         x:'$l.end.x - l.start.y',
         y:'$l.end.y - l.start.y',
         wpxo: '$l.end.wpxo - l.start.wpxo',
         wpyo: '$l.end.wpyo - l.start.wpyo'
      },
      i : -1,
      pos:{
         x : '$l.obj.rect.x + l.delta.x', 
         y : '$l.obj.rect.y + l.delta.y',
         w : '$l.obj.rect.w',
         h : '$l.obj.rect.h'
      }
   },
   callback:[
      {
         loop:'$l.obj.subtreeElems.length',
         declare:{
            i : '$l.i + 1',
            obj:{
               subtreeElems:{
                  '$l.i':{
                     style:{
                        top: '$(l.obj.subtreeRects[l.i].y + l.delta.y) + "px"',
                        left: '$(l.obj.subtreeRects[l.i].x + l.delta.x) + "px"',
                     }
                  }
               }
            }
         }
      },
      {
         declare:{
            args9:{
               pos : '$l.pos',
               obj : '$l.obj'
            }
         },
         objectModel:'engine',
         method:'processRequest',
         arguments:['$l.obj.snap', '$l.args9']
      }
   ]
}

window.onload = function(){
   //doThisOnce();
   var cad = engine.processRequest('CAD', {elem:document.getElementsByClassName('fc')[0], proximityQ:10});
}