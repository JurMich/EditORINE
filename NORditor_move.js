/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

// creates drag'n'drop for monomers (editor only)

/* function allowing to drag an element and deplace it
 - draggedElement: element to be dragged
 - menuAtts: list containing menu attributes
 - interfaceElem: objects (notably input boxes or IDs of fields)
 */
function dragAlong(rectMono, menuAtts, graphicAtt, interfaceElem)
{
 // getting svg and id of desired elements
 var svg = document.getElementById(interfaceElem.svgId);
 var newCoordinates = d3.mouse(svg);
 var rectMonoSelected = d3.select(rectMono);
 var monomerSelected = d3.select(rectMono.parentNode);
 var nodeNumber = monomerSelected.attr('id').split('_')[1];
 if (newCoordinates[0] > (graphicAtt.svgWidth - graphicAtt.rectMainWidth/2 - graphicAtt.squareSmallDim/2)) newCoordinates[0] = 
  graphicAtt.svgWidth - graphicAtt.rectMainWidth/2 - graphicAtt.squareSmallDim/2;
 else if(newCoordinates[0] < graphicAtt.rectMainWidth/2) newCoordinates[0] = graphicAtt.rectMainWidth/2;
 if (newCoordinates[1] > (graphicAtt.svgHeight - graphicAtt.rectMainHeight/2 - graphicAtt.squareSmallDim/2)) newCoordinates[1] = 
  graphicAtt.svgHeight - graphicAtt.rectMainHeight/2 - graphicAtt.squareSmallDim/2;
 else if(newCoordinates[1] < graphicAtt.rectMainHeight/2 + graphicAtt.squareSmallDim/2) newCoordinates[1] = graphicAtt.rectMainHeight/2 + graphicAtt.squareSmallDim/2;
 var dX = newCoordinates[0] - (parseInt(rectMonoSelected.attr('x')) 
  + graphicAtt.rectMainWidth/2)
 var dY = newCoordinates[1] - (parseInt(rectMonoSelected.attr('y')) 
  + graphicAtt.rectMainHeight/2)
 // modifying coordinates depending on typing of object 
 monomerSelected.selectAll('.monomer_movable')
  .each(function(){
   // position of rectangles and text is defined by 'x' and 'y'	
   if(d3.select(this).attr('x') != undefined)
   {
    var newX = parseInt(d3.select(this).attr('x')) + dX;
    var newY = parseInt(d3.select(this).attr('y')) + dY;
    d3.select(this).attr('x', newX);
    d3.select(this).attr('y', newY);
   }
   /* position of lines is defined by position of its ends -
   (x1, y1) and (x2, y2)
   */ 
   else if(d3.select(this).attr('x1') != undefined)
   {
    var newX1 = parseInt(d3.select(this).attr('x1')) + dX;
    var newX2 = parseInt(d3.select(this).attr('x2')) + dX;
    var newY1 = parseInt(d3.select(this).attr('y1')) + dY;
    var newY2 = parseInt(d3.select(this).attr('y2')) + dY;
    d3.select(this).attr('x1', newX1);
    d3.select(this).attr('x2', newX2);
    d3.select(this).attr('y1', newY1);
    d3.select(this).attr('y2', newY2);
   }
   // position of ellipses is defined by position of its center (cx, cy)
   else if(d3.select(this).attr('cx') != undefined)
   {
    var newCX = parseInt(d3.select(this).attr('cx')) + dX;
    var newCY = parseInt(d3.select(this).attr('cy')) + dY;
    d3.select(this).attr('cx', newCX);
    d3.select(this).attr('cy', newCY);
   }
 });
 // case one : deplaced monomer is starting one 
 moveEdges(nodeNumber, 1, newCoordinates, graphicAtt, interfaceElem.parentDivId);

 // case two : deplaced monomer is ending one (similar to previous)
 moveEdges(nodeNumber, 2, newCoordinates, graphicAtt, interfaceElem.parentDivId);
}

