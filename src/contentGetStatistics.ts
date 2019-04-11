
import * as $ from 'jquery';
import { Mensagem, msgType, Mercado } from './types';

chrome.runtime.onMessage.addListener((msg: Mensagem) => {
    alert(msg.type);
    var jqry = document.createElement('script');
    jqry.src = "https://code.jquery.com/jquery-3.3.1.min.js";
    document.getElementsByTagName('head')[0].appendChild(jqry);

    if(msg.type !== msgType.getStatistics) return;
    
    const mkt = msg.payload as Mercado;
    generateTable(mkt.idRamos, mkt.periodoInicial, mkt.periodoFinal)
});


const generateTable = (listIdRamos: number[], periodoInicio: number, periodoFim: number) => {
    selecionarRamos(listIdRamos);
    setInitialPeriod(periodoInicio);
    setFinalPeriod(periodoFim);
    setAllCompanies();
    clickGenerateTable();
    chrome.runtime.sendMessage({ type: msgType.finishedGetStatistics, payload: null} as Mensagem)
}

const selecionarRamos = (idRamos: number[]) => 
    $("#ctl00_ContentPlaceHolder1_edRamos").val(idRamos.map(x => `0${x}      `));

const setInitialPeriod = (data: number) =>
    $("#ctl00_ContentPlaceHolder1_edInicioPer").val(data);

const setFinalPeriod = (data: number) =>
    $("#ctl00_ContentPlaceHolder1_edFimPer").val(data);

const setAllCompanies = () => 
    $("#ctl00_ContentPlaceHolder1_edEmpresas").val(["Todas"]);

const clickGenerateTable = () =>
    $("#ctl00_ContentPlaceHolder1_btnProcessao").click();


