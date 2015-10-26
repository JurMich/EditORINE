-#-------------------#--------------------------------------------------
 | EditORINE README /
 #-----------------#

 #----------#
 | Contents |
 #-#--------#--------------------#
   | 1.) Introduction            |
   | 2.) Compatibility           |
   | 3.) Format NOR explanation  |
   | 4.) Installation            | 
   | 5.) Contact                 |
   #-----------------------------#
  
 #-------------------#
 | 1.) Introduction /
 #-----------------#  

EditORINE is a program allowing to draw a graph then translate it into
a format NOR (see point 3). It also allows to draw a peptide entered in
format NOR. A separate visualizer allows to show an image of peptide
passed in parameter in format NOR. Both visualizer and editor have two 
dependencies:

- jQuery 1.11.0  - https://jquery.com/
- D3JS 3.5.6 - http://d3js.org/
- canvg - https://github.com/gabelerner/canvg

The project is under Affero General Public License 3. Author : Juraj Michalik
As for the dependencies, they are under either MIT (jQuery 1.11.0, canvg) or
BSD 3-Clause (D3JS 3.5.6) license.

 #--------------------#
 | 2.) Compatibility /
 #------------------#  
 
The program won't work on IE 8 and lower due to the fact the browser does
not support svg, which is the core of the editor. It should work on the 
later versions of IE, Opera, Mozilla, Google Chrome and Safari, but please 
feel free to contact us if the editor doesn't work properly on the browser 
you use.

 #-----------------------------#
 | 3.) Format NOR explanation /
 #---------------------------#   

Format NOR has this structure:
Monomer names separated by commas '@' edges connected to first 
monomer @[...]@ edges connected to last monomer. Example : 
 - Ala,Gly@1@0 : a small peptide of Ala and Gly connected together.

One monomer name can have multiple options if the exact monomer is 
unknown but there is limited number of possibilities for what it could 
be. In that case these options are delimited by square brackets and 
separated by pipes. Example:
 - [Ala|His],Gly@1@0 : a small peptide of either Ala or His and Gly 
 connected together.

 #-------------------#
 | 4.) Installation /
 #-----------------#   
 
First you need to obtain a .json file of monomers. You can get it at
site of NORINE (consult 'http://bioinfo.lifl.fr/norine/' for more
information) by going to '
http://bioinfo.lifl.fr/norine/rest/monomers/clusters/json'. Download 
this file and name it 'monomers.json'. Depending on your objective, your
next steps will differ:

1.) Run editor locally on Firefox:
- put 'monomers.json' into the same directory as the other files of a 
project

2.) Run editor locally on other browsers, such as Google Chrome or IE:
- replace '' in 'datas.js' by the contents of monomers.json (you should 
have 'var jsoncontents = {[...]}'). Open files 
'NORditor_main_visualizator.js' and 'NORditor_main_editor.js' and find
this line:

	d3.json('monomers.json', function(jsonContents)
	{
   
In 'NORditor_main_editor.js', it should be at line 152 - 153 (closing tag
'});' at 156) and in 'NORditor_main_visualizator.js', line 127 - 128 
(closing tag at 131). Remove the lines along with the closing tag.

3.) Run editor at the server:
Simply place your 'monomers.json' file in data directory of your site and
replace 'monomers.json' in 
'd3.json('monomers.json', function(jsonContents){' in 
'NORditor_main_visualizator.js' and 'NORditor_main_editor.js' by the 
adress/path to the file on your site. 

Editor/Visualizer can be tested using simple .html classes included.

To implement visualizer, you need to create a div first with specific ID,
which will serve as a container, then include these libraries into the 
page (or you can download them on their respective pages and include them 
directly):

-	https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js
-	https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
-	http://gabelerner.github.io/canvg/rgbcolor.js
-	http://gabelerner.github.io/canvg/canvg.js

Then include these files into the page:

-	"datas.js" (only if you copied contents of monomers.json in it)
-	"NORditor_colorize.js"
-	"NORditor_supfunc_all.js"
-	"NORditor_create_base.js"
-	"NORditor_import.js"
-	"NORditor_layout_specific.js"
-	"NORditor_main_visualizator.js"

Finally call this function in your script: 

visualizeMonomer(NOR, divID, svgID);

with NOR being the chain in NOR format of peptide you wish to visualize,
divID being the ID of div created and svgID is an ID that the svg will have 
once created (just pass unique string; svg is created by the function). 


To implement the editor, you need to create a div first with specific ID,
which will serve as a container, but in plus, you have to have an input 
field with a specific ID where the resulting format NOR will be printed 
once the editor is closed, as well as button to open it. Then include 
these libraries into the page (or you can download them on their respective 
pages and include them directly):

-	https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js
-	https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
-	http://gabelerner.github.io/canvg/rgbcolor.js
-	http://gabelerner.github.io/canvg/canvg.js

Then include these files into the page:

-	"datas.js" (only if you copied contents of monomers.json in it)
-	"NORditor_menu.js"
-	"NORditor_supfunc_all.js"
-	"NORditor_supfunc_editor.js"
-	"NORditor_move.js"
-	"NORditor_create_base.js"
-	"NORditor_create_actions.js"
-	"NORditor_edgefunc.js"
-	"NORditor_import.js"
-	"NORditor_layout_specific.js"
-	"NORditor_main_editor.js"

Finally call this function in your script: 

runNOREditor(inputID, buttonID, divID, svgID, display);

with inputID being the ID of field showing the result outside of editor,
buttonID being the identifier of button opening the editor, divID the ID
of div created and svgID is an ID that the svg will have once created 
(just pass unique string; svg is created by the function) and 'display'
a display property of divID ('block', 'none'...). 

 #--------------#
 | 5.) Contact /
 #------------#   

If you find any bug or if you have any suggestion, feel free to contact me
on juraj.michalik.2048@gmail.com.