/* computes and adjusts positions of edges
 - nodeNumber : index of node
 - edgeEnd: has value 1 for starting node and 2 for ending node 
 - newCoordinates : coordinates which the node will be deplaced to
 - graphicAtt : object containing all graphical parameters
 - parentDivId : ID of div containing the editor
*/
function moveEdges(nodeNumber, edgeEnd, newCoordinates, graphicAtt, parentDivId)
{
 var nodeAtt = (edgeEnd == 1) ? 'starting_node' : 'ending_node';      // search for starting_node if edgeEnd == 1
 var otherNodeAtt = (edgeEnd == 2) ? 'starting_node' : 'ending_node'; // asearch for endong_node if edgeEnd == 1
 var otherEdgeEnd = (edgeEnd == 1) ? 2 : 1; 	             // other end of edge
 d3.select('#'+parentDivId).selectAll('.graph_edge[' + nodeAtt +' =n'+nodeNumber+']').each(function(){
  // get other node's main body coordinates

  var otherEndNodeNumber = d3.select(this).attr(otherNodeAtt).substr(1); // get its ID
  var otherEndNodeX = parseInt(d3.select('#'+parentDivId).select('#monomer_' + otherEndNodeNumber).select('.main_element').attr('x'));
  var otherEndNodeY = parseInt(d3.select('#'+parentDivId).select('#monomer_' + otherEndNodeNumber).select('.main_element').attr('y'));	

  // compare nodes new relative position, then adjust edge's ends positions
 	
  d3.select(this).select('.main_edge_line').attr('x' + edgeEnd, newCoordinates[0])
   .attr('x' + otherEdgeEnd, otherEndNodeX + graphicAtt.rectMainWidth/2)
   .attr('y' + edgeEnd, newCoordinates[1]);
  d3.select(this).select('.main_edge_line_2').attr('x' + edgeEnd, newCoordinates[0])
   .attr('x' + otherEdgeEnd, otherEndNodeX + graphicAtt.rectMainWidth/2)
   .attr('y' + edgeEnd, newCoordinates[1]);

  // compute middle position of edge, the difference d[XY] between the two positions and move all elements by dX/dY
  var middleLinePosX = (parseInt(d3.select(this).select('line').attr('x' + edgeEnd)) + parseInt(d3.select(this).select('line').attr('x' + otherEdgeEnd)))/2 - graphicAtt.squareSmallDim/2;
  var middleLinePosY = (parseInt(d3.select(this).select('line').attr('y' + edgeEnd)) + parseInt(d3.select(this).select('line').attr('y' + otherEdgeEnd)))/2 - graphicAtt.squareSmallDim/2;
  var dX = middleLinePosX - parseInt(d3.select(this).select('rect').attr('x'));
  var dY = middleLinePosY - parseInt(d3.select(this).select('rect').attr('y'));	
  d3.select(this).selectAll('.edge_movable').each(function()
  {
    if(d3.select(this).attr('x') != undefined)	// rectangle or text
    {
     var oldX = parseInt(d3.select(this).attr('x'));
     var oldY = parseInt(d3.select(this).attr('y'));
     d3.select(this).attr('x', oldX + dX); 
     d3.select(this).attr('y', oldY + dY); 
    }
    else if(d3.select(this).attr('x1') != undefined)
    {
     var oldX1 = parseInt(d3.select(this).attr('x1'));
     var oldX2 = parseInt(d3.select(this).attr('x2'));
     var oldY1 = parseInt(d3.select(this).attr('y1'));
     var oldY2 = parseInt(d3.select(this).attr('y2')); 
     d3.select(this).attr('x1', oldX1 + dX);
     d3.select(this).attr('x2', oldX2 + dX); 
     d3.select(this).attr('y1', oldY1 + dY);
     d3.select(this).attr('y2', oldY2 + dY);
    }
  });
 }); 
} 
