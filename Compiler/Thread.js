/* 
    Lich.js - JavaScript audio/visual live coding language
    Copyright (C) 2012 Chad McKinney

	"http://chadmckinneyaudio.com/
	seppukuzombie@gmail.com

	LICENSE
	=======

	Licensed under the Simplified BSD License:

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met: 

	1. Redistributions of source code must retain the above copyright notice, this
	   list of conditions and the following disclaimer. 
	2. Redistributions in binary form must reproduce the above copyright notice,
	   this list of conditions and the following disclaimer in the documentation
	   and/or other materials provided with the distribution. 

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

	The views and conclusions contained in the software and documentation are those
	of the authors and should not be interpreted as representing official policies, 
	either expressed or implied, of the FreeBSD Project.
*/


importScripts("Objects.js", "VM.js", "Compiler.js", "../Library/Prelude.js", "../third-party/cycle.js");

var threadFunc;
var messageBox = new Array();
var queuedReceive = null;
Lich.VM.currentThread = "Actor";

Lich.VM.post = function(message)
{
	self.postMessage({ print: message });
}

Lich.post = Lich.VM.post;

function compileLich() // compile default library
{
	try
	{
		var oRequest = new XMLHttpRequest();
		var sURL = "http://"
		         + self.location.hostname
		         + "/Library/Prelude.lich";

		oRequest.open("GET",sURL,false);
		//oRequest.setRequestHeader("User-Agent",navigator.userAgent);
		oRequest.send(null)

		if(oRequest.status == 200)
		{
			var ast = Lich.parseLibrary(oRequest.responseText); // For library parsing testing
			Lich.compileAST(ast, function(res)
			{
				//Lich.VM.Print(res);
				eval(res);
			});
		}
		
		else 
		{
			Lich.post("Unable to load Prelude module.");
		}	
	}
	
	catch(e)
	{
		Lich.post(e);
	}
}

function executeThreadFunc(args, ret)
{
	forEachCps(
		args,
		function(exp, i, next)
		{
			Lich.match(exp, threadFunc.argPatterns[i], function(match)
			{
				if(match)
					next();
				else
					throw new Error("Non-matching pattern in function " + Lich.VM.PrettyPrint(threadFunc) 
						+ " . Failed on: " + Lich.VM.PrettyPrint(exp));
			});
		},

		function()
		{
			threadFunc.invoke(args, function(res)
			{
				ret(res);
			}); // CPS is making by brain break.
		}
	);
}

this.addEventListener("message", 
	function(event)
	{
		switch(event.data.type)
		{
			case "init":
				//Lich.post("Actor init event.data.func = " + event.data.func);
				threadFunc = Lich.parseJSON(event.data.func);
				var args = Lich.parseJSON(event.data.args);
				Lich.post("Actor initialized.");

				executeThreadFunc(args, function(res)
				{
					Lich.VM.Print(res);
					self.close();
				});
				break;

			case "message":
				Lich.VM.post("Actor: message");
				messageBox.push(Lich.parseJSON(event.data.message));
				
				if(queuedReceive != null)
				{
					queuedReceive();
				}
				break;

			case "finish":
				Lich.VM.post("Actor closing.");
				return self.close();

			default:
				Lich.post("Actor default event.data.type: " + event.data.type);
				break;
		}
	},
	false
);