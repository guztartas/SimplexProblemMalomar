window.onload = function() {
    $('.plus-btn').click(function() {
        $('body').toggleClass('menu-open');
    });
}

// resolve o algoritmo simplex
function solveSimplex(quantDec, quantRes, choice) {
    $("#inputValues").hide();

    var matrizSimplex = getRestrictionValues(quantDec, quantRes); //pega os valores das entradas de restrição
    matrizSimplex.push(getFunctionzValues(quantDec, quantRes)); //pega os valores das entradas da funçãoZ

    var allTables = [];
    var tablesCount = 0;
    //valor da condição para parar o loop
    var stopConditionValue = 0;

    //max iterações
    var iMax = $('#iMax').val()
    if (iMax <= 0) {
        iMax = 20;
    }

    var bValues = []

    staticTblVars = staticTableVars(quantDec, quantRes);

    //restrições iniciais na base
    varsOnBase = staticTblVars[0];

    varsOnHead = staticTblVars[1];

    //tamanho da matriz
    columnsCount = quantDec + quantRes + 1;
    rowsCount = quantRes + 1;

    for (let i = 0; i < rowsCount; i++) {
        bValues.push(matrizSimplex[i][columnsCount - 1])
    }

    //mostra a matriz inicial
    matrizToTable(matrizSimplex, "Inicial", varsOnHead, varsOnBase, rowsCount, allTables, 0);
    tablesCount++

    //enquanto a linha Z tem números negativos
    do {
        //encontra o número mais baixo na linha da função Z e sua coluna
        lowerNumberAndColumn = getLowerNumberAndColumn(matrizSimplex, rowsCount, columnsCount);
        lowerNumber = lowerNumberAndColumn[0];

        if (lowerNumber == 0) {
            break;
        }
        columnLowerNumber = lowerNumberAndColumn[1];

        //obtém o resultado inferior da divisão entre a última coluna e a coluna de número inferior (funçãoS)
        whoLeavesResults = whoLeavesBase(matrizSimplex, columnLowerNumber, columnsCount, rowsCount, varsOnBase);
        varsOnBase = whoLeavesResults[1];
        pivoRow = whoLeavesResults[0]
        pivoColumn = columnLowerNumber;
        pivoValue = matrizSimplex[pivoRow][pivoColumn];

        //obtem a matriz com atualização de linha dinâmica
        matrizSimplex = divPivoRow(matrizSimplex, columnsCount, pivoRow, pivoValue);

        //null todos os outros valores na coluna pivo
        matrizSimplex = nullColumnElements(matrizSimplex, pivoRow, pivoColumn, rowsCount, columnsCount);

        //Os valores função recebem a última linha da matriz ('linha Z')
        funczValues = matrizSimplex[rowsCount - 1];

        hasNegativeOrPositive = funczValues.some(v => v < 0);

        //incrementos condição de parada
        stopConditionValue += 1;

        if (stopConditionValue == iMax) {
            break;
        }

        //mostrar matriz parcial 
        if (hasNegativeOrPositive == true) {
            matrizToTable(matrizSimplex, "Parcial" + stopConditionValue, varsOnHead, varsOnBase, rowsCount, allTables, tablesCount);
            tablesCount++
        }

    } while (hasNegativeOrPositive == true);

    matrizToTable(matrizSimplex, "Final", varsOnHead, varsOnBase, rowsCount, allTables, tablesCount);
    senseTable(matrizSimplex, varsOnHead, varsOnBase, quantDec, bValues)
    if (choice == 1) {
        $(".container").append(allTables[stopConditionValue]);
        printResults(matrizSimplex, quantDec, quantRes, columnsCount, varsOnBase);
    } else {
        for (let i = 0; i < allTables.length; i++) {
            $(".container").append(allTables[i]);
        }
        printResults(matrizSimplex, quantDec, quantRes, columnsCount, varsOnBase);
    }

    $(".container").append('<br><div class="row"><div class="col-md-12"><button id="again" class="btn btn-next" onclick="location.reload();">Recomeçar</button></div>	</div>')
}

