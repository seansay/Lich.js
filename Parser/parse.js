//require Parser/tokenize.js
//        Parser/preL.js
//        Parser/iterL.js
//        Parser/parser.js
         
Lich.ParseError = function(msg,pos){
  this.msg = msg;
  this.pos = pos;
};

Lich.ParseError.prototype.toString = function(){
  return this.msg;
};
 
Lich.parse = function(input) {
    var x = Lich.Parser.tokenize.parse(input);
    var y = Lich.Parser.preL(x);
    LichParser.lexer = new iterL();

    LichParser.yy.parseError = function (str, hash) {
        if (LichParser.yy.lexer.debugArr !== undefined)
            console.log("parse error happened, lexer has so far returned:  " + LichParser.yy.lexer.debugArr)
        if (!LichParser.yy.lexer.parseError()) {
            throw new Lich.ParseError(str + " expected: " + hash.expected +
                                 "  Lexer returned: " + LichParser.yy.lexer.recent,
                                  LichParser.yy.lexer.yylloc);
        } 
    }
    
    return LichParser.parse(y);
}

