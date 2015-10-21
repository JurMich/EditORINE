/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

// contains support functions used only by editor, notably switches for events and such

// ------------------ Graph to NOR Converter ------------------

/* uses indexlist - list of indexed monomers, monomerList - list of their names, and edgeList - list of their edges
to constuct the NOR format, which is then directly shown in outputField
 - allMonomerLists : lists containing peptide chains
 - outputField : an 'input' field where NOR translation of a graph is output */
function graphToNOR(allMonomerLists, outputField1, outputField2)
{	
 var NORmat = allMonomerLists.monomerList.join(",");
 NORmat = NORmat + '@';
 for(i = 0; i < allMonomerLists.edgeList.length; i++)
 {
  nodeConnections = allMonomerLists.edgeList[i];	// indexes by default (with possible holes due to deletion)
  reassigned = [];		// replaces indexes given to monomers by their order numbers (no holes)
		
  for(j = 0; j < nodeConnections.length; j++){
   var reassignedIndex = allMonomerLists.indexList.indexOf(nodeConnections[j]);
   reassigned.push(reassignedIndex);
  }
  reassigned.sort(function(a, b){return a-b})
  NORmat = NORmat + reassigned.join(",")
  if(i < (allMonomerLists.edgeList.length - 1)){
   NORmat = NORmat + '@';
  }
 } 
 if(NORmat == '@'){
  NORmat = '';
 }
 outputField1.value = NORmat;
 if(outputField2 != undefined)
 {
  outputField2.value = NORmat;	 
 }
}

// ------------------ Event enablers and disablers ------------------

// disables all events for all monomer buttons
function disableMonomerButtons(svgId)
{
 d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.delete_element').style('pointer-events','none');
 d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.chain_element').style('pointer-events','none');
 d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.rename_element').style('pointer-events','none');
}

// enables all events for all monomer buttons
function enableMonomerButtons(svgId)
{
 // if IE 10+ or !IE 
 if((msieversion()>9) || (msieversion()==0))
 {
  d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.delete_element').style('pointer-events','auto');
  d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.chain_element').style('pointer-events','auto');
  d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.rename_element').style('pointer-events','auto');
 }
 else
 {
  d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.delete_element').style('pointer-events', null);
  d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.chain_element').style('pointer-events', null);
  d3.select('#'+svgId).selectAll('.monomer_group').selectAll('.rename_element').style('pointer-events', null);
 }
}

// ------------------ Update list when renamed ------------------

/* changes the name of monomer in list when rename function was used
 - monomerId : ID of renamed monomer
 - newName : new name of monomer
 - allMonomerLists : lists containing peptide chains  
 * */
function updateMonomerList(monomerId, newName, allMonomerLists)
{
 var nodeNumber = parseInt(monomerId.split("_")[1]);
 var indexOfNode = allMonomerLists.indexList.indexOf(nodeNumber);	// get order number of monomer, thus position in monomerList
 if(indexOfNode != -1){
  allMonomerLists.monomerList[indexOfNode] = newName; 			// changes name of monomer
 }		
}