function senseTable(matriz, head, base, quantDec, bValues) {
    var matrizTable = [];
    var headTable = [];
    var baseTable = [];
    var restNames = []
    var restValues = []
    var minMaxValues = []

    for (let i = 0; i < matriz.length; i++) {
        matrizTable[i] = matriz[i].slice();
    }

    for (let i = 0; i < head.length; i++) {
        headTable[i] = head[i].slice();
    }

    for (let i = 0; i < base.length; i++) {
        baseTable[i] = base[i].slice();
    }

    matrizTable.unshift(headTable);

    for (let i = 1, j = 0; i <= rowsCount; i++, j++) {
        matrizTable[i].unshift(baseTable[j]);
    }

    for (let i = quantDec + 1, k = 0; i < matrizTable[0].length - 1; k++, i++) {
        restNames.push(matrizTable[0][i])
        restValues.push(matrizTable[matrizTable.length - 1][i])
        let auxArray = new Array;
        for (let j = 1; j < matrizTable.length - 1; j++) {
            let bCol = matrizTable[j][matrizTable[0].length - 1]
            let restCol = matrizTable[j][i]

            auxArray.push((bCol / restCol) * -1);
        }
        let minPos = Number.POSITIVE_INFINITY;
        let maxNeg = Number.NEGATIVE_INFINITY;
        for (let j = 0; j < auxArray.length; j++) {
            if (auxArray[j] > 0 && auxArray[j] < minPos) {
                minPos = auxArray[j]
            } else if (auxArray[j] < 0 && auxArray[j] > maxNeg) {
                maxNeg = auxArray[j]
            }
        }
        if (minPos === Number.POSITIVE_INFINITY) {
            minPos = 0
        }
        if (maxNeg === Number.NEGATIVE_INFINITY) {
            maxNeg = 0
        }
        minMaxValues.push([maxNeg + bValues[k], minPos + bValues[k]])
    }

    var senseMatriz = [];

    for (let i = 0; i < matrizTable.length - 2; i++) {
        let auxArray = new Array;
        auxArray.push(restNames[i])
        auxArray.push(restValues[i])
        senseMatriz.push(auxArray)
    }

    for (let i = 0; i < senseMatriz.length; i++) {
        for (let j = 0; j < minMaxValues[0].length; j++) {
            senseMatriz[i].push(minMaxValues[i][j])
        }
        senseMatriz[i].push(bValues[i]);
    }

    senseMatriz.unshift(['Recursos', 'Preco Sombra', 'Min', 'Max', 'Inicial']);
    if (!Boolean($('#divTableFinal'))) {
        $(".container").append('<div class="row"><h3>Tabela Final</h3></div>')
        $(".container").append('<div class="row"><div id="divFinalTableBegin" class="offset-md-2 col-md-8 offset-md-2 table-responsive"><table id="finalTableBegin" class="table table-bordered"></table></div></div>')
    }

    var table = $("#finalTableBegin");
    var row, cell;

    for (let i = 0; i < matrizTable.length; i++) {
        row = $('<tr />');
        table.append(row);
        for (let j = 0; j < matrizTable[i].length; j++) {
            if (!isNaN(matrizTable[i][j])) {
                cell = $('<td>' + (Math.round(matrizTable[i][j] * 100) / 100) + '</td>')
            } else {
                cell = $('<td>' + matrizTable[i][j] + '</td>')
            }

            row.append(cell);
        }
    }

    var row, cell;

    for (let i = 0; i < senseMatriz.length; i++) {
        row = $('<tr />');
        table.append(row);
        for (let j = 0; j < senseMatriz[i].length; j++) {
            if (!isNaN(senseMatriz[i][j])) {
                cell = $('<td>' + (Math.round(senseMatriz[i][j] * 100) / 100) + '</td>')
            } else {
                cell = $('<td>' + senseMatriz[i][j] + '</td>')
            }

            row.append(cell);
        }
    }
}
//cria uma tabela com os valores da matriz
function matrizToTable(matriz, divName, head, base, rowsCount, allTables, aux) {
    $("#auxDiv").html('<div class="row"><div id="divTable' + divName + '" class="offset-md-2 col-md-8 offset-md-2 table-responsive"><hr><div class="row"><h3>Tabela ' + divName + ':</h3></div><table id="table' + divName + '" class="table table-bordered"></table></div></div>')
    var table = $("#table" + divName);
    var row, cell;
    //copia os valores da matriz, base e principal
    var matrizTable = [];
    var headTable = [];
    var baseTable = [];

    for (let i = 0; i < matriz.length; i++) {
        matrizTable[i] = matriz[i].slice();
    }

    for (let i = 0; i < head.length; i++) {
        headTable[i] = head[i].slice();
    }

    for (let i = 0; i < base.length; i++) {
        baseTable[i] = base[i].slice();
    }

    $("#solveSimplex").remove();
    $("#stepByStep	").remove();

    //a matriz recebe os vars principal e base
    //anexa vars principal na matriz
    matrizTable.unshift(headTable);
    //define as variáveis de base no início de cada linha da matriz
    for (let i = 1, j = 0; i <= rowsCount; i++, j++) {
        matrizTable[i].unshift(baseTable[j]);
    }

    //cria as tabelas
    for (let i = 0; i < matrizTable.length; i++) {
        row = $('<tr />');
        table.append(row);
        for (let j = 0; j < matrizTable[i].length; j++) {
            if (!isNaN(matrizTable[i][j])) {
                cell = $('<td>' + (Math.round(matrizTable[i][j] * 100) / 100) + '</td>')
            } else {
                cell = $('<td>' + matrizTable[i][j] + '</td>')
            }

            row.append(cell);
        }
    }
    //salva a tabela atual em html
    allTables[aux] = $('#divTable' + divName + '')[0].outerHTML;
}

