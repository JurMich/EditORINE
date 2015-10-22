/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

/* Draws monomers without buttons and with no associated events.*/

/* creates base of monomer aby clicking on svg
 - coordinates[XY] : coordinates of click by mouse; position at which monomer will be created
 - monomerName : name under which the monomer will be created
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - svgId : ID of the main svg window
***
In case of editor, Meach monomer is created completely by two separate functions, one creates its base 
elements (main group, main rectangle, its name and title - look lower for further explication), other 
makes buttons and adds all of events. 
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
function createMonomerBase(coordinatesX, coordinatesY, monomerName, allMonomerLists, graphicAtt, svgId)
{
 // selecting layer containing nodes
 var nodeLayer = d3.select('#'+svgId).select('.nodeLayer'); 
 
 var monomerId = 'monomer_' + allMonomerLists.nodeNum; 

 // create group containing all elements of monomer representation
 var gMono = nodeLayer
  .append('g')
  .attr('id', monomerId)
  .attr('class', 'monomer_group');
 
 // if IE 10+ or !IE 
 if((msieversion()>9) || (msieversion()==0))
 {
  gMono.style('pointer-events','auto');
 }
 else
 {
  gMono.style('pointer-events', null);
 }

 // create 'body' of monomer representation (rectangle)
 var rectMono = gMono.append('rect')
  .attr('x', coordinatesX - graphicAtt.rectMainWidth/2)
  .attr('y', coordinatesY - graphicAtt.rectMainHeight/2)
  .attr('rx', 10)		// corner rounding
  .attr('ry', 10)		
  .attr('height', graphicAtt.rectMainHeight)
  .attr('width', graphicAtt.rectMainWidth)
  .attr('class', 'main_element monomer_movable')
  .style('fill', 'rgb(255, 255, 255)')
  .style('stroke-width','3px')
  .style('stroke', 'rgb(0, 0, 0)');

 // add monomer name, wrapped and centered
 // note : text is positionned by left bottom corner

 var monomerText = gMono.append('text')
  .attr('x', coordinatesX - graphicAtt.rectMainWidth/2  + graphicAtt.textPadding)
  .attr('y', coordinatesY - graphicAtt.rectMainHeight/2 + graphicAtt.textPadding + graphicAtt.fontSize)
  .attr('class', 'monomer_name monomer_movable')
  .attr('font-size', graphicAtt.fontSize)
  .attr('pointer-events', 'none')
  .text(monomerName)
  .call(wrap, graphicAtt.rectMainWidth - graphicAtt.squareSmallDim/2 -
    graphicAtt.textPadding*2, graphicAtt.rectMainHeight - graphicAtt.textPadding*2);

 // adds title to group in case normal text is way too long and it's not shown entirely
 var monomerTitle = gMono.append('title')
  .text(monomerName); 
  
 // construct legend of colors
 addColorLegend(gMono, allMonomerLists, graphicAtt);
 
 return gMono;
}

/* draws a color legend on respective monomer
 - gMono : group containing all parts of a single monomer 
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 */
function addColorLegend(gMono, allMonomerLists, graphicAtt)
{
 var rectMono = gMono.select('.main_element');
 var nodeNumber = parseInt(gMono.attr('id').split('_')[1]);
 var indexOfThisNode = allMonomerLists.indexList.indexOf(nodeNumber);
 
 var colorPalette;
 // this is prevention in case monomer was entered manually
 if(allMonomerLists.color[indexOfThisNode]==undefined){
  allMonomerLists.color[indexOfThisNode] = ['white']
 }
 colorPalette = allMonomerLists.color[indexOfThisNode];	 
 
 var upperColorLimit = 1;
 var threePoints = 0;
 if(colorPalette.length <= 4)
 {
  upperColorLimit = colorPalette.length;
 }
 else
 {
  upperColorLimit = 4;
  threePoints = 1;
 }
  
 for(var i=0; i<upperColorLimit; i++)
 {
  var markerSquare = gMono.append('rect')
  .attr('x', parseInt(rectMono.attr('x')) + 15*i)
  .attr('y', parseInt(rectMono.attr('y')) - 5)
  .attr('class', 'monomer_movable color_indicator')
  .attr('width', 10)
  .attr('height', 10)
  .style('fill', colorPalette[i])
  .style('stroke-width','2px')
  .style('stroke', 'rgb(0, 0, 0)');
 }
 
 if(threePoints)
 {
  var tooMany = gMono.append('text')
   .attr('x', parseInt(rectMono.attr('x')) + 15*upperColorLimit)
   .attr('y', parseInt(rectMono.attr('y')) + 5)
   .attr('class', 'monomer_movable color_indicator')
   .attr('font-size', graphicAtt.fontSize)
   .text('...');
 }
 var colorLegendElem = gMono.selectAll('.color_indicator');
 return colorLegendElem; 
}

