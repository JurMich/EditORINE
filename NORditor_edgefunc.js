/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

// Handles edge cration suppression and associated lists (editor only).

/* function to switch events after the creation/cancellation of creation of an edge
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
*/
function endEdgeMode(menuAtts, allMonomerLists, graphicAtt, interfaceElem)
{
 // eliminate line creation events from svg
 d3.select('#'+interfaceElem.svgId).on('click', null);
 d3.select('#'+interfaceElem.svgId).on('mousemove', null);

 // enable default 'move' function on every monomer
 d3.select('#'+interfaceElem.svgId).selectAll('.monomer_group')
  .selectAll('.main_element').on('click', function(){
    var gMono = d3.select(this.parentNode);
 });

 var svg = document.getElementById(interfaceElem.svgId);

 // restore original enclick event of svg - creating new monomer
 svg.onclick = function(event)
 {
  menuAtts.dragged = false;	 
  svgClickHandler(event, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
 }

 // enable events for monomer buttons and edge buttons
 enableMonomerButtons(interfaceElem.svgId);

 // if IE 10+ or !IE 
 if((msieversion()>9) || (msieversion()==0))
 {
  d3.select('#'+interfaceElem.svgId).selectAll('.graph_edge').style('pointer-events','auto');
 }
 else
 {
  d3.select('#'+interfaceElem.svgId).selectAll('.graph_edge').style('pointer-events', null);
 }
}

/* removes a node and all of associated edges from corresponding tables
 - nodeNumber : number of node to eliminate
 - allMonomerLists : lists containing peptide chains
 - outputField : an 'input' field where NOR translation of a graph is output
*/
function suppressNodesAndEdges(nodeNumber, allMonomerLists, outputField1 ,outputField2)
{	
 // gets index of monomer to delete in table
 nodeNumber = parseInt(nodeNumber);
 var indexOfNode = allMonomerLists.indexList.indexOf(nodeNumber);
	
 if (indexOfNode != -1)				// this is normally not necessary, just in case
 {
  var edgesToRemove = allMonomerLists.edgeList[indexOfNode];  // list of edges to 'soon to be removed' node
  for(var i = 0; i < edgesToRemove.length; i++)
  {
   var secondNode = allMonomerLists.indexList.indexOf(edgesToRemove[i]);		// find index of 
   var secondEnd = allMonomerLists.edgeList[secondNode].indexOf(nodeNumber);
   allMonomerLists.edgeList[secondNode].splice(secondEnd, 1);
  }
  allMonomerLists.edgeList.splice(indexOfNode, 1);		// removes connections from list;
  allMonomerLists.indexList.splice(indexOfNode, 1);
  allMonomerLists.monomerList.splice(indexOfNode, 1);	
  allMonomerLists.color.splice(indexOfNode, 1);
 }
 // update output field 
 graphToNOR(allMonomerLists, outputField1, outputField2);			 	
}

/* adds edge connecting monomer number startingNode and endingNode to edgeList
 - startingNode and endingNode : ID number of nodes connected by an added edge
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - outputField : an 'input' field where NOR translation of a graph is output
 */
function addEdge(startingNode, endingNode, allMonomerLists, outputField1, outputField2)
{
 startingNode = parseInt(startingNode);
 endingNode = parseInt(endingNode);
 var indexOfStartingNode = allMonomerLists.indexList.indexOf(startingNode);
 var indexOfEndingNode = allMonomerLists.indexList.indexOf(endingNode);
 if (indexOfStartingNode != -1)
 {
  allMonomerLists.edgeList[indexOfStartingNode].push(endingNode);
 }

 if (indexOfEndingNode != -1)
 {
  allMonomerLists.edgeList[indexOfEndingNode].push(startingNode);
 }
 // update output field 
 graphToNOR(allMonomerLists, outputField1, outputField2);	
}

/* removes edge connecting monomer number startingNode and endingNode from edgeList
 - startingNode and endingNode : ID number of nodes connected by an added edge
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - outputField : an 'input' field where NOR translation of a graph is output
*/
function removeEdge(startingNode, endingNode, allMonomerLists, outputField1, outputField2)
{
 startingNode = parseInt(startingNode);
 endingNode = parseInt(endingNode);
 var indexOfStartingNode = allMonomerLists.indexList.indexOf(startingNode);
 var indexOfEndingNode = allMonomerLists.indexList.indexOf(endingNode);	
 if (indexOfStartingNode != -1)
 {
  // starting node is deleted in list of connections of ending node
  var endingNodeToDel = allMonomerLists.edgeList[indexOfStartingNode].indexOf(endingNode);
  allMonomerLists.edgeList[indexOfStartingNode].splice(endingNodeToDel, 1);
 }

 if (indexOfEndingNode != -1)
 {
  var startingNodeToDel = allMonomerLists.edgeList[indexOfEndingNode].indexOf(startingNode);
  allMonomerLists.edgeList[indexOfEndingNode].splice(startingNodeToDel, 1);
 }
 // update output field 
 graphToNOR(allMonomerLists, outputField1, outputField2);
}
