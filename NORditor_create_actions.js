/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

/* Creates events for svg, monomer and bonds (graph edges). Editor only.*/

/* draws a monomer at coordinates of a mouse click with associated events
 - event : event handler js object
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
*/
function svgClickHandler(event, menuAtts, allMonomerLists, graphicAtt, interfaceElem)
{
 if(menuAtts.activeMonomer != '')
 {
  if((msieversion()==0)||(msieversion()>11))
  {
   cursorX = event.pageX - $('#'+interfaceElem.parentDivId+' .svg_window').offset().left;
   cursorY = event.pageY - $('#'+interfaceElem.parentDivId+' .svg_window').offset().top;
  }
  else
  {
   cursorX = event.clientX + document.documentElement.scrollLeft - $('#'+interfaceElem.parentDivId+' .svg_window').offset().left;
   cursorY = event.clientY + document.documentElement.scrollTop - $('#'+interfaceElem.parentDivId+' .svg_window').offset().top;   
  }
  
  makeMonomerAtCoordinates(cursorX, cursorY, menuAtts, allMonomerLists, graphicAtt, interfaceElem); 
 } 
}
/* draws a monomer at coordinates cursorX and cursorY with associated events
 - cursorX and cursorY: coordinates X and Y where monomer will be drawn
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or imput fields
*/
function makeMonomerAtCoordinates(cursorX, cursorY, menuAtts, allMonomerLists, graphicAtt, interfaceElem)
{
 if (cursorX > (graphicAtt.svgWidth - graphicAtt.rectMainWidth/2 - graphicAtt.squareSmallDim/2)) 
   cursorX = graphicAtt.svgWidth - graphicAtt.rectMainWidth/2 - graphicAtt.squareSmallDim/2;
  else if(cursorX < graphicAtt.rectMainWidth/2) cursorX = graphicAtt.rectMainWidth/2;
 if (cursorY > (graphicAtt.svgHeight - graphicAtt.rectMainHeight/2 - graphicAtt.squareSmallDim/2)) 
   cursorY =  graphicAtt.svgHeight - graphicAtt.rectMainHeight/2 - graphicAtt.squareSmallDim/2;
  else if(cursorY < graphicAtt.rectMainHeight/2 + graphicAtt.squareSmallDim/2) 
   cursorY = graphicAtt.rectMainHeight/2 + graphicAtt.squareSmallDim/2;
  // raise the total count of monomers 
  allMonomerLists.nodeNum++;
  // calls function creating 'chasis' of monomer and all of actions
  addMonomer(cursorX, cursorY, menuAtts, allMonomerLists, graphicAtt, interfaceElem); //cf. NORditor_create_base.js
  // deselect after one click unless Ctrl is held
   	 
 if(!menuAtts.conserveMonomers)
 {	  
  d3.select('#'+interfaceElem.parentDivId).selectAll('p.editor_menuItemSelected').attr('class', 'editor_menuItem');
  menuAtts.activeMonomersList = [];
  menuAtts.activeMonomer = '';
  interfaceElem.activeMonomerField.value = '';
  graphicAtt.color = [];
 }
 else
 {
  // refresh from monomer list in case drag was used	 
  menuAtts.activeMonomer = monomerList2Str(menuAtts.activeMonomersList);	 
 }
}

