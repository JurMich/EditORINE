/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

/* creates specific layout (linear/cycle) for specific peptide cases or when there are
 * no edges at all used
 */

/* computes and returns coordinates for linear peptide (snake) or no edge:
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - resLayout : attributes used for deterministic layout computation
 - svgId : ID of the main svg window
 - edges : indicates if using edge mode or not
 returns list of coordinates for every point.
 NOTE: coordinates of every node is the middle of main rectangle
*/

function computeNodesLNEEditor(allMonomerLists, graphicAtt, resLayout, svgId, edges)
{
 var count = 0; // number of monomers treated
 var nrows = Math.ceil(allMonomerLists.monomerList.length/resLayout.maxPerLine); // number of rows of monomers to draw
 // horizontal space between monomers
 var horizontalSpace = resLayout.horizontalLimit;
 var verticalSpace;  // vertical space between monomers
 var xNode;          // coordinate x for node
 var yNode;          // coordinate y for node
 // define first x depending on if there is more or less monomers than maxNptsL
 if(allMonomerLists.monomerList.length<resLayout.maxPerLine)
 {
  xNode = parseInt((resLayout.svgWidth - horizontalSpace*
   (allMonomerLists.monomerList.length - 1))/2) ;
 }
 else
 {
  xNode = graphicAtt.paddingX;
 }
 // define y and vertical space depending on if there is only 1 row or more
 if(nrows>1)
 {
  if(resLayout.verticalLimit < parseInt((resLayout.svgHeight-
   graphicAtt.paddingY*2)/(nrows-1)))
  {
   verticalSpace = resLayout.verticalLimit
  }
  else
  { 
   verticalSpace = parseInt((resLayout.svgHeight-
    graphicAtt.paddingY*2)/(nrows-1));
  }
  yNode = resLayout.svgHeight/2 - ((nrows - 1)*verticalSpace)/2; 
 }
 else
 {
  yNode = resLayout.svgHeight/2;
 }
 if(edges == 'yes')
 {
  var nodeCoordinates = getCoordinatesLinear(xNode, yNode, 
   horizontalSpace, verticalSpace, allMonomerLists, graphicAtt, resLayout);
 }
 else
 {
  var nodeCoordinates = getCoordinatesNoEdge(xNode, yNode, 
   horizontalSpace, verticalSpace, allMonomerLists, graphicAtt, resLayout); 
 }
 return nodeCoordinates;
}

/* computes and returns coordinates for linear peptide (snake) or no edge. Visualizer version,
 cuts down the size of resulting image:
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - resLayout : attributes used for deterministic layout computation
 - svgId : ID of the main svg window
 - edges : indicates if using edge mode or not
 returns list of coordinates for every point.
*/

function computeNodesLNEVis(allMonomerLists, graphicAtt, resLayout, svgId, edges)
{
 var count = 0; // number of monomers treated
 var nrows = Math.ceil(allMonomerLists.monomerList.length/resLayout.maxPerLine); // number of rows of monomers to draw
 // horizontal space between monomers
 var horizontalSpace = resLayout.horizontalLimit;
 var verticalSpace;  // vertical space between monomers
 var xNode = graphicAtt.paddingX;          // coordinate x for node
 var yNode = graphicAtt.paddingY;          // coordinate y for node

 // define vertical space depending on if there is enough of place or not
 if(resLayout.verticalLimit < parseInt((resLayout.svgHeight-
  graphicAtt.paddingY*2)/(nrows-1)))
 {
  verticalSpace = resLayout.verticalLimit;
 }
 else
 { 
  if(nrows>1)
  {	 
   verticalSpace = parseInt((resLayout.svgHeight-
   graphicAtt.paddingY*2)/(nrows-1));
  }
 }

 if(edges == 'yes')
 {
  var nodeCoordinates = getCoordinatesLinear(xNode, yNode, 
   horizontalSpace, verticalSpace, allMonomerLists, graphicAtt, resLayout);
 }
 else
 {
  var nodeCoordinates = getCoordinatesNoEdge(xNode, yNode, 
   horizontalSpace, verticalSpace, allMonomerLists, graphicAtt, resLayout); 
 }
 
 // for visualizer, adjust size of svg
 var newSvgWidth;
 if(nrows==1)
 {
  var newSvgWidth = (allMonomerLists.monomerList.length-1)*
   horizontalSpace + graphicAtt.paddingX*2;
  document.getElementById(svgId).setAttribute('width', newSvgWidth+'px');
 }
 else
 {
  var newSvgWidth = resLayout.svgWidth;
 }
 
 if(nrows>1)
 { 
  var newSvgHeight = (nrows-1)*verticalSpace + graphicAtt.paddingY*2; 
 }
 else
 {
  var newSvgHeight = graphicAtt.paddingY*2;
 } 
 document.getElementById(svgId).setAttribute('height', newSvgHeight+'px');
 graphicAtt.svgWidth = newSvgWidth; 
 graphicAtt.svgHeight = newSvgHeight;
 return nodeCoordinates;
}

