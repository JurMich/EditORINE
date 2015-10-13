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

/* computes and returns coordinates for graph without edges:
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - maxNptsL :- number of points per line
 - width : width of area to place nodes in
 - length : length of area to place nodes in
 - paddingX and paddingY : borders around zone where nodes shouldn't be placed
 returns list of coordinates for every point.
*/
function computeNodesNoEdge(allMonomerLists, maxNptsL, width, height, paddingX, paddingY)
{
 var nodeCoordinates = []
 
 var count = 0; // number of monomers treated
 var nrows = Math.ceil(allMonomerLists.monomerList.length/maxNptsL); // number of rows of monomers to draw
 // horizontal space between monomers
 var horizontalSpace = parseInt((width-paddingX*2)/(maxNptsL-1));
 var verticalSpace;  // vertical space between monomers
 var xNode;          // coordinate x for node
 var yNode;          // coordinate y for node
 var iterate = 1;    // iterator for x coordinate (either 1 -> augment x or -1 -> lower x)
 // define first x depending on if there is more or less monomers than maxNptsL
 if(allMonomerLists.monomerList.length<maxNptsL)
 {
   xNode = parseInt((width - horizontalSpace*(allMonomerLists.monomerList.length-1))/2);
 }
 else
 {
   xNode = paddingX;
 }
 // define first y depending on if there is only 1 row or more
 if(nrows>1)
 {
  verticalSpace = parseInt((height-paddingY*2)/(nrows-1));
  yNode = paddingY; 
 }
 else
 {
  yNode = height/2;
 }

 // get coordinates for every node
 for(var i=0; i<allMonomerLists.monomerList.length; i++)
 {
  nodeCoordinates[i] = [xNode, yNode];
  // get coordinates for the next point
  xNodeTmp = xNode;
  xNode += iterate*(horizontalSpace);
  /* if x too big after adding step, recharge 
  old value and start decreasing x; also add step to y*/
  if(xNode > (width-paddingX))
  {
   iterate = -1;
   xNode = xNodeTmp;
   yNode += verticalSpace;
  }
  /* if x too small after adding step, recharge old value 
  and start increasing x; also add step to y*/
  else if(xNode < paddingX)
  {
   iterate = 1;
   xNode = xNodeTmp;
   yNode += verticalSpace;
  }
  count++;
 }
 return nodeCoordinates;
}

/* computes and returns coordinates for linear peptide (snake):
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - editor: indicates if editor is 'on' or 'off' (some functions run only for certain types)
 - maxNptsL: number of points per line
 - width: width of area to place nodes in
 - length: length of area to place nodes in
 - paddingX and paddingY : borders around zone where nodes shouldn't be placed
 - verticalLimit : maximum space between two vertically aligned monomers. Ignored
if calculated value is lower (ie. too many monomers).
 - svgId : ID of the main svg window
 returns list of coordinates for every point.
*/

function computeNodesLinear(allMonomerLists, editor, maxNptsL, width, height, paddingX, paddingY, verticalLimit, svgId)
{
 // get number of first node
 var actualNode = getStartOfLinearPeptide(allMonomerLists);
 var oldNode = -1;
 // initiate coordinate list
 var nodeCoordinates = []
 for(i=0; i<allMonomerLists.monomerList.length; i++)
 {
  nodeCoordinates.push[0,0];
 } 

 var count = 0; // number of monomers treated
 var nrows = Math.ceil(allMonomerLists.monomerList.length/maxNptsL); // number of rows of monomers to draw
 // horizontal space between monomers
 var horizontalSpace = parseInt((width-paddingX*2)/(maxNptsL-1));
 var verticalSpace;  // vertical space between monomers
 var xNode;          // coordinate x for node
 var yNode;          // coordinate y for node
 var iterate = 1;    // iterator for x coordinate (either 1 -> augment x or -1 -> lower x)
 // define first x depending on if there is more or less monomers than maxNptsL
 if(allMonomerLists.monomerList.length<maxNptsL)
 {
   xNode = parseInt((width - horizontalSpace*(allMonomerLists.monomerList.length-
    1))/2) ;
 }
 else
 {
   xNode = paddingX;
 }
 // define first y depending on if there is only 1 row or more
 if(nrows>1)
 {
  if(verticalLimit < parseInt((height-paddingY*2)/(nrows-1)))
  {
   verticalSpace = verticalLimit
  }
  else
  { 
   verticalSpace = parseInt((height-paddingY*2)/(nrows-1));
  }
  yNode = paddingY; 
 }
 else if(editor == 'off')
 {
  yNode = paddingY;	 
 }
 else
 {
  yNode = height/2;
 }

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
  if(xNode > (width-paddingX))
  {
   iterate = -1;
   xNode = xNodeTmp;
   yNode += verticalSpace;
  }
  /* if x too small after adding step, recharge old value 
  and start increasing x; also add step to y*/
  else if(xNode < paddingX)
  {
   iterate = 1;
   xNode = xNodeTmp;
   yNode += verticalSpace;
  }
  count++;
 }
 
 // if visualizer, tries to diminish the size of canvas if linear peptide is small enough
 if(editor == 'off')
 {
  var newSvgHeight = yNode + paddingY;
  if(allMonomerLists.monomerList.length<=maxNptsL)
  {
   newSvgHeight = paddingY * 2;  
  }
  console.log('new', paddingY, newSvgHeight, yNode); 
  document.getElementById(svgId).setAttribute('height', newSvgHeight+'px'); 
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

/* computes and returns coordinates for cyclic peptide (presented by SINGLE, UNBRANCHED cycle):
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - limitNode : number of nodes for which separate calcul of ellipse diameter is used (smaller ellipse)
 - width : width of area to place nodes in
 - length : length of area to place nodes in
 - paddingX and paddingY : borders around zone where nodes shouldn't be placed
 returns list of coordinates for every point.
*/
function computeNodesCycle(allMonomerLists, limitNode, width, height, paddingX, paddingY)
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
 if (allMonomerLists.monomerList.length < limitNode)
 {
  a = (width - paddingX*2)/(2*(limitNode - allMonomerLists.monomerList.length + 1));
  b = (height - paddingY*2)/(2*(limitNode - allMonomerLists.monomerList.length + 1));
 }
 else
 {
  a = (width - paddingX*2)/2;
  b = (height - paddingY*2)/2;
 }
 var xNode;
 var yNode;
 // defining center of ellipse 
 var centerX = width/2;
 var centerY = height/2;
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
 return nodeCoordinates;
}
