/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

/* contains functions which will import and create graph using s
 * spring embedder layout algorithm */

/* imports NOR format in program lists
 - NORmat : peptide in NOR format
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - externField : field where result is show (different from outputField, because 
   it is exterior to editor)
 - colorList : list of monomer <-> color associations
NB: NOR has following "containers" separated by @:
 - first is list of all monomers
 - subsequent ones contain numbers of monomers to which they are binded
*/

function NORImport(NORmat, allMonomerLists, externField, colorList)
{
 if(NORmat!='')
 {
  if(NORmat.indexOf('@') == -1)
  {
   NORmat += '@';
  }
  var NORcontainers = NORmat.split("@");	
  var monomers = NORcontainers[0].split(",");
  
  for(var i = 0; i<monomers.length; i++)
  {
   var monomer = monomers[i].trim();	// remove whitespaces
   allMonomerLists.monomerList.push(monomer);
   allMonomerLists.indexList.push(i);
   allMonomerLists.edgeList.push([]);
   allMonomerLists.color.push([]);
   // imports colors in graph
   var monomerSingle = monomer.replace(/[\[\]]/g, ''); 
   var monomerSingleList = monomerSingle.split("|");
   for(var j=0; j<monomerSingleList.length; j++)
   {	
    if(monomerSingleList[j] in colorList)
    {
     allMonomerLists.color[i].push(colorList[monomerSingleList[j]]);   
    }
    else
    {
     allMonomerLists.color[i].push('white');
    }
   }
  }	

  if(NORcontainers[monomers.length]==undefined)
  { 
   externField.value = NORcontainers[0]+'@'; 
   return 0;
  }

  for(var i = 0; i<allMonomerLists.monomerList.length; i++)
  {
   if((NORcontainers[i+1].match(/^[0-9,\s]*$/)) || (NORcontainers[i+1]==undefined))
   {
    // transforms string of form '[int,int,...]' to array
    var binds = JSON.parse("["+NORcontainers[i + 1]+"]");
    var uniqueBinds = findDuplicates(binds);
    for(var j=0; j<uniqueBinds[0].length; j++)
    {
     // if number is too high or is pointing to monomer itself
     if((uniqueBinds[0][j]>(monomers.length-1))||(uniqueBinds[0][j]==i))
     {
      // clean everything
      resetLists(allMonomerLists);
      externField.style.cssText='background-color:#ff9999;';
      return 0;
     }
     // this part controls reciprocity of bounds
     var binds2 = JSON.parse("["+NORcontainers[uniqueBinds[0][j] + 1]+"]");
     var uniqueBinds2 = findDuplicates(binds2);
     if(uniqueBinds[1][j] != uniqueBinds2[1][uniqueBinds2[0].indexOf(i)])
     {
      resetLists(allMonomerLists);
      externField.style.cssText='background-color:#ff9999;';
      return 0;
     }
    }
   }
   else
   {
    //clean everything
    resetLists(allMonomerLists);
    externField.style.cssText='background-color:#ff9999;';
    return 0;
   }
   allMonomerLists.edgeList[i] = binds;
  }
  allMonomerLists.nodeNum = allMonomerLists.monomerList.length - 1;
 }
}

/* randomly position every node at beginning
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - width : width of area to place nodes in
 - height : length of area to place nodes in
 - paddingX and paddingY : borders around zone where nodes shouldn't be placed
 returns list of coordinates for every node
*/
function initNodeCoords(allMonomerLists, width, height, paddingX, paddingY)
{
 var nodeCoordinates = [];
 for(var i = 0; i<allMonomerLists.monomerList.length; i++)
 {
  var x = parseInt(Math.random()*(width-paddingX*2) + paddingX);
  var y = parseInt(Math.random()*(height-paddingY*2) + paddingY);
  nodeCoordinates.push([x,y]);
 }
 return nodeCoordinates;
}