/* returns coordinates according to starting point of linear 'snake'
 - xNode: starting X position
 - yNode: starting Y position
 - horizontalSpace: space between two succesive nodes horizontally
 - verticalSpace: like preceeding, but vertically
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - resLayout : attributes used for deterministic layout computation
 */
function getCoordinatesLinear(xNode, yNode, horizontalSpace, verticalSpace, allMonomerLists, graphicAtt, resLayout)
{
 var count = 0;	
 var actualNode = getStartOfLinearPeptide(allMonomerLists);
 var oldNode = -1;
 var nodeCoordinates = [];	// results	
 for(i=0; i<allMonomerLists.monomerList.length; i++)
 {
  nodeCoordinates.push[0,0];
 } 
 var iterate = 1;    // iterator for x coordinate (either 1 -> augment x or -1 -> lower x)
 // get coordinates for every node
 while(count < allMonomerLists.monomerList.length)
 {
  nodeCoordinates[actualNode] = [xNode, yNode];
  // get number of next node connected by line
  var uniqueEdgeEnds = findDuplicates(allMonomerLists.edgeList[actualNode])[0]
  if(allMonomerLists.indexList.indexOf(uniqueEdgeEnds[0]) != oldNode) 
  { // if first number isn't the old node, it has to be the next one
   oldNode = actualNode;
   actualNode = allMonomerLists.indexList.indexOf(uniqueEdgeEnds[0]);
  } 
  else
  { // else the next one is this since there are only two nodes
   oldNode = actualNode;
   actualNode = allMonomerLists.indexList.indexOf(uniqueEdgeEnds[1]);   
  }
  // get coordinates for the next point
  xNodeTmp = xNode;
  xNode += iterate*(horizontalSpace);
  /* if x too big after adding step, recharge 
  old value and start decreasing x; also add step to y*/
  if(xNode > (resLayout.svgWidth-graphicAtt.paddingX))
  {
   iterate = -1;
   xNode = xNodeTmp;
   yNode += verticalSpace;
  }
  /* if x too small after adding step, recharge old value 
  and start increasing x; also add step to y*/
  else if(xNode < graphicAtt.paddingX)
  {
   iterate = 1;
   xNode = xNodeTmp;
   yNode += verticalSpace;
  }
  count++;
 }	
 return nodeCoordinates;
}

/* returns coordinates according to starting point of linear 'snake'
 - xNode: starting X position
 - yNode: starting Y position
 - horizontalSpace: space between two succesive nodes horizontally
 - verticalSpace: like preceeding, but vertically
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - resLayout : attributes used for deterministic layout computation
 - graphicAtt : object containing all graphical parameters
 */
function getCoordinatesNoEdge(xNode, yNode, horizontalSpace, verticalSpace, allMonomerLists, graphicAtt, resLayout)
{
 var count = 0;	
 var nodeCoordinates = [];	// results	
 for(i=0; i<allMonomerLists.monomerList.length; i++)
 {
  nodeCoordinates.push[0,0];
 } 
 var iterate = 1;    // iterator for x coordinate (either 1 -> augment x or -1 -> lower x)
 // get coordinates for every node
 for(var i=0; i<allMonomerLists.monomerList.length; i++)
 {
  nodeCoordinates[i] = [xNode, yNode];
  // get coordinates for the next point
  xNodeTmp = xNode;
  xNode += iterate*(horizontalSpace);
  /* if x too big after adding step, recharge 
  old value and start decreasing x; also add step to y*/
  if(xNode > (resLayout.svgWidth-graphicAtt.paddingX))
  {
   iterate = -1;
   xNode = xNodeTmp;
   yNode += verticalSpace;
  }
  /* if x too small after adding step, recharge old value 
  and start increasing x; also add step to y*/
  else if(xNode < graphicAtt.paddingX)
  {
   iterate = 1;
   xNode = xNodeTmp;
   yNode += verticalSpace;
  }
  count++;
 }
 return nodeCoordinates;
} 

