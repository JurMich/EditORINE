/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

// creates menu and its events (editor only)

// ------------------ Menu Building Functions ------------------

/* builds up menu from given .json file
 - jsondata : object containing list in .json format
 - container : div object holding menu AND svg
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
 - colorList : list of monomer <-> color associations
*/
function constructMenu(jsondata, container, menuAtts, allMonomerLists,
 graphicAtt, interfaceElem, colorList)
{ 	
 container.appendChild(createMenu(jsondata.cluster, menuAtts, 
  allMonomerLists, graphicAtt, interfaceElem, colorList));
}

/* function building root of list and calling following functions
 - nodes : list of .json objects
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
 - colorList : list of monomer <-> color associations 
returns menu */
function createMenu(nodes, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList)
{
 // creates scrolling box for menu
 var menuBox = document.createElement('div');
 menuBox.className = 'menuDiv';

 // creates root of menu called "X" (not in .json so treated specifically)
 var menu = document.createElement('UL');
 menu.id = 'monomer_menu';
 menu.className = 'editor_menuItem';
 var level = 0;
 var li = document.createElement('LI');
 var p = document.createElement('P');
 var span = document.createElement('span');
 p.innerHTML = '<span class=\'color_marker\' style=\'color:hsl(0, 0%, 15%);\'>&#x25B2;</span> X';
 p.className = 'editor_menuItem';
 p.draggable = true;
 p.id = 'X';
 colorList[p.id] = 'hsl(0, 0%, 15%)';
 // drag for elements
 p.ondragstart = function(event){
  menuAtts.dragged = true;
  // add monomer only if not in list already
  var temporaryActiveMonos = menuAtts.activeMonomer;
  var copiedActiveMonoList = menuAtts.activeMonomersList.slice();
  if(copiedActiveMonoList.indexOf(p.id) == -1)
  {
   graphicAtt.colorDragged = d3.select(this).select('.color_marker').style('color');
   copiedActiveMonoList.push(p.id);
   temporaryActiveMonos = monomerList2Str(copiedActiveMonoList);
  }
  event.dataTransfer.setData('text', interfaceElem.svgId+' '+temporaryActiveMonos);
 };
 p.display = 'block'
 li.appendChild(p);
 level++; // this indicates current level in list (indentation)	
 li.appendChild(parseNodes(nodes, level, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList)[0]);
 p.onclick = (function (event)
 {
  var selectedMenuItem = d3.select(this);
  changeMonomer("X", selectedMenuItem, menuAtts, allMonomerLists, graphicAtt, interfaceElem);	
 });
 $(p).children('.color_marker').css('cursor', 'pointer');
 $(p).children('.color_marker').click(function(event){
  event.stopPropagation(); 
  var thisSpanButton = $(this);
  var lowerList = $(this).parent().parent().children('ul'); 
  if(lowerList.css('display')!='none')
  {
   lowerList.css('display','none');
   thisSpanButton.html('&#x25BC;');
  }	
  else
  {
   lowerList.css('display','block');	 
   thisSpanButton.html('&#x25B2;'); 
  }	
 });
 p.style.cssText = 'padding-left:' + (level*10) + 'px';
 menu.appendChild(li);
 menuBox.appendChild(menu);	

 level--;
 return menuBox;	
}

/* function building 'ul' elements
 - node : single .json object 
 - level : actual level in a list
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
 - colorList : list of monomer <-> color associations
 returns a constructed part of list and actual level;
*/
function parseNodes(nodes, level, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList)
{
 // creates nested ul list if array present	
 var ul = document.createElement('UL');
 ul.className = 'editor_menuItem';
 level++;
 for(var i = 0; i<nodes.length; i++){
  ul.appendChild(parseNode(nodes[i], level, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList)[0]);
 }
 level--;
 return [ul, level];
}