//mostra resultados
function printResults(matriz, quantDec, quantRes, columnsCount, base) {
    //$(".container").append('<br><div id="solution" class="row"></div>');

    if (($("#min").is(':checked'))) {
        var zValue = matriz[matriz.length - 1][columnsCount - 1] * -1;

    } else {
        var zValue = matriz[matriz.length - 1][columnsCount - 1]
    }

    $("#solution").append('<div class="resultFinal col-md-12">A solução ótima é Z = ' + zValue + '</div><br>');

    //imprime os valores de base vars 
    for (let i = 0; i < quantRes; i++) {
        var baseName = base[i];
        var baseValue = matriz[i][columnsCount - 1];
        $("#results").append('<div class="resultFinal">' + baseName + ' = ' + baseValue + '</div>')
    }
}

//cria a base e var principal que vão para a mesa
function staticTableVars(quantDec, quantRes) {
    base = [];
    head = [];

    //para cada restrição adiciona uma linha na base
    for (let i = 0; i < quantRes; i++) {
        base.push("f" + (i + 1));
    }
    base.push("Z");
    head.push("Base");
    //para cada restrição e decisão var adiciona uma linha no cabeçalho
    for (let i = 0; i < quantDec; i++) {
        head.push("x" + (i + 1));
    }
    for (let i = 0; i < quantRes; i++) {
        head.push("f" + (i + 1));
    }
    head.push("b");

    return [base, head];
}
//null os elementos da coluna
function nullColumnElements(matriz, pivoRow, pivoColumn, rowsCount, columnsCount) {
    for (let i = 0; i < rowsCount; i++) {

        // salta a linha do pivo e os valores já 0 na coluna do pivo
        if (i == pivoRow || matriz[i][pivoColumn] == 0) {
            continue;
        }
        //pivo aux recebe o próximo número da coluna pivo
        pivoAux = matriz[i][pivoColumn];

        //loop para coluna pivo nula
        for (let j = 0; j < columnsCount; j++) {
            //valor da matriz atual = valores da linha pivo multiplicados pelo valor pivo aux mais real da matriz negativae
            matriz[i][j] = (matriz[pivoRow][j] * (pivoAux * -1)) + matriz[i][j];

        }

    }
    return matriz
}

