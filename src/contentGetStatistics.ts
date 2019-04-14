
import * as $ from 'jquery';
import { Mensagem, msgType, Mercado } from './types';

// var jqry = document.createElement('script');
// jqry.src = "https://code.jquery.com/jquery-3.3.1.min.js";
// document.getElementsByTagName('head')[0].appendChild(jqry);

chrome.runtime.sendMessage({
    type: msgType.getNext, payload: null
} as Mensagem, function(response) {
    if(!response)
        return;

    const mkt = response as Mercado;

    fulfillFields(mkt.idRamos, mkt.nome, mkt.periodoInicial, mkt.periodoFinal);
})

const fulfillFields = (listIdRamos: number[], mktName: string, periodoInicio: number, periodoFim: number) => {
    if(!validateRamos(listIdRamos, mktName)) return;
    selectRamos(listIdRamos);
    setInitialPeriod(periodoInicio);
    setFinalPeriod(periodoFim);
    setAllCompanies();
    clickGenerateTable();
}
const listAllRamos = (): number[] =>
    [...($("#ctl00_ContentPlaceHolder1_edRamos")[0] as any).options].map(x => parseInt(x.value, 10));

const validateRamos = (idRamos: number[], mktName: string): boolean => {
    var idRamoNotFound = idRamos.find(x => !listAllRamos().find(z => z === x));
    if(idRamoNotFound){
        alert(`Id Ramo ${idRamoNotFound} not found to market ${mktName}`);
        return false;
    }

    return true;
}

const selectRamos = (idRamos: number[]) => 
    $("#ctl00_ContentPlaceHolder1_edRamos").val(idRamos.map(x => `${padLeft(x, 4, '0')}      `));

const setInitialPeriod = (data: number) =>
    $("#ctl00_ContentPlaceHolder1_edInicioPer").val(data);

const setFinalPeriod = (data: number) =>
    $("#ctl00_ContentPlaceHolder1_edFimPer").val(data);

const setAllCompanies = () => 
    $("#ctl00_ContentPlaceHolder1_edEmpresas").val(["Todas"]);

const clickGenerateTable = () =>
    $("#ctl00_ContentPlaceHolder1_btnProcessao").click();




const padLeft = function (src, n ,str){
    return Array(n - String(src).length+1).join(str||'0')+src;
}