/* function building 'li' elements of .JSON list 
 - node : single .json property (might contain .json objects) 
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
 - colorList : list of monomer <-> color associations
 returns a constructed part of list and actual level
*/
function parseNode(node, level, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList)
{
 // creates li element(s) of ul list
 var li = document.createElement('LI');
 var p = document.createElement('P');
 p.id = node.name;
 if(node.name=="Unclustered")
 {
  node.color = 'hsl(308, 100%, 40%)'	 
 }
 p.innerHTML = '<span class=\'color_marker\' style=\'color:'+node.color+';\'>&#x25B2;</span> ' + node.name;
 colorList[p.id] = node.color;
 p.className = 'editor_menuItem';
 p.draggable = true;
 p.ondragstart = function(event){
  menuAtts.dragged = true;
  // add monomer only if not in list already
  var temporaryActiveMonos = menuAtts.activeMonomer;
  var copiedActiveMonoList = menuAtts.activeMonomersList.slice();
  if(copiedActiveMonoList.indexOf(p.id) == -1)
  {
   graphicAtt.colorDragged = d3.select(this).select('.color_marker').style('color');
   copiedActiveMonoList.push(p.id);
   temporaryActiveMonos = monomerList2Str(copiedActiveMonoList);
  }
  event.dataTransfer.setData('text', interfaceElem.svgId+' '+temporaryActiveMonos);
 };
 p.style.cursor = 'default';
 p.display = 'block'
 p.style.cssText = 'padding-left:' + (level*10) + 'px';
 li.appendChild(p);	
 level++;

 // treating differents object attributes 
 if(node.monomer)
 { 
  if(node.monomer.length>0)
  {	 	  
   li.appendChild(parseNodes(node.monomer, level, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList)[0]);
   var thisSpanButton = $(p).children('.color_marker');
   var lowerList = $(p).parent().children('ul'); 
   thisSpanButton.css('cursor', 'pointer');
   $(p).children('.color_marker').click(function(event){
    event.stopPropagation(); 
    if(lowerList.css('display')!='none')
    {
     lowerList.css('display','none');
     thisSpanButton.html('&#x25BC;');
    }	
    else
    {
     lowerList.css('display','block');	 
     thisSpanButton.html('&#x25B2;'); 
    }
   });
   lowerList.css('display','none');
   thisSpanButton.html('&#x25BC;');
   p.onclick = (function (event){
			
    var selectedMenuItem = d3.select(this);
    changeMonomer(node.name, selectedMenuItem, menuAtts, allMonomerLists, graphicAtt, interfaceElem);	
   });
  }
 }
 if(node.cluster)
 {
  if(node.cluster.length>0)
  {	 	 
   li.appendChild(parseNodes(node.cluster, level, menuAtts, allMonomerLists, graphicAtt, interfaceElem, colorList)[0]); 
   $(p).children('.color_marker').css('cursor', 'pointer');
   $(p).children('.color_marker').click(function(event){
    event.stopPropagation(); 
    var thisSpanButton = $(this);
    var lowerList = $(this).parent().parent().children('ul'); 
    if(lowerList.css('display')!='none')
    {
     lowerList.css('display','none');
     thisSpanButton.html('&#x25BC;');
    }	
    else
    {
     lowerList.css('display','block');	 
     thisSpanButton.html('&#x25B2;'); 
    }	
   });
   p.onclick = (function (event){
   var selectedMenuItem = d3.select(this);
   changeMonomer(node.name, selectedMenuItem, menuAtts, allMonomerLists, graphicAtt, interfaceElem);

   });
  }
 }
 if(!(node.cluster) && !(node.monomer))
 {
  $(p).children('.color_marker').html('&#x25B0;');	 
  p.onclick = function (event){	

   var selectedMenuItem = d3.select(this);
   changeMonomer(node.name, selectedMenuItem, menuAtts, allMonomerLists, graphicAtt, interfaceElem);
  };
 }
 
 level--;
 return [li, level];
}