//divide cada valor da linha pivo / valor pivo
function divPivoRow(matriz, columnsCount, pivoRow, pivoValue) {
    for (var i = 0; i < columnsCount; i++) {
        matriz[pivoRow][i] = matriz[pivoRow][i] / pivoValue;
    }

    return matriz;
}

// divisão da coluna b e o número inferior da coluna
// adiciona a var à coluna de base e retorna a linha de resultado inferior
function whoLeavesBase(matriz, columnLowerNumber, columnsCount, rowsCount, varsOnBase) {
    var lowerResult = 99999999999999999999999;
    var lowerResultRow;

    //loop até a última linha Z sem função
    for (let i = 0; i < rowsCount - 1; i++) {
        //não permite dividir por 0
        if (!(matriz[i][columnLowerNumber] == 0)) {
            currentValue = 0;
            currentValue = matriz[i][columnsCount - 1] / matriz[i][columnLowerNumber]

            if (currentValue > 0) {
                if (currentValue < lowerResult) {
                    lowerResult = currentValue;
                    lowerResultRow = i;
                }
            }

        }
    }
    if (lowerResultRow == undefined) {
        pauseSolution()
    } else {
        //adiciona var de decisão à base
        varsOnBase[lowerResultRow] = "x" + (columnLowerNumber + 1)
        return [lowerResultRow, varsOnBase];
    }

}

//retornar os valores de entrada de restrição
function getRestrictionValues(quantDec, quantRes) {
    var resValues = [];
    var xvalue = [];
    for (let i = 1; i <= quantRes; i++) {
        xvalue = [];

        for (let j = 1; j <= quantDec; j++) {

            var input = $("input[name='X" + j + "_res" + i + "']").val();

            if (input.length == 0) {
                xvalue[j - 1] = 0;
            } else {
                xvalue[j - 1] = parseFloat(input);
            }


        }

        for (let j = 1; j <= quantRes; j++) {
            if (i == j) {
                xvalue.push(1);
            } else {
                xvalue.push(0);
            }
        }

        var input_res = $("input[name='valRestriction" + i + "']").val();

        if (input_res.length == 0) {
            xvalue.push(0);
        } else {
            xvalue.push(parseFloat(input_res));
        }

        resValues[i - 1] = xvalue;

    }
    return resValues;
}

//retornar valores de entrada da função Z
function getFunctionzValues(quantDec, quantRes) {
    var funcValues = [];
    var xvalue = [];

    var maxOrMin = (($("#max").is(':checked')) ? -1 : 1);

    for (let i = 1; i <= quantDec; i++) {
        var input = $("input[name='valX" + i + "']").val()

        if (input.length == 0) {
            xvalue[i - 1] = 0;
        } else {
            xvalue[i - 1] = parseFloat(input) * maxOrMin;
        }

    }
    funcValues = xvalue;

    for (let i = 0; i <= quantRes; i++) {
        funcValues.push(0);
    }

    return funcValues;
}

//retorna o menor número na função Z e sua coluna
function getLowerNumberAndColumn(matriz, rowCount, columnCount) {
    var column = 0;

    rowCount -= 1; // rowCount agora tem o valor correto para usar

    var lowerNumber = matriz[rowCount][0];

    //loop functionZ array para encontrar o valor numérico mais baixo 
    for (let j = 1, i = rowCount; j < columnCount - 1; j++) {
        //certifique-se de que lowerNumber tenha o menor valor
        if (matriz[i][j] < lowerNumber) {
            lowerNumber = matriz[i][j];
            column = j;
        }
    }
    return [lowerNumber, column];
}

