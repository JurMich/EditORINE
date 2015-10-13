/* This is a graphical editor and visualizator allowing to draw a graph then
 * output it as a peptide in NOR format,  as well as generating a graph from
 * NOR. This program uses D3JS (http://d3js.org/) and jQuery (https://jquery.com/).
 *
 * Author: Juraj Michalik, 2015
 * License : GNU Affero General Public License 3 
 */

// contains support functions used by both editor and visualizer.

// ------------------ Text wrapper ------------------

/* wraps and centers text
- text : text to wrap and center
- width: width of objet holding a text
- height: height of object holding a text 
*/
function wrap(text, width, height){
 text.each(function(){
  // creating words by splitting them by "-" (chemical formulae) or "|" (groups) 
  var text = d3.select(this),
  words = text.text().split(/(?=[|-])/).reverse(),
  word,
  line = [],
  lineNum = 0,
  lineHeight = parseInt(text.style('font-size')), // in px
  x = text.attr('x'),
  y = text.attr('y'),
  dy = 0,
  tspan = [];					// array containing every tspan
  tspan[lineNum] = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('class', 'monomer_movable');
		
  // putting words in single line		
  while (word = words.pop())
  {
   line.push(word);
   tspan[lineNum].text(line.join(''));
   if(tspan[lineNum].node().getComputedTextLength() > width)
   {	
    line.pop();
    tspan[lineNum].text(line.join('')).attr('dx', (width - tspan[lineNum].node().getComputedTextLength())/2);
    ++lineNum;
    line = [word];
    tspan[lineNum] = text.append('tspan').attr('class', 'monomer_movable').attr('x', x).attr('y', y).text(line);
   }
  }

  // center last line
  tspan[lineNum].attr('dx', (width - tspan[lineNum].node().getComputedTextLength())/2);

  // if there is more than 4 lines of text, last line gets modified and others will be discarded
  if(lineNum > 3)
  {
   var fourthLine = tspan[3].text();
   tspan[3].text(fourthLine.substr(0, (fourthLine.length - 4)) +" ...]"); // modify fourth line
   for (var i = 4; i <= lineNum; i++)
   {
    tspan[i].text(undefined);
   }
   lineNum = 3;
  }

  offsetY = (height - ((lineNum + 1) * lineHeight))/2; //calculating vertical offset
  for(i = 0; i <= lineNum; i++)
  {
   tspan[i].attr('dy', i*lineHeight + offsetY + 'px');
  }				
 });
}

// ------------------ Duplicate finder ------------------
/* finds a duplicate values in array
returns table of 2 tables:
 - first containing unique values of array
 - second conaining their number of appareances
*/
function findDuplicates(array)
{
 var listOfValues = []; // unique values
 var bindCount = [];    // their number of apparance
 for(var i=0; i<array.length; i++)
 {
  var oldPosition = listOfValues.indexOf(array[i]);
  if(oldPosition != -1)
  {
   bindCount[oldPosition]++;
  }
  else
  {
   listOfValues.push(array[i]);
   bindCount.push(1);
  }
 }
 return [listOfValues, bindCount];
}

// ------------------ MSIE detection ------------------

// detects the if user uses ie and what version
function msieversion()
{
 var ua = window.navigator.userAgent;
 var msie = ua.indexOf("MSIE ");

 // IE<11
 if (msie > 0) 
 {
  return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
 }

 // IE==11
 var trident = ua.indexOf('Trident/');
 if (trident > 0)
 {
  var msie11 = ua.indexOf('rv:');
  return parseInt(ua.substring(msie11 + 3, ua.indexOf('.', msie11)), 10);
 }

 // Edge
 var edge = ua.indexOf('Edge/');
 if (edge > 0) 
 {
  return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
 }
 else
 {
  return 0;
 }
}