/* calculate coordinate component of force applied on nodeAffected 
 by nodeAffector. nodeAffected applies same force on nodeAffector, but of opposite sign
 - nodeCoordinates : table of coordinates of nodes
 - nodeAffected : ID of node affected by forces
 - nodeAffector : ID of node affecting forces
 - type : type of force, 'repulsive' or 'attractive'
 - KAtt, KRep : constants or weights associated to forces
 - optEdgeLength : optimum length of edge
 returns force components of resulting force by x and y.
*/
function calculateForce(nodeCoordinates, nodeAffected, nodeAffector, type, KAtt, KRep, optEdgeLength)
{
 // get difference between coordinates and distance between nodes
 var xDiff = nodeCoordinates[nodeAffected][0] - nodeCoordinates[nodeAffector][0];
 var yDiff = nodeCoordinates[nodeAffected][1] - nodeCoordinates[nodeAffector][1];
 var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
 if(distance == 0)
 {
  distance = 0.01;
 }
 
 // calculating force and determinate its orthogonal projection
 var forcePre = 0;
 var force = [0, 0];
 if(type == 'repulsive')
 {
  forcePre = KRep/Math.pow(distance, 2); 
 }
 else if(type == 'attractive')
 {
  var distEdgeDiff = distance - optEdgeLength;
  forcePre = -KAtt*Math.pow(distEdgeDiff, 2); 
 }
 var sinG = distance/xDiff;
 var sinH = distance/yDiff;
 force[0] = forcePre/sinG;
 force[1] = forcePre/sinH;

 return force;
}

/* specific case of previous function, calculates force applied on node 
by an edge. Edge is simplified to point - its center
 - nodeCoordinates : table of coordinates of nodes
 - nodeAffected : ID of node affected by forces
 - edgeCenterX and edgeCenterY : coordinates of an edge
 - KRep : constant or weight associated to force repulsive force edge<->node
 returns force components of resulting force by x and y.*/
function calculateForceEdge(nodeCoordinates, nodeAffected, edgeCenterX, edgeCenterY, KRep)
{
 // get difference between coordinates and distance between nodes
 var xDiff = nodeCoordinates[nodeAffected][0] - edgeCenterX;
 var yDiff = nodeCoordinates[nodeAffected][1] - edgeCenterY;
 var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
 if(distance == 0)
 {
  distance = 0.01;
 }
 var force = [0, 0];
 var forcePre = KRep/Math.pow(distance, 2); 
 var sinG = distance/xDiff;
 var sinH = distance/yDiff;
 force[0] = forcePre/sinG;
 force[1] = forcePre/sinH;

 return force;
}

/* calculates repulsive forces between every node and saves them to the grid.
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - KAtt, KRep : constants or weights associated to forces
  returns repulsiveForces : table of repulsive forces applied to every node.
  Structure [0<-1, 0<-2, ... 0<-n, 1<-2, ... 1<-n, ... n-1<-n]
  (force 0<-1 is force applied by 1 on 0. 0 applies de force of the same strength
  and opposite direction on 1, meaning that 0<-1 = - 1->0).
*/
function allRepulsive(nodeCoordinates, allMonomerLists, KRep)
{
 var repulsiveForces = [];
 for(var i=0; i<allMonomerLists.monomerList.length; i++)
 {
  for(var j=i+1; j<allMonomerLists.monomerList.length; j++)
  {
   var repulsiveForce = calculateForce(nodeCoordinates, i, j, "repulsive", 0, KRep, 0)
   repulsiveForces.push(repulsiveForce); 
  }
 }
 return(repulsiveForces); 
}

/* calculate sum of all repulsive forces applied to every node 
 - repulsiveForces : table of repulsive forces applied to every node.
 Structure [0<-1, 0<-2, ... 0<-n, 1<-2, ... 1<-n, ... n-1<-n]
 (force 0<-1 is force applied by 1 on 0. 0 aplies de force of the same strength
 and opposite direction on 1, meaning that 0<-1 = - 1->0).
 - allMonomerLists : lists containing information  about each monomer of peptide chains
*/
function repulsiveForceSum(repulsiveForces, allMonomerLists)
{
 repForcesSum = [];
 for(var i=0; i<allMonomerLists.monomerList.length; i++)
 {
  var rForceSum = [0,0];
  var count = i;
  var j = 0;
  var indexOfList = 0;
  while(count > 0)
  {
   rForceSum[0] -= repulsiveForces[indexOfList + count - 1][0];
   rForceSum[1] -= repulsiveForces[indexOfList + count - 1][1];
   indexOfList += allMonomerLists.monomerList.length - j - 1;
   j++;
   count--;
  }
  if(i!=allMonomerLists.monomerList.length)
  {
   for(var k=0; k<allMonomerLists.monomerList.length - j - 1; k++)
   {
    rForceSum[0] += repulsiveForces[indexOfList + k][0];
    rForceSum[1] += repulsiveForces[indexOfList + k][1];
   }
  }
  repForcesSum.push(rForceSum);
 }
 return repForcesSum;
}

