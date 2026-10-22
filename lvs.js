const fs = typeof require !== 'undefined' ? require('fs') : null

var test = false;

if (typeof process !== 'undefined' && process.argv[2]!==undefined) test = true;

const keypress = async () => {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}

stock = []
waste = []
build = []
suits = []

cardDisplay = function(array){
    var display = array.map(x => x.u ? " A23456789TJQK"[x.r] + "hcds"[x.s] : "--").join(' ')
    return display
}

show = function(){
    console.log("stock    "+cardDisplay(stock))
    console.log("waste    "+cardDisplay(waste))
    console.log('------------------------------------------------')
    for (n=0; n<7; n++) {
        console.log("build["+n+"] "+cardDisplay(build[n]))
    }
    console.log('------------------------------------------------')
    for (n=0; n<4; n++) {
        console.log("suits["+n+"] "+cardDisplay(suits[n]))
    }
    console.log();

}

cardImageDir = 'cards/individuals/'

cardDisplayHTML = function(card, offset = 0){
    var pos = 'position:absolute;top:' + offset + 'px;left:0;'
    if (card === undefined) return '<div class="card empty" style="' + pos + '"></div>'
    var src = card.u
        ? cardImageDir + ['heart','club','diamond','spade'][card.s] + '/' + card.r + '_' + ['heart','club','diamond','spade'][card.s] + '.png'
        : cardImageDir + 'card%20back/card_back.png'
    return '<img class="card" style="' + pos + '" src="' + src + '">'
}

showHTML = function(){
    var style = '<style>' +
        '.solitaire{font-family:sans-serif;display:inline-block;background:#0a6b2f;padding:12px}' +
        '.solitaire .row{display:flex;gap:8px;margin-bottom:16px}' +
        '.solitaire .pile{position:relative;width:100px;height:144px}' +
        '.solitaire .build{height:745px}' +
        '.solitaire .card{display:block;width:100px;height:144px}' +
        '.solitaire .card.empty{box-sizing:border-box;border:1px dashed #9c9;border-radius:6px}' +
        '.solitaire .count{position:absolute;top:0;left:0;width:100px;height:144px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;color:#fff;text-shadow:0 0 4px #000,0 0 4px #000}' +
        '.solitaire .gap{width:100px}' +
        '</style>'

    // piles are stored top card first, so draw from the back to put the top card last (on top)
    var pile = function(array, cls, spread, count = 0){
        var cards = array.length == 0 ? [undefined] : array.slice().reverse()
        return '<div class="pile ' + cls + '">' +
            cards.map((c, i) => cardDisplayHTML(c, spread ? i * 40 : 0)).join('') +
            (count > 0 ? '<span class="count">' + count + '</span>' : '') +
            '</div>'
    }

    var html = '<div class="solitaire">' + style
    html += '<div class="row">' +
        pile(stock.slice(0, 1), 'stock', false, stock.length) +
        pile(waste.slice(0, 1), 'waste', false) +
        '<div class="gap"></div>' +
        suits.map(s => pile(s.slice(0, 1), 'suit', false)).join('') +
        '</div>'
    html += '<div class="row">' + build.map(b => pile(b, 'build', true)).join('') + '</div>'
    html += '</div>'
    return html
}

writeHTML = function(){
    fs.writeFileSync(__dirname + '/table.html', '<meta http-equiv="refresh" content="1">' + showHTML())
}

result = function(){
    var totalSuits = 0;
    for (i = 0; i < 4; i++){
        if (suits[i].length > 0){
            totalSuits += suits[i][0].r
        }
    }
    return totalSuits
}

deal = function(){
    sequence = Array.from({ length: 52 }, (_, index) => index);
    for (i=0; i<sequence.length-1; i++){
        j = i + Math.floor(Math.random() * (sequence.length - i))
        temp = sequence[i]
        sequence[i] = sequence[j]
        sequence[j] = temp
    }

    next = 0;
    for (n=0; n<7; n++) {
        build[n] = []
        for (m=0; m<n+1; m++) {
            build[n][m] = {r:sequence[next]%13 + 1,s:Math.floor(sequence[next]/13),u:m==0}
            next++
        }
    }

    for (n=0; n<4; n++) suits[n] = []

    for (n=0; n<24; n++) stock[n] = {r:sequence[next+n]%13 + 1,s:Math.floor(sequence[next+n]/13),u:false}

    waste = []
}