//finaliza a aplicação
function pauseSolution() {
    $(".container").remove()

    $("body").append('<div class="container"><div class="row"><div class="offset-md-2 col-md-8 offset-md-2"><h1>Solução impossível</h1></div></div></div>');
    $(".container").append('<div class="row"><div class="offset-md-4 col-md-4 offset-md-4"><button id="back" class="btn btn-primary" onclick="location.reload();" >Voltar</button></div>	</div>')
}

//gera entradas de função Z e entradas de restrições
function firstPhase() {
    $(document).ready(function() {

        //obtem quantidade de variáveis de decisão
        var quantDec = $("input[name=quantDecision]").val();
        if (quantDec.length == 0 || quantDec == '0') {
            alert('Você precisa inserir valores na variavel de decisão');
            return;
        } else {
            quantDec = parseFloat(quantDec);
            if (quantDec < 1) {
                return;
            }
        }

        //obtem quantidade de restrições
        var quantRes = $("input[name=quantRestriction]").val();
        if (quantRes.length == 0 || quantRes == '0') {
            alert('Você precisa inserir valores na variavel de restrição');
            return;
        } else {
            quantRes = parseFloat(quantRes);
            if (quantRes < 1) {
                return;
            }
        }
        //esconda o botão da primeira fase
        $("#firstPhase").remove();
        $("#startInputs").hide();

        generateFunctionZ(quantDec);

        generateRestrictions(quantDec, quantRes);

        //adiciona um botão que chama a segunda fase do processo
        $("#inputValues").append('<div id="buttons" class="row"><div class="col-md-6 mt-3"><button id="solveSimplex" onclick="solveSimplex(' + quantDec + ',' + quantRes + ',1)" class="btn btn-next">Solução direta</button></div></div>');

        $(".container").append('<div id="solution" class="row"></div>')
        $(".container").append('<br><div class="row"><div id="results" class="col-md"></div></div>');

    });
}

// gerar entradas functionZ
function generateFunctionZ(quantDec) {
    $(".container").append('<div id="inputValues"></div>');
    $("#inputValues").append('<br><div class="row"><div class="input-group mb-3 d-flex justify-content-center align-items-center" id="funcZ"></div></div>');
    $("#funcZ").append('<h5>Função Z =</h5><span class="px-2">');
    // adiciona as entradas da função Z ao corpo da página
    for (let i = 1; i <= quantDec; i++) {

        $("#funcZ").append('<input class="input-val" type="number" name="valX' + i + '">');
        if (i != quantDec) {
            $("#funcZ").append('<div><span class="m-text">x' + i + '</span></div><span><span><button tabindex=-1 class="btn btn-success btn-lg input-plus">+</button>');
        } else {
            $("#funcZ").append('<div><span>x' + i + '</span></div>');
        }
    }
    var input = $('input[name="valX1"]');

    var input = $('input[name="valX1"]');

    input.focus();
}

//gerar entradas de restrições
function generateRestrictions(quantDec, quantRes) {
    $("#inputValues").append('<div class="row"><div class="col-md-12 mb-3 mt-3" id="divRestTitle"><h5>Restrições:</h5></div></div>');

    //adiciona as entradas de restrições ao corpo
    for (let i = 1; i <= quantRes; i++) {

        $("#inputValues").append('<div class="row"><div class="input-group mb-3 d-flex justify-content-center align-items-center" id=divRes' + i + '></div></div>');

        for (let j = 1; j <= quantDec; j++) {
            $("#divRes" + i + "").append('<input class="input-val" type="number" name="X' + j + '_res' + i + '" " >');
            if (j != quantDec) {
                $("#divRes" + i).append('<div><span class="input-val">x' + j + '</span></div><span><span><button tabindex=-1 class="btn btn-success btn-lg input-plus">+</button>');
            } else {
                $("#divRes" + i).append('<div><span>x' + j + ' </span></div>');
            }
        }
        //adiciona ao corpo a expressão '<=' e a entrada do valor de restrição
        $("#divRes" + i).append('<span></span><div><span class="equal-m"><b>&le;</b></span></div><input class="input-val" type="number" name="valRestriction' + i + '">');
    }
}