/* calculate sum of all attractive forces applied to every node.
 These are applied between nodes connected by an edge 
 - nodeCoordinates : - coordinates of every node - startingNode and endingNode : ID number of nodes connected by an added edge
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - KAtt : constant or weights associated to attractive forces
 - optEdgeLength : optimum length of edge
*/
function attractiveForceSum(nodeCoordinates, allMonomerLists, KAtt, optEdgeLength)
{
 var attForcesSum = [];
 for(var i=0; i<allMonomerLists.edgeList.length; i++)
 {
  aForceSum = [0,0];
  // calculate every force contribution by every edge
  for(var j=0; j<allMonomerLists.edgeList[i].length; j++)
  {
   var attForce = calculateForce(nodeCoordinates, i, allMonomerLists.indexList.indexOf(allMonomerLists.edgeList[i][j]), 'attractive', KAtt, 0, optEdgeLength)
   aForceSum[0] += attForce[0];
   aForceSum[1] += attForce[1];
  }
  attForcesSum.push(aForceSum);
 }
 return attForcesSum;
}

/* calculates all forces applied by edges
  - nodeCoordinates : coordinates of nodes
  - allMonomerLists : lists containing information  about each monomer of peptide chains
  - KRep : weight of repulsive forces
  returns sul of forces per node */
function edgeForcesSum(nodeCoordinates, allMonomerLists, KRep)
{
 var edgeForces = [];
 for(var i = 0; i<allMonomerLists.monomerList.length; i++) //node to which forces apply
 {
  edgeForceSum = [0, 0];
  for(var j = 0; j<allMonomerLists.monomerList.length; j++) //one of starting edges
  {
   if(i != j)
   {
    for(var k = 0; k<allMonomerLists.edgeList[j].length; k++)
    {
     if((j < allMonomerLists.edgeList[j][k])&&(allMonomerLists.edgeList[j][k])){
      var edgeCenterX = (nodeCoordinates[j][0] + 
       nodeCoordinates[allMonomerLists.indexList.indexOf(allMonomerLists.edgeList[j][k])][0])/2;
      var edgeCenterY = (nodeCoordinates[j][1] + 
       nodeCoordinates[allMonomerLists.indexList.indexOf(allMonomerLists.edgeList[j][k])][1])/2;
      var edgeForce = calculateForceEdge(nodeCoordinates, i, edgeCenterX, edgeCenterY, KRep)
      edgeForceSum[0]+= edgeForce[0];
      edgeForceSum[1]+= edgeForce[1];
     }
    }
   }
  }
  edgeForces.push(edgeForceSum);
 }
 return edgeForces;
}

/* moves every node according to forces applied to them
 - nodeCoordinates : coordinates of nodes
 - repForcesSum : sum of repulsive forces applied at every node
 - width : width of area to place nodes in
 - height : length of area to place nodes in
 - paddingX and paddingY : borders around zone where nodes shouldn't be placed
 returns table of modified coordinates
*/
function displaceNodes(nodeCoordinates, repForcesSum, width, height, paddingX, paddingY)
{
 // modify every coordinate of every node
 var newNodeCoordinates = nodeCoordinates;
 for(var i=0; i<newNodeCoordinates.length; i++){
  var x = nodeCoordinates[i][0] + repForcesSum[i][0];
  var y = nodeCoordinates[i][1] + repForcesSum[i][1];
  // if values are out of acceptable limits, adjust them
  if(x > width - paddingX)
  {
   x = width - paddingX;
  }
  else if(x < paddingX)
  {
   x = paddingX;
  }
  if(y > height - paddingY)
  {
   y = height - paddingY;
  }
  else if(y < paddingY)
  {
   y = paddingY;
  } 
  newNodeCoordinates[i] = [x, y];
 }
 return newNodeCoordinates;
}