/* updates lists and draws monomers with associated events
 - cursorX and cursorY: coordinates X and Y where monomer will be drawn
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or imput fields
*/
function addMonomer(cursorX, cursorY, menuAtts, allMonomerLists, graphicAtt, interfaceElem)
{
 // add new monomer to every list
 allMonomerLists.monomerList.push(menuAtts.activeMonomer); 
 allMonomerLists.indexList.push(allMonomerLists.nodeNum); 	
 allMonomerLists.edgeList.push([]);		// placeholder for list of edges
 // update text field
 graphToNOR(allMonomerLists, interfaceElem.outputField,interfaceElem.exterNORField);
 // obtain list of colors which will be used
 var colorPalette = graphicAtt.color.slice(); // prevent pointer copying
 if(menuAtts.dragged && (graphicAtt.colorDragged!= '')) colorPalette.push(graphicAtt.colorDragged);
 allMonomerLists.color.push(colorPalette);
 var monomer = createMonomerBase(cursorX, cursorY, menuAtts.activeMonomer, allMonomerLists, graphicAtt, interfaceElem.svgId);
 
 createMonomerActions(monomer, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
}

/* creates buttons and adds events to the monomer
 - gMono : group holding monomer
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
***
Monomer is created completely by two separate functions, one creates its base elements (main group, main rectangle,
its name and title - look lower for further explication), other makes buttons and adds all of events. 
***
Monomer representation consists of group having unique id in form of monomer_n, with n>=0. This group contains 
rectangle ('rect') (class 'main_part') as main body of monomer, 'text' holding its name (with 'tspan' per line
of text up to 4) and three other groups - one per button - which each contains another 'rect' and an elements
representing a symbol/text on it. Every movable element (those with some kind of 'x' and 'y' attributes) has 
class 'monomer_movable'. These are drawn on (upper) nodeLayer.
***
edge is a group, having a 'line' and another group rassembling 'rect' and 'text' for its child. They are drawn
on ('lower') edgeLayer.
*/
function createMonomerActions(gMono, menuAtts, allMonomerLists, graphicAtt, interfaceElem)
{
 gMono.on('click', function(){	
  d3.event.stopPropagation();
 });	
 // select svg	
 var svg = document.getElementById(interfaceElem.svgId);

 // select layer containing nodes
 var nodeLayer = d3.select('#'+interfaceElem.svgId).select('.nodeLayer'); 

 // select main group of monomer
 var rectMono = gMono.select('.main_element');
 var monomerText = gMono.select('text');
 var monomerTitle = gMono.select('title');

 // get position of the middle of monomer
 var coordinatesX = parseInt(rectMono.attr('x')) + graphicAtt.rectMainWidth/2;
 var coordinatesY = parseInt(rectMono.attr('y')) + graphicAtt.rectMainHeight/2;
  
 // adds onclick event to main rectangle (clicking stages it for moving)
 rectMono.style('cursor', 'move');
 
 /* values of next variables are set in ondragstart. Then they are compared
  with actual cursor coordinates. If there is bigger difference than 10 px
  between either coordinate, drag is actived (and click disabled). This is
  to preven some annoyances when wanting to click and making small move, which
  gets then registered as drag */
 var dragX;
 var dragY;

 // adds drag behavior to main group (rassembling monomers)
 var drag = d3.behavior.drag().on('dragstart', function(){
  dragX = d3.mouse(svg)[0];
  dragY = d3.mouse(svg)[1]; 
 }).on('drag', function(){
  var newDragX = d3.mouse(svg)[0];
  var newDragY = d3.mouse(svg)[1];
  // if move big enough then drag, not click
  if((Math.abs(newDragX-dragX)>10)
   || (Math.abs(newDragY-dragY)>10)) 
  {	 
   interfaceElem.clickCancel = true;
   dragAlong(this, menuAtts, graphicAtt, interfaceElem);
  } 
 });
 
 // adds onclick function to group
 rectMono.call(drag);
 
 // saving pointer to drag behavior to restore it later in case it's switched off
 var dragCallBack = rectMono.property('__onmousedown.drag')['_'];
	
 // coordinates of certain borders of main body
 var mainRightBorder =  coordinatesX + graphicAtt.rectMainWidth/2;
 var mainTopBorder = coordinatesY - graphicAtt.rectMainHeight/2;
 var mainBottomBorder = coordinatesY + graphicAtt.rectMainHeight/2;

 // create group holding elements representing 'delete' button
 var deleteGroup = gMono.append('g').attr('class', 'delete_element')
					.style('display', 'none')
					.style('cursor', 'pointer');
 // create "delete" square
 var rectDelete = deleteGroup.append('rect')
  .attr('x', mainRightBorder - graphicAtt.squareSmallDim/2)
  .attr('y', mainTopBorder - graphicAtt.squareSmallDim/2)
  .attr('height', graphicAtt.squareSmallDim)
  .attr('width', graphicAtt.squareSmallDim)
  .attr('class', 'monomer_movable')
  .style('fill', 'rgb(255, 255, 255)')
  .style('stroke-width','1px')
  .style('stroke', 'rgb(0, 0, 0)');

 // create red delete cross (line x2)
 var redline = deleteGroup.append('line')
  .attr('x1', mainRightBorder - graphicAtt.squareSmallDim/2 + 3)
  .attr('y1', mainTopBorder - graphicAtt.squareSmallDim/2 + 3)
  .attr('x2', mainRightBorder + graphicAtt.squareSmallDim/2 - 3)
  .attr('y2', mainTopBorder + graphicAtt.squareSmallDim/2 - 3)
  .attr('class', 'monomer_movable')
  .style('stroke-width','2px')
  .style('stroke', 'rgb(255, 0, 0)');

 var redline = deleteGroup.append('line')
  .attr('x1', mainRightBorder + graphicAtt.squareSmallDim/2 - 3)
  .attr('y1', mainTopBorder - graphicAtt.squareSmallDim/2 + 3)
  .attr('x2', mainRightBorder - graphicAtt.squareSmallDim/2 + 3)
  .attr('y2', mainTopBorder + graphicAtt.squareSmallDim/2 - 3)
  .attr('class', 'monomer_movable')
  .style('stroke-width','2px')
  .style('stroke', 'rgb(255, 0, 0)');

 // create event deleting monomer if clicked
 deleteGroup.on('mousedown', function(){	 
  d3.event.stopPropagation();

  var nodeNumber = d3.select(this.parentNode).attr('id').split('_')[1];
				
  // removes node and connecting edges from tables
  suppressNodesAndEdges(nodeNumber, allMonomerLists, interfaceElem.outputField, interfaceElem.exterNORField);

  // removes node and connecting edges from graphic interface
  d3.select('#'+interfaceElem.svgId).selectAll('.graph_edge[starting_node=n'+nodeNumber+']').remove();
  d3.select('#'+interfaceElem.svgId).selectAll('.graph_edge[ending_node=n'+nodeNumber+']').remove();
  gMono.remove();	
 })
  .on('mouseover', function(){	// flashing in yellow on mouseover
   rectDelete.style('fill', 'yellow');
 })
  .on('mouseout', function(){
   rectDelete.style('fill', 'white');
 });

 // creates event allowing to connect this monomer to others	
 gMono.on('click', function(){
  d3.event.stopPropagation();	 
  if(interfaceElem.clickCancel)
  {
   // negate 'clickCancel' and exit function;	  
   interfaceElem.clickCancel = false;	   
   return;
  }
  d3.event.stopPropagation();		// stop bubbling
				
  // disable events associated with delete, chaining and rename functions
  disableMonomerButtons(interfaceElem.svgId);		// disable other buttons on every monomer
  // disable events on edges
  d3.select('#'+interfaceElem.svgId).selectAll('.graph_edge').style('pointer-events','none');
  d3.select('#'+interfaceElem.svgId).selectAll('.monomer_group').selectAll('.main_element').on('mousedown.drag', null);

  var mouseCoord = d3.mouse(svg);	
  // get ID for monomer, from which connection starts	
  var nodeNumberStarting = d3.select(this).attr('id').split('_')[1];

  var x1 = parseInt(rectMono.attr('x')) + graphicAtt.rectMainWidth;
  var y1 = parseInt(rectMono.attr('y')) + graphicAtt.rectMainHeight/2;
  var x2 = mouseCoord[0];
  var y2 = mouseCoord[1];

  // draw edge with all corresponding elements then select sub-elements used further
  var edge = createEdgeBasic(x1, x2, y1, y2, nodeNumberStarting, '', 1, interfaceElem.svgId);
  var connection = edge.select('.main_edge_line');
  var connection2 = edge.select('.main_edge_line_2');
					 
  /* replace onclick event for all monomers when creating edge
  this event allows to connect edge to them  	 
  */
  d3.select('#'+interfaceElem.svgId).selectAll('.monomer_group')
   .selectAll('.main_element')
   .on('click', function(){
    d3.event.stopPropagation();	// prevents removing line if group is selected

    // coordinates for main body of clicked monomer (note that it's coordinate of its upper left corner)
    var coordX = parseInt(d3.select(this).attr('x'));
    var coordY = parseInt(d3.select(this).attr('y'));
    var nodeNumberEnding = 'n' + d3.select(this.parentNode).attr('id').split('_')[1];
    var nodeNumberStarting = edge.attr('starting_node');

    // look if there is already an edge connecting this two monomers
    var selectedEdges1 = d3.select('#'+interfaceElem.svgId)
     .selectAll('.graph_edge[starting_node='+nodeNumberStarting+'][ending_node='+nodeNumberEnding+']');
    var selectedEdges2 = d3.select('#'+interfaceElem.svgId)
     .selectAll('.graph_edge[starting_node='+nodeNumberEnding+'][ending_node='+nodeNumberStarting+']');
    
    var doubleBoundStroke = '7px';
    
    // also look if starting node and ending node aren't same
    var sameNode = (nodeNumberEnding == nodeNumberStarting);

    // if there isn't edge connecting two monomers yet and ending nodes are not same, then create edge
    if((selectedEdges1[0].length == 0)&&(selectedEdges2[0].length == 0)&&!(sameNode)){
     edge.attr("ending_node", nodeNumberEnding);
     connection.attr('x2', coordX + graphicAtt.rectMainWidth/2)
      .attr('y2', coordY + graphicAtt.rectMainHeight/2);
     connection2.attr('x2', coordX + graphicAtt.rectMainWidth/2)
      .attr('y2', coordY + graphicAtt.rectMainHeight/2);

     // creates all of edge's actions once the edge is confirmed
     edge = createEdgeActions(edge, allMonomerLists, graphicAtt, 
      interfaceElem.outputField, interfaceElem.exterNORField, 1);	
     addEdge(nodeNumberStarting.substring(1), nodeNumberEnding.substring(1),
      allMonomerLists, interfaceElem.outputField, interfaceElem.exterNORField);	// removing "n"
     
     d3.select('#'+interfaceElem.svgId).selectAll('.monomer_group').selectAll('.main_element').on('mousedown.drag', dragCallBack);
								
    }
     // first selection isn't empty
    else if(selectedEdges1[0].length == 1)
    {
	 var nBounds1 = selectedEdges1.select('text').text();
	 if(nBounds1 == '1')
	 {
	  selectedEdges1.select('text').text('2');
	  addEdge(nodeNumberStarting.substring(1), nodeNumberEnding.substring(1),
       allMonomerLists, interfaceElem.outputField, interfaceElem.exterNORField);
      selectedEdges1.select('.main_edge_line')
       .style('stroke-width', doubleBoundStroke);	
      selectedEdges1.select('.main_edge_line_2')
       .style('stroke', 'rgba(255,255,255,1)');		 
	 }
	 	
     edge.remove();
     d3.select('#'+interfaceElem.svgId).selectAll('.monomer_group')
      .selectAll('.main_element').on('mousedown.drag', dragCallBack);	 
    }
     // second selection isn't empty
    else if(selectedEdges2[0].length == 1)
    {	 
     var nBounds2 = selectedEdges2.select('text').text();
     if(nBounds2 == '1')
	 {
	  selectedEdges2.select('text').text('2');
	  addEdge(nodeNumberStarting.substring(1), nodeNumberEnding.substring(1),
       allMonomerLists, interfaceElem.outputField, interfaceElem.exterNORField);
      selectedEdges2.select('.main_edge_line')
       .style('stroke-width', doubleBoundStroke);	
      selectedEdges2.select('.main_edge_line_2')
       .style('stroke', 'rgba(255,255,255,1)');		 
	 }
	 	
	 edge.remove();
     d3.select('#'+interfaceElem.svgId).selectAll('.monomer_group')
      .selectAll('.main_element').on('mousedown.drag', dragCallBack);	 
    }
     // if clicked on self
    else
    {
	 edge.remove();
     d3.select('#'+interfaceElem.svgId).selectAll('.monomer_group')
      .selectAll('.main_element').on('mousedown.drag', dragCallBack);	
	}

    // restore previous events (moving monomers by click etc.)		
    endEdgeMode(menuAtts, allMonomerLists, graphicAtt, interfaceElem);
  }); 

  /* disable default event for svg  - creation of new element (line mode)
  this is valid during the creation of an edge
  */	
  svg.onclick = null;

  // enable line connection events during creation of an edge
  d3.select('#'+interfaceElem.svgId).on('mousemove', function(d){
   var mouseCoord = d3.mouse(this);
   connection.attr('x2', mouseCoord[0] - 10)
    .attr('y2', mouseCoord[1]- 10);
   connection2.attr('x2', mouseCoord[0] - 10)
    .attr('y2', mouseCoord[1]- 10);

   connection.attr('x1', parseInt(rectMono.attr('x')) + graphicAtt.rectMainWidth/2);
   connection2.attr('x1', parseInt(rectMono.attr('x')) + graphicAtt.rectMainWidth/2);	
  }).on('click', function(d){
   edge.remove();	// cancel line if monomer isn't selected

   endEdgeMode(menuAtts, allMonomerLists, graphicAtt, interfaceElem);
   d3.select('#'+interfaceElem.svgId).selectAll('.monomer_group').selectAll('.main_element').on('mousedown.drag', dragCallBack);
  });
 })
 .on('mouseover', function(){	// flashing in yellow on mouseover
  rectChain.style('fill', 'yellow');
 })
 .on('mouseout', function(){
  rectChain.style('fill', 'white');
 });	

 gMono.on("mouseover", function(){
  deleteGroup.style('display', 'block');
  if(msieversion()==0)
  {
   this.parentNode.appendChild(this); // puts hovered element on top
  }
 }).on("mouseout", function(){
  deleteGroup.style('display', 'none');
 });
}

/* creates events for an edge
 - edge : svg group element containing an edge
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - outputField : an 'input' field where NOR translation of a graph is output
 - numberBindings : number of bounds created edge will contain
*/
function createEdgeActions(edge, allMonomerLists, graphicAtt, outputField1, outputField2, numberBindings)
{
 var connection = edge.select(".main_edge_line");
 
 var singleBoundStroke = '3px';
 var doubleBoundStroke = '7px';

 /* creates empty, transparent background for switchRect to facilitate 
 button displaying while hovering over it */
 var emptyBack = edge.append('rect')
  .attr('x', ((parseInt(connection.attr('x1')) + 
   parseInt(connection.attr('x2')))/2 - graphicAtt.squareSmallDim/2))
  .attr('y', ((parseInt(connection.attr('y1')) + 
   parseInt(connection.attr('y2')))/2 - graphicAtt.squareSmallDim/2))
  .attr('height', graphicAtt.squareSmallDim)
  .attr('width', graphicAtt.squareSmallDim)
  .attr('class', 'edge_movable')
  .style('fill', 'rgba(255, 255, 255, 0.0)');

 // creating group for button and number
 var switchGroup = edge.append('g').style('display', 'none');   

 // creating button allowing to switch between 1 and 2 bounds (wider line)
 var switchRect = switchGroup.append('rect')
  .attr('x', ((parseInt(connection.attr('x1')) + parseInt(connection.attr('x2')))/2
   - graphicAtt.squareSmallDim/2))
  .attr('y', ((parseInt(connection.attr('y1')) + parseInt(connection.attr('y2')))/2 
   - graphicAtt.squareSmallDim/2))
  .attr('height', graphicAtt.squareSmallDim)
  .attr('width', graphicAtt.squareSmallDim)
  .attr('class', 'edge_switch edge_movable')
  .style('fill', 'rgb(255, 255, 255)')
  .style('stroke-width','1px')
  .style('stroke', 'rgb(0, 0, 0)');

 // creating number of bounds	 				
 var numberBounds = switchGroup.append("text")
  .attr('x', parseInt(switchRect.attr('x')) 
   + graphicAtt.squareSmallDim/4)
  .attr('y', parseInt(switchRect.attr('y'))
   + graphicAtt.squareSmallDim*7/8 )
  .attr('class', 'edge_movable')
  .attr('font-size', '20')
  .attr('fill', 'red')
  .text(numberBindings);

 // adds a group encapsulating elements of a button to remove edge
 edge.on('click', function(){
   d3.event.stopPropagation();	
   removeEdge(edge.attr('starting_node').substring(1), edge.attr('ending_node').substring(1), allMonomerLists, outputField1, outputField2);
   if(numberBounds.text() == '2')
   {
    removeEdge(edge.attr('starting_node').substring(1), edge.attr('ending_node').substring(1), allMonomerLists, outputField1, outputField2);
   } 
   edge.remove();
  });                         			

 // hovering effect for 'number of bounds' button
 edge.on('mouseover', function(d){
  switchGroup.style('display', 'block');
 }).on('mouseout', function(d){
  switchGroup.style('display', 'none');
 });

 return edge;
}
