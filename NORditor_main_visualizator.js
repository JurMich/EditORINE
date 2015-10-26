/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

/* This class constructs the graphical elements (mainly svg) to which the graph will
 * be drawn. */

/* function creating all functions
 - peptideNOR: peptide in NOR format 
 - parentDivId : id of a parent div to which the elements will be appended
 - svgId : id of main svg window (made by this function)
*/

function visualizeMonomer(peptideNOR, parentDivId, svgId)
{
 // verify support of svg
 if(typeof SVGRect != "undefined")
 {
  // contains graphical parameters and identifiers
  var graphicAtt = {};
  // allMonomerLists contains all lists (of nodes, edges, etc.)
  var allMonomerLists = {};
  // contains all attributes to compute layout of a graph
  var gLayoutAtts = {};
  // contains all attributes to compute layout of a graph 
  var menuAtts = {};
  // contains interface elements
  var interfaceElem = {};
  // contains list of colors
  var colorList = {'Unclustered':'hsl(308, 100%, 40%)'};
  console.log(colorList);
  // parameters du to resizing of layouts
  var resLayout = {};
 
  var exterNORField = '';
  interfaceElem.outputField = '';
 
  // pass svg and parent div IDs to object
  interfaceElem.svgId = svgId;
  interfaceElem.parentDivId = parentDivId;
  
  // Graphical:
  graphicAtt.svgad = 'http://www.w3.org/2000/svg'; // xml adress to svg
  graphicAtt.editor = 'off';                        // indicating this is editor or visualizator

  // basic properties of svg field (canvas for editor) - width and height
  graphicAtt.svgHeight = 500;	
  graphicAtt.svgWidth = 700;

  // dimensions of a graphical representation of a monomer
  graphicAtt.rectMainHeight = 50;
  graphicAtt.rectMainWidth = 86;

  // monomer text parameters
  graphicAtt.textPadding = 5;
  graphicAtt.fontSize = 11; 
		
  // parameter of smaller squares
  graphicAtt.squareSmallDim = 20;

  // borders, where monomers shouldn't be placed during random generation of a monomer positions
  graphicAtt.paddingX = (graphicAtt.rectMainWidth/2 + 15);
  graphicAtt.paddingY = (graphicAtt.rectMainHeight/2 + 15);
  
  /* maximum values of monomers in single line for linear monomers
  number of monomers in cycle from which it doesnt become bigger*/
  resLayout.maxPerLine = 4;
  resLayout.minInBiggestCycle = 5; 
 
  // vertical jump between monomers when linear one is drawn
  resLayout.horizontalLimit = parseInt((graphicAtt.svgWidth-graphicAtt.paddingX*2)/(resLayout.maxPerLine-1));  
  resLayout.verticalLimit = 100; 
  resLayout.minXOther = 100; // min X for other types of peptides
  resLayout.minYOther = 100; // min Y for other types of peptides 
  
  // back up values for visualizer resizing
  resLayout.svgWidth = graphicAtt.svgWidth;
  resLayout.svgHeight = graphicAtt.svgHeight;

  // linklist is  similar to NOR format (list of lists, each of whom contains links)		
  allMonomerLists.monomerList = [];        // enlists all monomers by name
  allMonomerLists.indexList = [];          // list of currently used indexes (because of deletion) 		
  allMonomerLists.edgeList = [];           // list of links between nodes/monomers
  allMonomerLists.nodeNum = 0;             // highest index of monomer

  /* graph drawing parameters (width and heigh are svgWidth and svgHeight respectively)
   Explanation : 
   - paddingX and paddingY : borders around zone where nodes shouldn't be placed
   - KRep, KERep, KAtt : constants/weights to ponderate forces (repulsive between nodes, 
   repulsive between edges and attractives respectively).
   - lapMAX, itRMAX, itEMAX, itAMAX : - number of loops for total cycles, iterations for single pass
   of node repulsion, edge-node repulsion and node attraction by edges respectively.
   - sampleSize : graphical parameter, number of tries for non-deterministic algorithm to refresh when intersections appear in graph
  */

  gLayoutAtts.KRep = 100000;
  gLayoutAtts.KERep = 10000;
  gLayoutAtts.KAtt = 0.0001;
  gLayoutAtts.lapMAX = 20;
  gLayoutAtts.itRMAX = 10;
  gLayoutAtts.itEMAX = 10;
  gLayoutAtts.itAMAX = 10;
  gLayoutAtts.sampleSize = 40;

  var parentDiv = document.getElementById(parentDivId);

  // create svg (main window of editor)
  var svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
  svg.className = 'svg';
  svg.id = svgId;
  svg.style.cssText = 'display: block; margin: auto;';
  svg.setAttribute('width', graphicAtt.svgWidth);
  svg.setAttribute('height', graphicAtt.svgHeight);
  parentDiv.appendChild(svg);

  /* svg has not z-index and alements are ordered by drawing order.
  Thus we create layer with edges and on top of it, layer with nodes - monomers. */
  var background = d3.select('#'+interfaceElem.svgId).append('rect').attr('width', graphicAtt.svgWidth)
   .attr('height', graphicAtt.svgHeight)
   .style('fill', 'rgb(255, 255, 255)');
  var edgeLayer = d3.select('#' + svgId)
   .append('g').attr('class', 'edgeLayer');		// lower layer (nodes)
  var nodeLayer = d3.select('#' + svgId)
   .append('g').attr('class', 'nodeLayer');		// will be rendered later, so positionned on top
  
    // fill colorlist with values
  d3.json('monomers.json', function(jsonContents)
  {
   addColor(jsonContents, colorList);
   importGraph(exterNORField, peptideNOR, gLayoutAtts, menuAtts, allMonomerLists, graphicAtt, resLayout, interfaceElem, colorList);
  });
  
  var breakLine = document.createElement('br');
  parentDiv.appendChild(breakLine);

  var redrawButton = document.createElement('button');
  redrawButton.innerHTML = 'Redraw';
  redrawButton.setAttribute('type', 'button');
  redrawButton.onclick = function(){
   draw(gLayoutAtts, menuAtts, allMonomerLists, graphicAtt, resLayout, interfaceElem);
  };
  parentDiv.appendChild(redrawButton);
  var outputButton = document.createElement('button');
  outputButton.setAttribute('type', 'button');
  outputButton.style.width = '150px';
  outputButton.innerHTML = 'Show .png image';
  //outputButton.className = 'anchor_button';
  outputButton.onclick=function()
  {
   var imgWindow = window.open('','_blank', 'width='+(graphicAtt.svgWidth+20)+', height='+(graphicAtt.svgHeight+80)); 
   var canv = document.createElement('canvas');
   canv.width = graphicAtt.svgWidth;
   canv.height = graphicAtt.svgHeight;
   
   var svg_str = (new XMLSerializer()).serializeToString(svg);
   canvg(canv, svg_str);
   // if download attribute on anchor is supported
   if(typeof document.createElement('a').download != "undefined")
   {
    createImagePageAnchor(imgWindow, graphicAtt.svgWidth, graphicAtt.svgHeight, canv)
   }
   else
   {
    createImagePage(imgWindow, graphicAtt.svgWidth, graphicAtt.svgHeight, canv)
   } 
  } 
  parentDiv.appendChild(outputButton);
 }
 // id svg is not supported 
 else
 {
  printWarning();
 }
}

/*
------------- Functions exlusive to visualizer -------------
    These are placed here because there is a few of them 
    (currently only this one).
 */
/* recursive function to add color of monomer to
 list and explore if there are lower levels
 * cluster : cluster attribute in object (json)
 * colorList : list to which the colors will be saved
 */
function addColor(cluster, colorList)
{
 // if color is absent, replace by white
 if(cluster['name'])
 {
  var monoName = cluster['name'];	  
  if(cluster['color'])
  {
   colorList[monoName] = cluster['color'];
  }
  else
  {
   colorList[monoName] = 'white';
  }
 }
 else
 {
  colorList['X'] = 'hsl(0, 0%, 15%)';
 }
 if(cluster['cluster'])
 {
  for(var i = 0; i<cluster['cluster'].length; i++)
  {
   addColor(cluster['cluster'][i], colorList);
  }
 }
 if(cluster['monomer'])
 {
  for(var i = 0; i<cluster['monomer'].length; i++)
  {
   addColor(cluster['monomer'][i], colorList);
  }
 }
}