move = function(from,to,head=0){
    to.unshift(...from.splice(0,head+1))  
}  

order = function(build){ // order build columns by number of downcards desc
    return build.map((x,i) => [i,x.reduce((a,c)=>a+(c.u?0:1),0)]).sort((a,b) => b[1]-a[1]).map(([a,b])=>a)
}

numdown = function(build){
    return build.map(x => x.reduce((a,c)=>a+(c.u?0:1),0))
}

numgap = function(build){ 
    return build.filter(c=>c.length==0).length
}

// heads = function(build){ // heads of columns with downcards
//     return build.map((x,i) => numdown(build)[i]>0 ? x[x.length-1-numdown(build)[i]] : null)
// }

// waiting = function(build){ 
//     return heads(build).filter(x => x!=null).reduce((a,c)=>c.r>a.r?c:a,{r:1,s:0,u:true})
// }

// colour = function(card){
//     return card.s%2
// }

// diffcolour = function(card1,card2){
//     return colour(card1)!=colour(card2)
// }


possibleMoves = function(){

    // build to build (full)
    var o = order(build);
    for (i = 0; i < 7; i++){
        if (build[o[i]].length > 0) {
            var head = 0;
            for (n = 0; n < build[o[i]].length; n++){
                if (build[o[i]][n].u == false){
                    head = n-1;
                    break;
                }
                if ((n == build[o[i]].length - 1) &&  (build[o[i]][n].u == true)) head = n;
            }
            for (j = 0; j < 7; j++){
                if (build[j].length == 0 && build[o[i]][head].r == 13 && head < build[o[i]].length - 1){
                    if (test) console.log("king")
                    move(build[o[i]],build[j],head)
                    if (build[o[i]].length > 0) build[o[i]][0].u = true;
                    return 1                 
                }
                if (build[j].length > 0 && (build[o[i]][head].r +  1 == build[j][0].r) && (build[o[i]][head].s + build[j][0].s)%2 == 1) {  
                    if (numdown(build)[o[i]]>0 || numgap(build)==0){ // don't vacate space unless to expose a downcard or there is no gap
                        if (test) console.log("full")
                        move(build[o[i]],build[j],head)
                        if (build[o[i]].length > 0) build[o[i]][0].u = true;
                        return 1;                       
                    }
                    else {
                        if (test) console.log("full pending")
                    }
                }
            }
        }
    }  
    
    // build to suits and expose
    for (i = 0; i < 7; i++){
        if (build[i].length > 0 && build[i][1]?.u == false && build[i][0].r == 1) {
            if (test) console.log('build to suits and expose')
            move(build[i],suits[build[i][0].s])
            if (build[i].length > 0) build[i][0].u = true;
            return 1
        }
        if (build[i].length > 0 && build[i][1]?.u == false && suits[build[i][0].s][0]?.r + 1 == build[i][0].r) {
            if (test) console.log('build to suits and expose')
            move(build[i],suits[build[i][0].s])
            if (build[i].length > 0) build[i][0].u = true;
            return 1
        }
    }

    // waste to build
    if (waste.length > 0){
        for (i = 0; i < 7; i++){
            if (build[6-o[i]].length > 0 && waste[0].r > 1 && (waste[0].r +  1 == build[6-o[i]][0].r) && (waste[0].s + build[6-o[i]][0].s)%2 == 1) {
                if (test) console.log('waste to build')
                move(waste,build[6-o[i]])
                return 1               
            } else if (waste[0].r == 13 && build[6-o[i]].length == 0) {
                if (test) console.log('waste to build')
                move(waste,build[6-o[i]])
                return 1     
            }                         
        }
    }

    // waste to suits
    if (waste.length > 0){
        if (waste[0].r == 1) {
            if (test) console.log('waste to suits')
            move(waste,suits[waste[0].s])
            return 1
        } else if ((suits[waste[0].s][0])?.r == (waste[0].r - 1)) {
            if (test) console.log('waste to suits')
            move(waste,suits[waste[0].s])
            return 1
        }
    }

    // Worry down (suits to build to enable waste card placement)
    if (waste.length > 0){
        for (i = 0; i < 7; i++){
            if (build[i].length > 0 && waste[0].r + 2 == build[i][0].r && (waste[0].s + build[i][0].s)%2 == 0) {
                for (j = 0; j < 4; j++){
                    if (suits[j].length > 0 &&
                        suits[j][0].r + 1 == build[i][0].r &&
                        (suits[j][0].s + build[i][0].s)%2 == 1
                    ) {
                        if (test) console.log('worry down')
                        move(suits[j],build[i])
                        return 1
                    }
                }
            }
        }
    }

    // Double worry down (suits to build to enable waste card placement)
    if (waste.length > 0){
        for (i = 0; i < 7; i++){
            if (build[i].length > 0 && waste[0].r + 3 == build[i][0].r && (waste[0].s + build[i][0].s)%2 == 1) {
                for (j = 0; j < 4; j++){
                    if (suits[j].length > 0 &&
                        suits[j][0].r + 2 == build[i][0].r &&
                        (suits[j][0].s + build[i][0].s)%2 == 0
                    ) {
                        for (k = 0; k < 4; k++){
                            if (suits[k].length > 0 &&
                                suits[k][0].r + 1 == build[i][0].r &&
                                (suits[k][0].s + build[i][0].s)%2 == 1
                            ) {
                                if (test) console.log('double worry down')
                                move(suits[k],build[i])
                                return 1
                            }
                        }
                    }
                }
            }
        }
    }

    // build to suits
    for (i = 0; i < 7; i++){
        if (build[i].length > 0 && build[i][0].r == 1) {
            if (test) console.log('build to suits')
            move(build[i],suits[build[i][0].s])
            if (build[i].length > 0) build[i][0].u = true;
            return 1                
        } 
        if (build[i].length > 0 && suits[build[i][0].s][0]?.r + 1 == build[i][0].r) { 
            if (test) console.log('build to suits')
            move(build[i],suits[build[i][0].s])
            if (build[i].length > 0) build[i][0].u = true;
            return 1                
        } 
    } 

    // build to build (partial)
    for (i = 0; i < 7; i++){
        if (build[i].length > 0) {
            for (j = 0; j < 7; j++){
                if (build[j].length > 0) {                
                    for (n = 1; n < build[j].length; n++){
                        if (build[j][n].u == true &&
                            build[j][n].r == suits[build[j][n].s][0]?.r + 1 &&
                            build[i][0].r != suits[build[i][0].s][0]?.r + 1 &&
                            build[i][0].r == build[j][n].r &&
                            build[i][0].s == (build[j][n].s + 2) % 4 
                        ) {
                            if (test) console.log("partial")
                            move(build[j],build[i],n-1)
                            return 1                          
                        }
                    } 
                }
            }
        }
    }

    // turn stock card
    if (stock.length > 0) {
        if (test) console.log('turn card')
        move(stock,waste)
        waste[0].u = true
        return 1
    }

    return 0
}

if (typeof process === 'undefined') {
    // running in a browser: the page drives the game
} else if (test) {
    ;(async () => {

        deal()
        writeHTML()
        var next = 1
        while(next){
            await keypress()
            next = possibleMoves()
            show()
            writeHTML()
        }

    })().then(process.exit)
} else {
    var total = 0, out = 0
    distribution = Array.from({ length: 53 }, (_, index) => 0);

    for (count = 0; count < 1000000; count++){
        deal()
        while(possibleMoves() == 1){}

        handresult = result()
        total += handresult
        if (handresult==52) out++
        distribution[handresult]++

    }
    console.log(total/1000000.0)
    console.log(out/1000000.0)
    console.log(distribution)
}