/* returns a list of optimum coordinates for a graph loaded in arrays. Used for cases other than linear peptides or simple cycle.
 Uses interactive forces between nodes in loops
 Etape 1.) Nodes are repulsing themselves retroactively.
 Etape 2.) Middles of edges are repulsing nodes.
 Etape 2.) Nodes connected by an edges are attracting themselves until certain length.
 Repeated number of times.
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - width : width of area to place nodes in
 - length : length of area to place nodes in
 - paddingX and paddingY : borders around zone where nodes shouldn't be placed
 - gLayoutAtts : parameters for calculating layout of graph, these are :
  - KRep, KERep, KAtt : constants/weights to ponderate forces (repulsive between nodes, 
 repulsive between edges and attractives respectively).
  - lapMAX, itRMAX, itEMAX, itAMAX : - number of loops for total cycles, iterations for single pass
 of node repulsion, edge-node repulsion and node attraction by edges respectively.
 returns node coordinates.
*/
function computeNodes(allMonomerLists, width, height, paddingX, paddingY, gLayoutAtts)
{
 var nodeCoordinates = initNodeCoords(allMonomerLists, width, height, paddingX, paddingY);
 for(var lap=0; lap<gLayoutAtts.lapMAX; lap++){
  for(var itR=0; itR<gLayoutAtts.itRMAX; itR++){
   var repulsiveForces = allRepulsive(nodeCoordinates, allMonomerLists, gLayoutAtts.KRep);
   var repFSum = repulsiveForceSum(repulsiveForces, allMonomerLists);
   nodeCoordinates = displaceNodes(nodeCoordinates, repFSum, width, height, paddingX, paddingY);
  }
  for(var itE=0; itE<gLayoutAtts.itEMAX; itE++){
   var edgeFSum = edgeForcesSum(nodeCoordinates, allMonomerLists, gLayoutAtts.KERep);
   nodeCoordinates = displaceNodes(nodeCoordinates, edgeFSum, width, height, paddingX, paddingY);	
  }
  for(var itA=0; itA<gLayoutAtts.itAMAX; itA++){
   var attFSum = attractiveForceSum(nodeCoordinates, allMonomerLists, gLayoutAtts.KAtt, Math.max(width, height)/((allMonomerLists.monomerList.length - 1)*2));
   nodeCoordinates = displaceNodes(nodeCoordinates, attFSum, width, height, paddingX, paddingY); 
  }
 }
 return nodeCoordinates;
}

/* computes if two edges of coordinates edge1(x1,y1,x2,y2)
and edge2(x1,y1,x2,y2) are intersecting
- edge1 and edge2 : table of 4 coordinates x1, y1, x2, y2
returns 1 (intersect) or 0 (no intersect)
*/

function computeIntersection(edge1, edge2)
{
 var start1 = [edge1[0], edge1[1]]; //edge1(x1, y1)
 var start2 = [edge2[0], edge2[1]]; //edge2(x1, y1)
 var vectorEdge1 = [edge1[2]-edge1[0], edge1[3]-edge1[1]]; //edge1(x2 - x1, y2 - y1)
 var vectorEdge2 = [edge2[2]-edge2[0], edge2[3]-edge2[1]]; //edge1(x2 - x1, y2 - y1)
 // value = (start2 - start1) x vectorEdge1(2)/(vectorEdge1 x vectorEdge2) 
 var firstValue = ((start2[0]-start1[0])*vectorEdge2[1] - (start2[1]-start1[1])*vectorEdge2[0])
  /(vectorEdge1[0]*vectorEdge2[1] - vectorEdge1[1]*vectorEdge2[0]);
 var secondValue = ((start2[0]-start1[0])*vectorEdge1[1] - (start2[1]-start1[1])*vectorEdge1[0])
  /(vectorEdge1[0]*vectorEdge2[1] - vectorEdge1[1]*vectorEdge2[0]);
 // if both of these values are between 0 and 1, segments are intersecting
 firstValue = Math.round(firstValue*100)/100;
 secondValue = Math.round(secondValue*100)/100;
 if(firstValue>0 && firstValue<1 && secondValue>0 && secondValue<1)
 {
  return 1;
 }
 else
 {
  return 0;
 }
}