//  ------------------ Menu and Rename Event Functions ------------------

/* changes the name of active monomer after its selection from menu
 - monomerName : variable stocking name of monomer currently chosen
 - selectedItem : name of monomer selected from menu 
 - menuAtts : properties of menu (currently selected monomer etc.)
 - allMonomerLists : lists containing information  about each monomer of peptide chains
 - graphicAtt : object containing all graphical parameters
 - interfaceElem : variables/objects of interface such as id of svg or input fields
*/
function changeMonomer(monomerName, selectedItem, menuAtts, allMonomerLists, graphicAtt, interfaceElem)
{	
 if(selectedItem.attr('class') == 'editor_menuItem')
 {
  // change class to selected item
  selectedItem.attr('class', 'editor_menuItemSelected');
  menuAtts.activeMonomersList.push(monomerName);
  menuAtts.activeMonomer = monomerList2Str(menuAtts.activeMonomersList);
  graphicAtt.color.push(selectedItem.select('.color_marker').style('color'));
  interfaceElem.activeMonomerField.value = menuAtts.activeMonomer;
 }	  
 else if(selectedItem.attr('class') == 'editor_menuItemSelected')
 {
  selectedItem.attr('class', 'editor_menuItem');
  var indexOfDeselect = menuAtts.activeMonomersList.indexOf(monomerName)
  if(indexOfDeselect != -1)
  {
   menuAtts.activeMonomersList.splice(indexOfDeselect, 1);
   menuAtts.activeMonomer = monomerList2Str(menuAtts.activeMonomersList);
   graphicAtt.color.splice(indexOfDeselect, 1); // removing unselected color
   interfaceElem.activeMonomerField.value = menuAtts.activeMonomer; 
  }
 }
}

/* transforms list of monomers to string
 - activeMonomersList : list of currently chosen monomers
*/
function monomerList2Str(activeMonomersList)
{
 if(activeMonomersList.length == 0)
 {
  return '';	 
 }
 if(activeMonomersList.length == 1)
 {
  return activeMonomersList[0];	 
 }
 else
 {
  var activeMonomer = '[';
  for(var i=0; i<activeMonomersList.length; i++)
  {
   activeMonomer += activeMonomersList[i];
   if(i<(activeMonomersList.length-1))
   {
    activeMonomer += '|';
   } 
  }
  activeMonomer += ']';
  return activeMonomer;	 
 }
}

/* shows only monomers whose name contains value
 - interfaceElem : variables/objects of interface such as id of svg or input fields
*/
function searchMonomers(interfaceElem)
{
 var searchedValueTrim = interfaceElem.searchField.value;
 searchedValueTrim.replace(/\s+/, "") ;
 if(searchedValueTrim == '')
 {
  d3.select('#'+interfaceElem.parentDivId).selectAll('p.editor_menuItem').style('display', 'block');  
  d3.select('#'+interfaceElem.parentDivId).selectAll('p.editor_menuItemSelected').style('display', 'block');	  
 }
 else
 {	 
  var searchedValueReg = interfaceElem.searchField.value.replace(/(?=[\/\\^$*+?.()|{}[\]])/g, "\\");
  searchedValueReg = new RegExp(searchedValueReg, 'i'); 
  d3.select('#'+interfaceElem.parentDivId).selectAll('p.editor_menuItem').each(function(){	  
   if(d3.select(this).attr('id').match(searchedValueReg))
   {
	d3.select(this).style('display', 'block'); 
   }
   else
   {
	d3.select(this).style('display', 'none');    
   }
  });
  
  d3.select('#'+interfaceElem.parentDivId).selectAll('p.editor_menuItemSelected').each(function(){	  
   if(d3.select(this).attr('id').match(searchedValueReg))
   {
	d3.select(this).style('display', 'block'); 
   }
   else
   {
	d3.select(this).style('display', 'none');    
   }
  });
 } 
}