/* wrapper for edge creating functions: calculates coordinates if only
nodeNumberStarting an nodeNumberEnding are given
 - nodeNumberStarting and nodeNumberEnding : numbers of nodes connected by this edge
 - numberBindings : '1' or '2' depending on if binding is simple or double
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - svgId : ID of the main svg window
 - outputField : an 'input' field where NOR translation of a graph is output
Note: in case of using this wrapper, the nodes have to be known! 
*/
function drawEdgeNodesOnly(nodeNumberStarting, nodeNumberEnding, numberBindings, allMonomerLists, graphicAtt, svgId, outputField1, outputField2)
{
 var nodeLayer = d3.select('#'+svgId).select('.nodeLayer'); 
 var x1 = parseInt(nodeLayer.select('#monomer_'+nodeNumberStarting).select('.main_element').attr('x'));
 var y1 = parseInt(nodeLayer.select('#monomer_'+nodeNumberStarting).select('.main_element').attr('y')) 
  + graphicAtt.rectMainHeight/2;
 var x2 = parseInt(nodeLayer.select('#monomer_'+nodeNumberEnding).select('.main_element').attr('x'));
 var y2 = parseInt(nodeLayer.select('#monomer_'+nodeNumberEnding).select('.main_element').attr('y')) 
  + graphicAtt.rectMainHeight/2;
 
 x1 = x1 + graphicAtt.rectMainWidth/2;
 x2 = x2 + graphicAtt.rectMainWidth/2;
 var edge = createEdgeBasic(x1, x2, y1, y2, nodeNumberStarting, nodeNumberEnding, numberBindings, svgId);
 // add actions only if it's editor 
 if(graphicAtt.editor == 'on')
 {
  createEdgeActions(edge, allMonomerLists, graphicAtt, outputField1, outputField2, numberBindings);
 } 
}

/* creates graphical base of an edge (without events or buttons)
 - x1, x2, y1, y2 : same coordinates as for drawing line
 returns edge - group containing everything
 - nodeNumberStarting and nodeNumberEnding : numbers of nodes connected by this edge
 - numberBindings : '1' or '2' depending on if binding is simple or double
 - svgId : ID of the main svg window
*/
function createEdgeBasic(x1, x2, y1, y2, nodeNumberStarting, nodeNumberEnding, numberBindings, svgId)
{
 // selecting layer containing edges
 var edgeLayer = d3.select('#'+svgId).select('.edgeLayer');

 // line properties depending on number of bounds
 var singleBoundStroke = '3px';
 var doubleBoundStroke = '7px';

 // creating group containing every element of edge with appropriate attributes
 var edge = edgeLayer.append('g').attr('class', 'graph_edge')
  .attr('starting_node', 'n' + nodeNumberStarting)
  .attr('ending_node', 'n' + nodeNumberEnding); 

 /* creating line representing connection between graph parts
   at this moment, line starts at this monomer and ends near mouse 
   cursor */
 var connection = edge.append('line')
  .attr('x1', x1)
  .attr('y1', y1)
  .attr('x2', x2)
  .attr('y2', y2)
  .attr('class', 'main_edge_line')
  .style('stroke', 'rgb(0, 0, 0)')
  .style('stroke-width', singleBoundStroke);
 
 var connection2 = edge.append('line')
  .attr('x1', x1)
  .attr('y1', y1)
  .attr('x2', x2)
  .attr('y2', y2)
  .attr('class', 'main_edge_line_2')
  .style('stroke', 'rgba(0, 0, 0, 0)')
  .style('stroke-width', '2px');  

 if (numberBindings == 2)
 {
  connection.style('stroke-width', doubleBoundStroke); 
  connection2.style('stroke', 'rgba(255, 255, 255, 1)'); 
 } 

 return edge;
}