/* computes total number of intersections
- nodeCoordinates : coordinates of nodes
returns number of intersection
*/
function totalIntersections(nodeCoordinates, allMonomerLists)
{
 var allIntersect = 0; //number of all intersections
 // create list of unique edges
 var uniqueEdges = [];
 for(var a=0; a<allMonomerLists.edgeList.length; a++)
 {
  for(var b=0; b<allMonomerLists.edgeList[a].length; b++)
  {
   if(allMonomerLists.indexList.indexOf(allMonomerLists.edgeList[a][b])>a)
   {
    uniqueEdges.push([a, allMonomerLists.indexList.indexOf(allMonomerLists.edgeList[a][b])]);
   }
  } 
 }
 /* we pass this table of unique edges in triangular fashion 
 (every combination is checked only once) */
 for(var a=0; a<uniqueEdges.length; a++)
 {
  for(var b=a+1; b<uniqueEdges.length; b++)
  {
   var firstEdgeX1 = nodeCoordinates[uniqueEdges[a][0]][0];
   var firstEdgeY1 = nodeCoordinates[uniqueEdges[a][0]][1];
   var firstEdgeX2 = nodeCoordinates[uniqueEdges[a][1]][0];
   var firstEdgeY2 = nodeCoordinates[uniqueEdges[a][1]][1];
   var secondEdgeX1 = nodeCoordinates[uniqueEdges[b][0]][0];
   var secondEdgeY1 = nodeCoordinates[uniqueEdges[b][0]][1];
   var secondEdgeX2 = nodeCoordinates[uniqueEdges[b][1]][0];
   var secondEdgeY2 = nodeCoordinates[uniqueEdges[b][1]][1];
   var firstEdge = [firstEdgeX1, firstEdgeY1, firstEdgeX2, firstEdgeY2];
   var secondEdge = [secondEdgeX1, secondEdgeY1, secondEdgeX2, secondEdgeY2];
   allIntersect += computeIntersection(firstEdge, secondEdge);
  }
 }
 return allIntersect;
}

/* computes mean distance between nodes and its standard deviation.
- nodeCoordinates : coordinate of every node
returns mean and standard deviation

Currently not in use */
function computeDistanceQuality(nodeCoordinates)
{
 var deviation = []; // NOT sd, but deviation per value
 var stdev = 0;
 var mean;
 for (var i = 0; i<nodeCoordinates.length; i++)
 { 
  for (var j = i+1; j<nodeCoordinates.length; j++)
  { 
   var distance = Math.sqrt(Math.pow(nodeCoordinates[i][0]-nodeCoordinates[j][0], 2) +
    Math.pow(nodeCoordinates[i][1]-nodeCoordinates[j][1], 2));
    mean += distance;
    deviation.push(distance); 
  }
 }
 
// number of distances for n nodes is n(n-1)/2
 mean /= (nodeCoordinates.length*(nodeCoordinates.length-1)/2);

 for(i = 0; i<deviation.length; i++)
 {
  stdev += Math.pow(mean - deviation[i],2)
 }
 stdev /= (nodeCoordinates.length*(nodeCoordinates.length-1)/2);
 stdev= Math.sqrt(stdev);
 return (mean, stdev);
}

/* identifies specific cases of peptides based on degree
 of every vertex/node. Takes nothing as argument, returns
 type of graph 
 - allMonomerLists : lists containing information  about each monomer of peptide chains
*/
function getPeptideType(allMonomerLists)
{
 // start by determining number of connected components (uses DFS)
 var status = []; // 0 - node undiscovered, 1 - node discovered
 for(var i=0; i<allMonomerLists.monomerList.length; i++)
 {
  status[i] = 0;	 
 }
 var nConnectedComponents = 0;
 while(status.indexOf(0)!=-1)
 {	
  nConnectedComponents++;	 
  console.log(status); 
  var node = status.indexOf(0);	 
  // initialize and run DFS
  depth_first_search(node, allMonomerLists, status);
 }
 // if there is single connected component look if specific case is present
 if(nConnectedComponents==1)
 {	
  /*stores nnumber of degree vertices
  nodeDegrees[0] - numbers of 0 degree vertexes
  nodeDegrees[1] - numbers of 1 degree vertexes
  nodeDegrees[2] - numbers of 2 degree vertexes
  nodeDegrees[3] - numbers of 3 degree vertexes
  */
  var nodeDegrees = [0,0,0,0];
  for(var i=0; i<allMonomerLists.edgeList.length; i++)
  {
   // removing duplicates if double bounds are present
   var uniqueEdgeEnds = findDuplicates(allMonomerLists.edgeList[i])[0]
   var degree = uniqueEdgeEnds.length;
   if(degree<4){
    nodeDegrees[degree] += 1; 
   }
  }
  // detect cases
  if((nodeDegrees[0] == allMonomerLists.edgeList.length))
  {
   return 'no edge';
  }
  else if((nodeDegrees[1] == 2) && (nodeDegrees[2] == (allMonomerLists.edgeList.length - 2)))
  { 
   return 'linear';
  }
  else if(nodeDegrees[2] == (allMonomerLists.edgeList.length))
  {
   return 'single cycle';
  }
  else
  {
   return 'other'; 
  }
 }
 // if 2 or more connected components
 else
 {
  return 'other';  
 }
}

