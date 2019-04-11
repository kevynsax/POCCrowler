
import * as $ from 'jquery';
import { EstatisticaEmpresa, Mercado, Mensagem, msgType } from "./types";

chrome.runtime.onMessage.addListener((msg: Mensagem) => {
    var jqry = document.createElement('script');
    jqry.src = "https://code.jquery.com/jquery-3.3.1.min.js";
    document.getElementsByTagName('head')[0].appendChild(jqry);

    if(msg.type !== msgType.getTableData) return;

    const market = getMetadata();
    const tableData = getTable();

    const newMsg: Mensagem = {
        type: msgType.finishedGetTableData, 
        payload: {metadata: market, tableData}};

    chrome.runtime.sendMessage(newMsg);
});

const getMetadata = (): Mercado => ({
    idRamos: $("#ctl00_ContentPlaceHolder1_lblRamos")[0].innerText.split(", ").map(x => parse(x)),
    periodoInicial: parse($("#ctl00_ContentPlaceHolder1_lblPeriodoDe")[0].innerText),
    periodoFinal: parse($("#ctl00_ContentPlaceHolder1_lblPeriodoAte")[0].innerText)
} as Mercado)

const getTable = (): EstatisticaEmpresa[] => {
    var lines = [... $("#ctl00_ContentPlaceHolder1_gvSaida tbody tr")].map((x: any) => [...x.cells].map(x => x.innerText));
    return lines.slice(1, lines.length-2).map(x => ({
        idSusep: parse(x[0]),
        empresa: x[1],
        premioEmitido: parse(x[6]),
        premioGanho: parse(x[7]),
        despesaResseguro: parse(x[8]),
        sinistroOcorrido: parse(x[11]),
        receitaResseguro: parse(x[12]),
        despesaComercial: parse(x[15]),
        sinistralidade: parseFloat(replaceAll(x[16], /\,/, ".")),
        rvne: parse(x[17])
    }));
}

const parse = (num: string) => parseInt(replaceAll(num, /\./,""), 10);

const replaceAll = function(target, search, replacement) {
    return target.replace(new RegExp(search, 'g'), replacement);
};