/* gets number of node starting/ending path.
   Takes no argument and returns index of this node.
*/
function getStartOfLinearPeptide(allMonomerLists)
{
 startFound = 0;
 startIndex = -1;
 i = 0;
 while(startFound == 0)
 {
  var uniqueEdgeEnds = findDuplicates(allMonomerLists.edgeList[i])[0]
  if(uniqueEdgeEnds.length == 1)
  {
   startFound = 1;
   startIndex = i;
  }
  i++;
 }
 return startIndex;
} 

/* computes and returns coordinates for linear peptide (snake) or no edge:
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - resLayout : attributes used for deterministic layout computation
 - svgId : ID of the main svg window
 - edges : indicates if using edge mode or not
 returns list of coordinates for every point.
 NOTE: coordinates of every node is the middle of main rectangle
*/
function computeNodesCycle(allMonomerLists, graphicAtt, resLayout, svgId)
{
 // it's a cycle, doesnt matter, where we start
 var actualNode = 0;
 var oldNode = -1;

 // initiate coordinate list
 var nodeCoordinates = []
 for(var i=0; i<allMonomerLists.monomerList.length; i++)
 {
  nodeCoordinates.push[0,0];
 }

 // using cartesian definition of an ellipse
 var a; // X axis of ellipse
 var b; // Y axis of ellipse
 if (allMonomerLists.monomerList.length < resLayout.minInBiggestCycle)
 {
  a = (resLayout.svgWidth - graphicAtt.paddingX*2)/
   (2*(resLayout.minInBiggestCycle - allMonomerLists.monomerList.length + 1));
  b = (resLayout.svgHeight - graphicAtt.paddingY*2)/(2*(resLayout.minInBiggestCycle - 
   allMonomerLists.monomerList.length + 1));
 }
 else
 {
  a = (resLayout.svgWidth - graphicAtt.paddingX*2)/2;
  b = (resLayout.svgHeight - graphicAtt.paddingY*2)/2;
 }
 var xNode;
 var yNode;
 // defining center of ellipse 
 if(graphicAtt.editor == 'on')
 {
  var centerX = resLayout.svgWidth/2;
  var centerY = resLayout.svgHeight/2;
 }
 else
 {
  var centerX = a + graphicAtt.paddingX;
  var centerY = b + graphicAtt.paddingY; 
 } 
 var angle = 0; // angle in spiral
 // angle iterators
 var angleDiff = 2*Math.PI/allMonomerLists.monomerList.length;
 while(angle < 2*Math.PI)
 {
  // compute x and y
  xNode = a*Math.cos(angle) + centerX;
  yNode = b*Math.sin(angle) + centerY;
  nodeCoordinates[actualNode] = [xNode, yNode];
  // get number of next node connected by line
  var uniqueEdgeEnds = findDuplicates(allMonomerLists.edgeList[actualNode])[0];
  if(allMonomerLists.indexList.indexOf(uniqueEdgeEnds[0]) 
   != oldNode) 
  { // if first number isn't the old node, it has to be the next one
   oldNode = actualNode;
   actualNode = allMonomerLists.indexList.indexOf(uniqueEdgeEnds[0]);
  } 
  else
  { // else the next one is this since there are only two nodes
   oldNode = actualNode;
   actualNode = allMonomerLists.indexList.indexOf(uniqueEdgeEnds[1]);  
  }
  angle += angleDiff;
 }
 // if visualizator, resize image
 if(graphicAtt.editor == 'off')
 {
  if (allMonomerLists.monomerList.length < resLayout.minInBiggestCycle)
  {
   var newSvgWidth = 2*(a + graphicAtt.paddingX);
   var newSvgHeight = 2*(b + graphicAtt.paddingY);
   document.getElementById(svgId).setAttribute('width', newSvgWidth+'px');
   document.getElementById(svgId).setAttribute('height', newSvgHeight+'px');
   graphicAtt.svgWidth = newSvgWidth; 
   graphicAtt.svgHeight = newSvgHeight;
  }
 }	 
 return nodeCoordinates;
}
