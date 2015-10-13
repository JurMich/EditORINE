/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

/* This creates interface layout of an editor, notably svg and menu. 
 */
 
/* creates an editor
 - outputField : ID of the field in which result will be shown after pressing OK
 - openEditorButton : ID of the button which redraws editor. Will associate an action to it
 - parentDivId : ID of the parent div which will hold editor
 - svgID : ID which svg will have
*/

function runNOREditor(exterNORFieldId, openEditorButtonId, parentDivId, svgId)
{
 var exterNORField = document.getElementById(exterNORFieldId);
 var openEditorButton = document.getElementById(openEditorButtonId);

 var parentDiv = document.getElementById(parentDivId);
 parentDiv.style.display='none';

 // contains graphical parameters and identifiers
 var graphicAtt = {};
 // allMonomerLists contains all lists (of nodes, edges, etc.)
 var allMonomerLists = {};
 // contains all attributes relied to menu
 var menuAtts = {};
 // contains all attributes to compute layout of a graph
 var gLayoutAtts = {};
 // contains interface elements
 var interfaceElem = {};
 // contains list of colors
 var colorList = {};
 
 // pass svg and parent div IDs to object
 interfaceElem.svgId = svgId;
 interfaceElem.parentDivId = parentDivId;
 interfaceElem.resultString = '';				  // stores result when modifications are realized
 
 // Graphical:
 graphicAtt.svgad = 'http://www.w3.org/2000/svg'; // xml adress to svg
 graphicAtt.editor = 'on';                        // indicating this is editor or visualizator

 // basic properties of svg field (canvas for editor) - width and height
 graphicAtt.svgHeight = 500;	
 graphicAtt.svgWidth = 500;

 // dimensions of a graphical representation of a monomer
 graphicAtt.rectMainHeight = 50;
 graphicAtt.rectMainWidth = 86;

 // monomer text parameters
 graphicAtt.textPadding = 5;
 graphicAtt.fontSize = 10.2; 
		
 // parameter of smaller squares
 graphicAtt.squareSmallDim = 20;

 // borders, where monomers shouldn't be placed during random generation of a monomer positions
 graphicAtt.paddingX = (graphicAtt.rectMainWidth/2 + 15);
 graphicAtt.paddingY = (graphicAtt.rectMainHeight/2 + 15);
 
 // vertical jump between monomers when linear one is drawn
 graphicAtt.verticalLimit = 100;

 // color of next drawn monomer
 graphicAtt.color = [];	
 graphicAtt.colorDragged = 'black';

 // linklist is  similar to NOR format (list of lists, each of whom contains links)		
 allMonomerLists.monomerList = [];        // enlists all monomers by name
 allMonomerLists.indexList = [];          // list of currently used indexes (because of deletion) 		
 allMonomerLists.edgeList = [];           // list of links between nodes/monomers
 allMonomerLists.nodeNum = 0;             // highest index of monomer
 allMonomerLists.color = [];              // colors for every monomer 			  	

 menuAtts.activeMonomer = '';     // name of actually selected monomer (most general by default)
 menuAtts.activeMonomersList = []; // list of currently chosen monomers
 menuAtts.conserveMonomers = false;        // if monomer is chosen
 menuAtts.dragged = false;				   // if monomer was created by dragging
 var reselect;                // element containing 'lastActiveMonomer'; used to reselect it if Ctrl was pushed but no choice from menu was made

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

 // variable to mark if menu should just change active monomer or rename an element

 menuAtts.renameMonomer = false;

 // text field, which will contain output of editor, thus needs to be created first
 interfaceElem.outputField = document.createElement('input'); 
 interfaceElem.outputField.readOnly = true;

 // adds listener to document for Ctrl to allow multiple selection
 // listener to pressing of Ctrl
 document.addEventListener("keydown", function(event){
  if((event.ctrlKey) && (menuAtts.conserveMonomers == false)){
   menuAtts.conserveMonomers = true;
  }		
 });

 // listener to releasing of Ctrl 
 document.addEventListener("keyup", function(event){
  if(!event.ctrlKey){
   menuAtts.conserveMonomers = false;
  }		
 });
 
  // if Ctrl is pressed and window loses focus
 document.addEventListener("blur", function(event){
  menuAtts.conserveMonomers = false;
 });	

 // contains all elements of editor
 var container = document.createElement('div');
 container.className = 'editor_container';
 parentDiv.appendChild(container);

 // .div containing menu, search and svg
 var editorDiv = document.createElement('div');
 editorDiv.className = 'editor_main_window';
 container.appendChild(editorDiv);

 // .div menu and search
 var leftBlockDiv = document.createElement('div');
 leftBlockDiv.className = 'editor_left_block';
 
 // .search field
 interfaceElem.searchField = document.createElement('input'); 
 interfaceElem.searchField.className = 'editor_search_field';
 
 // .div containing texttfield showing monomers ad
 var activeMonomerDiv = document.createElement('div');
 activeMonomerDiv.className = 'editor_active_monomers';
 interfaceElem.activeMonomerField = document.createElement('input'); 
 interfaceElem.activeMonomerField.className = 'active_monomers_field';
 interfaceElem.activeMonomerField.readOnly = true;
 var activeMonomerClearButton = document.createElement('button'); 
 activeMonomerClearButton.innerHTML = 'Clear';
 activeMonomerClearButton.className = 'editor_clear_monomers'
 activeMonomerClearButton.setAttribute('type', 'button');
  // resets active monomer as well as associated list
 activeMonomerClearButton.onclick = function(){
  d3.select('#'+interfaceElem.parentDivId).selectAll('p.editor_menuItemSelected').attr('class', 'editor_menuItem');
  menuAtts.activeMonomersList = [];
  menuAtts.activeMonomer = ''; 
  graphicAtt.color = [];	
  interfaceElem.activeMonomerField.value = '';  
 };
 activeMonomerDiv.appendChild(interfaceElem.activeMonomerField);
 activeMonomerDiv.appendChild(activeMonomerClearButton);
 
 // function to make menu of monomers
 d3.json('monomers.json', function(jsonContents)
 {
  leftBlockDiv.appendChild(interfaceElem.searchField);	  
  constructMenu(jsonContents, leftBlockDiv, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList);
  leftBlockDiv.appendChild(activeMonomerDiv);
 });
 
 interfaceElem.searchField.onkeyup = function(){
  searchMonomers(interfaceElem);
 }

 //. div containing svg
 var svgDiv = document.createElement('div');
 svgDiv.className = 'svg_window'; 
 svgDiv.style.cssText = 'width:'+graphicAtt.svgWidth+
  'px;height:'+graphicAtt.svgHeight+'px;'; 
 editorDiv.appendChild(svgDiv);
 svgDiv.style.cssText = 'display:auto;';
 
 // drop event on container holding svg
 svgDiv.ondragenter = function(event)
 {
  event.preventDefault(); 
 }
 svgDiv.ondragover = function(event)
 {
  event.preventDefault();
 };
 svgDiv.ondragleave = function(event)
 {
  event.preventDefault(); 
 };
 svgDiv.ondrop = function(event)
 {
  event.preventDefault();
  var transferred = event.dataTransfer.getData('text').split(' ');
  if(transferred[0] == interfaceElem.svgId)
  {
   menuAtts.activeMonomer = transferred[1];
   svgClickHandler(event, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
  } 
 }

 // create svg (main window of editor)
 var svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
 svg.className = 'svg';
 svg.id = svgId;
 svg.setAttribute('width', graphicAtt.svgWidth+'px');
 svg.setAttribute('height', graphicAtt.svgHeight+'px');
 svg.onclick = function(event)
 {
  menuAtts.dragged = false;
  svgClickHandler(event, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
 };
 svg.ondragleave = function(event)
 {
  event.preventDefault(); 
 };
 // add drag reception for menu elements (creates monomer by dragging)
 svgDiv.appendChild(svg);
 editorDiv.appendChild(leftBlockDiv);
 
 /* svg has not z-index and alements are ordered by drawing order.
 Thus we create layer with edges and on top of it, layer with nodes - monomers. */
 var edgeLayer = d3.select('#'+interfaceElem.svgId).append('g').attr('class', 'edgeLayer'); // lower layer (nodes)
 var nodeLayer = d3.select('#'+interfaceElem.svgId).append('g').attr('class', 'nodeLayer'); // will be rendered later, so positionned on top

 var spaceDiv = document.createElement('div');
 spaceDiv.style.cssText = 'height:15px;width:100%;';
 container.appendChild(spaceDiv);
 
 // adds text field and button to print out NOR format of drawn graph
 var convertBar = document.createElement('div');
 convertBar.className = 'editor_convertBar';
 var NORtextForm = document.createElement('FORM'); 
 NORtextForm.style.width = 'auto';
 var confirmButton = document.createElement('button');	// button which starts import action
 convertBar.style.cssText = 'height:30px;width:500px;text-align:center;';
 interfaceElem.outputField.setAttribute('type', 'text');		
 interfaceElem.outputField.setAttribute('size', '40');
 interfaceElem.outputField.style.cssText = 'font-size:12px;';
 confirmButton.innerHTML = 'OK';
 confirmButton.setAttribute('type', 'button');
 confirmButton.onclick = function(){
  var finalNOR = interfaceElem.outputField.value;
  parentDiv.style.display = 'none';
  exterNORField.value = finalNOR; 
  interfaceElem.resultString = finalNOR; 
 }
 NORtextForm.setAttribute('onsubmit', 'return false');
 NORtextForm.appendChild(interfaceElem.outputField);
 NORtextForm.appendChild(confirmButton);
 convertBar.appendChild(NORtextForm);
 container.appendChild(convertBar);

 // adds fields to load a file (not used yet)
 var importOption = document.createElement('div');
 var importForm = document.createElement('FORM'); 
 var importField = document.createElement('input'); 	// field containing chosen file
 var importButton = document.createElement('button');	// button which starts import action
 importOption.style.cssText = 'height:30px;width:700px;text-align:center;';
 importField.setAttribute('type', 'file');		
 importField.setAttribute('size', '50');
 importButton.innerHTML = 'Import NOR File';
 importButton.setAttribute('type', 'button');
 importOption.onclick = function()
 {
  importForm.submit();
  var filez = importField.files[0]; 
 };
 importForm.setAttribute('onsubmit', 'return false');
 importForm.appendChild(importButton);
 importForm.appendChild(importField);
 importOption.appendChild(importForm);
 // parentDiv.appendChild(importOption);

 var clearButtonDiv = document.createElement('div');
 clearButtonDiv.className = 'editor_clear_redraw';
 container.appendChild(clearButtonDiv);	

 // adds button to refresh a layout
 var refreshDiv = document.createElement('div');	
 var refreshButton = document.createElement('button');	// button which starts import action
 refreshButton.innerHTML = 'Redraw';
 refreshButton.setAttribute('type', 'button');
 refreshButton.onclick = function()
 {
  draw(gLayoutAtts, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
 };
 refreshDiv.appendChild(refreshButton);
 var resetButton = document.createElement('button');	// button which starts import action
 resetButton.innerHTML = 'Clear';
 resetButton.setAttribute('type', 'button');
 resetButton.onclick = function()
 {
  clear(menuAtts, allMonomerLists, graphicAtt, interfaceElem);
 };
 refreshDiv.appendChild(resetButton);
 clearButtonDiv.appendChild(refreshDiv);
 
 var emptyDiv = document.createElement('div');	
 emptyDiv.style.cssText = 'height:12px;width:700px;text-align:center;';
 container.appendChild(emptyDiv);

 // add show editor and draw action to a button/link click
 openEditorButton.onclick = function()
 {
  parentDiv.style.display ='block';
  importGraph(exterNORField, exterNORField.value, gLayoutAtts, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList);

 };
}