/* starts DFS from node to discover connected components
 - node : node from which start DFS
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - status : list of current discovered/undiscovered status
 */
function depth_first_search(node, allMonomerLists, status)
{	
 status[node] = 1;
 for(var ed=0; ed<allMonomerLists.edgeList[node].length; ed++)
 {
  var nodeNext = allMonomerLists.indexList.indexOf(allMonomerLists.edgeList[node][ed]);	 
  // if node wasn't discovered yet recursively do the same
  if(status[nodeNext] != 1)
  {  	  
   console.log(nodeNext);
   depth_first_search(nodeNext, allMonomerLists, status); 
  }		
 }
}

/* plots nodes and edges using calculated coordinates
 - nodeCoordinates : calculated coordinates for every graph node
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields */
function plotGraph(nodeCoordinates, menuAtts, allMonomerLists, graphicAtt, interfaceElem)
{
 // resets last monomer number used, since we rewrite the canvas and we start from 0	

 for(var a=0; a<allMonomerLists.monomerList.length; a++)
 { 
  allMonomerLists.nodeNum = allMonomerLists.indexList[a];
  var gMono = createMonomerBase(nodeCoordinates[a][0], nodeCoordinates[a][1], 
   allMonomerLists.monomerList[a], allMonomerLists, graphicAtt, interfaceElem.svgId); 
  // add events if in editor
  if(graphicAtt.editor=='on')
  {
   createMonomerActions(gMono, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
  }
 }
 for(var a=0; a<allMonomerLists.monomerList.length; a++)
 {
  var uniqueEdges = findDuplicates(allMonomerLists.edgeList[a]);
  for(var b=0; b<uniqueEdges[0].length; b++)
  {
   if(uniqueEdges[0][b]>allMonomerLists.indexList[a])
   {
    drawEdgeNodesOnly(allMonomerLists.indexList[a], uniqueEdges[0][b], uniqueEdges[1][b], allMonomerLists, 
     graphicAtt, interfaceElem.svgId, interfaceElem.outputField, interfaceElem.exterNORField);
   }
  }
 }
  	
}

/*
 imports graph from NOR format and draws it
 - externField : field where result will be shown, exterior to editor
 - NORmat : NOR formade of peptide to draw
 - gLayoutAtts : parameters for calculating layout of graph
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - resLayout : attributes used for deterministic layout computation
 - interfaceElem : variables/objects of interface such as id of svg or input fields
 - colorList : list of monomer <-> color associations
*/
function importGraph(externField, NORmat, gLayoutAtts, menuAtts, allMonomerLists, graphicAtt, resLayout, interfaceElem, colorList)
{
 if(NORmat != interfaceElem.outputField.value)
 {	
  // reset all lists
  allMonomerLists.nodeNum = 0;
  allMonomerLists.monomerList = []; 
  allMonomerLists.indexList = []; 	
  allMonomerLists.edgeList = [];	
  allMonomerLists.color = [];	
  // import NOR
  NORImport(NORmat, allMonomerLists, externField, colorList);
  // import NOR
  draw(gLayoutAtts, menuAtts, allMonomerLists, graphicAtt, resLayout, interfaceElem);
 }
}

/* (re)draws a graph currently in window. Takes nothing, returns nothing.
 - gLayoutAtts : parameters for calculating layout of graph
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - resLayout : attributes used for deterministic layout computation
 - interfaceElem : variables/objects of interface such as id of svg or input fields
Note: this function is called by an event directly thus cannot have attributes.
Graphical attributes are thus passed in 'NORditor_main' as global variables. You can
set them there.
*/

function draw(gLayoutAtts, menuAtts, allMonomerLists, graphicAtt, resLayout, interfaceElem)
{
// var t0 = performance.now();
 // removes all graphics from layers
 $('#'+interfaceElem.svgId + ' .edgeLayer').empty();
 $('#'+interfaceElem.svgId + ' .nodeLayer').empty();
 var nodeCoordinates;
 var peptideType = getPeptideType(allMonomerLists);
 	 console.log('a', peptideType );
 if(peptideType == 'no edge')
 {
  if(graphicAtt.editor == 'on')
  {	 
   nodeCoordinates =  computeNodesLNEEditor(allMonomerLists, graphicAtt, resLayout, interfaceElem.svgId, 'no');
  }
  else
  {
   nodeCoordinates =  computeNodesLNEVis(allMonomerLists, graphicAtt, resLayout, interfaceElem.svgId, 'no');  
  }
 }
 else if(peptideType == 'linear')
 {
  if(graphicAtt.editor == 'on')
  {	 
   nodeCoordinates =  computeNodesLNEEditor(allMonomerLists, graphicAtt, resLayout, interfaceElem.svgId, 'yes');
  }
  else
  {
   nodeCoordinates =  computeNodesLNEVis(allMonomerLists, graphicAtt, resLayout, interfaceElem.svgId, 'yes');  
  }
 }
 else if(peptideType == 'single cycle')
 { 	 
  nodeCoordinates =  computeNodesCycle(allMonomerLists, graphicAtt, resLayout, interfaceElem.svgId);
 }
 else if(peptideType == 'other')
 {
  // resize image if few monomers are used	 
  if(graphicAtt.editor == 'off')
  {
   graphicAtt.svgWidth = resLayout.minXOther + allMonomerLists.monomerList.length*60; 
   graphicAtt.svgHeight = resLayout.minYOther + allMonomerLists.monomerList.length*50;
   if(graphicAtt.svgWidth>700)  graphicAtt.svgWidth=700;
   if(graphicAtt.svgHeight>500)  graphicAtt.svgHeight=500;
   // change svg dimensions 
   document.getElementById(interfaceElem.svgId)
    .setAttribute('width', graphicAtt.svgWidth+'px');
   document.getElementById(interfaceElem.svgId)
    .setAttribute('height', graphicAtt.svgHeight+'px'); 
  }	 
  var graphGood = false;
  var bestActualSample;
  var leastIntersect = null;
  var nTries = 0;
    
  /* we keep refreshing until there are no intersections*/
  while(!graphGood)
  {
   nodeCoordinates =  computeNodes(allMonomerLists, graphicAtt.svgWidth, graphicAtt.svgHeight, 
    graphicAtt.paddingX, graphicAtt.paddingY, gLayoutAtts);
   var nbIntersect = totalIntersections(nodeCoordinates, allMonomerLists);
   if((leastIntersect == null) || (nbIntersect < leastIntersect))
   {
    bestSample = nodeCoordinates;
    leastIntersect = nbIntersect;
   }
  
   if(leastIntersect == 0)
   {
    var graphGood = true;
   }

   nTries++;
   // if we can't get best result even after allow number of tries, we pick the best result until that point
   if(nTries > gLayoutAtts.sampleSize)
   {
    nodeCoordinates = bestSample;
    graphGood = true;
   }
  }
 }
 plotGraph(nodeCoordinates, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
 // update output field if in editor
 if(graphicAtt.editor=='on')
 {
  graphToNOR(allMonomerLists, interfaceElem.outputField);
 }
 //var t1 = performance.now();
 //console.log("Call to draw() took " + (t1 - t0) + " milliseconds.")
}

/* cleans graph and empties lists
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
*/

function clear(menuAtts, allMonomerLists, graphicAtt, interfaceElem)
{
 // if there is an element to move, reset it
 var inMove = d3.select('#'+interfaceElem.svgId).select(".monomer_group_moving").empty();
 if(!inMove)
 {
  d3.select('#'+interfaceElem.svgId).on('click', null);
  var svg = document.getElementById(interfaceElem.svgId);
  svg.onclick = svg.onclick = function(event)
  {
   svgClickHandler(event, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
  }	
 }
 // reset all lists
 resetLists(allMonomerLists)
 // empties all layers	
 $('#'+interfaceElem.svgId + ' .edgeLayer').empty();
 $('#'+interfaceElem.svgId + ' .nodeLayer').empty();
 graphToNOR(allMonomerLists, interfaceElem.outputField);
}

