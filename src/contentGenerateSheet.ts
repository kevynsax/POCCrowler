import { msgType, Mensagem, Mercado, GrupoEmpresarial, EstatisticaEmpresa, PayloadConfigs } from "./types";
import * as $ from 'jquery';
import * as Excel from 'exceljs';

const ExcelJS = require("exceljs/dist/es5/exceljs.browser");


interface lineSheetData{
    premioEmitidoEmpresaAgrupada: number;
    idSusep: number;
    empresa: string;
    premioEmitidoAtu: number;
    mktShare: string;
    premioEmitidoAnt: number;
    var: string;
    premioGanho: number;
    despesaResseguro: number;
    sinistroOcorrido: number;
    receitaResseguro: number;
    despesaComercial: number;
    sinistralidade: number;
    rvne: number;
    isGroup: boolean
}

const messager = chrome.runtime.sendMessage;

messager({
    type: msgType.getDataToExport
} as Mensagem, response => {
    if(!response)
        return;

    const lst = response as Mercado[];

    messager({ type: msgType.getConfigs } as Mensagem, 
        (configs: PayloadConfigs) => generateSpreadSheet(lst, configs.aggregatedCompanies, configs.nameExportedFile));    

})

const generateSpreadSheet = (listaMarket: Mercado[], lstGroups: GrupoEmpresarial[], nameExportedFile: string) => {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.creator = "Tony Vandré Klava";
    workbook.properties.date1904 = true;

    workbook.views = [
        {
          x: 0, y: 0, width: 10000, height: 20000,
          firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
    ];

    listaMarket.forEach(item => generateSheet(workbook, item, lstGroups));
    downloadFile(workbook, nameExportedFile);
}

const generateSheet = (workbook: Excel.Workbook, mkt: Mercado, lstGroups: GrupoEmpresarial[]) => {
    const sheet = workbook.addWorksheet(mkt.nome, {
        views: [{showGridLines: true}]
    });
    const labelPeriodoInicial = mkt.periodoFinal.toString().substr(0,4);
    const labelPeriodoFinal = mkt.periodoFinal.toString().substr(4,2);
    const firsLabel = `YTD ${labelPeriodoInicial}/${labelPeriodoFinal}  - ${mkt.nome} (${mkt.idRamos.join(', ')})`;
    const columns = [
        { id: "empresa", name: firsLabel, subTitle: "Totais", isStyleRed: true},
        { id: "premioEmitidoAtu", name: `Prêmio Emitido (${mkt.periodoFinal.toString().substr(0,4)})` },
        { id: "mktShare", name: `MKT Share` , subTitle: "100%"},
        { id: "premioEmitidoAnt", name: `Prêmio Emitido (${mkt.periodoInicial.toString().substr(0,4)})` },
        { id: "var", name: `Var.`, subTitle: " "},
        { id: "premioGanho", name: `Prêmio Ganho` },
        { id: "despesaResseguro", name: `Despesa c/ Resseguro` },
        { id: "sinistroOcorrido", name: `Sinistro Ocorrido` },
        { id: "receitaResseguro", name: `Receita c/ Resseguro` },
        { id: "despesaComercial", name: `Despesa Comercial` },
        { id: "sinistralidade", name: `Sinistralidade` },
        { id: "rvne", name: `RVNE` },
    ] 
    sheet.columns = columns.map(item => ({
        header: item.name,
        key: item.id
    }));
    
    sheet.addRow(columns.map(item => item.subTitle || 0));

    const isEmptyLine = (l: lineSheetData):boolean =>
        !l.premioEmitidoAtu &&
        !l.premioEmitidoAnt &&
        !l.premioGanho &&
        !l.despesaResseguro &&
        !l.sinistroOcorrido &&
        !l.receitaResseguro &&
        !l.despesaComercial &&
        !l.sinistralidade &&
        !l.rvne;

    const getGroup = (l: EstatisticaEmpresa): GrupoEmpresarial => 
        lstGroups.find(group => !!group.idEmpresas.find(c => c === l.idSusep));

    const getAggregatedPremioEmitido = (l: EstatisticaEmpresa) =>{
        const group = getGroup(l);
        if(!group)
            return l.premioEmitido;

        return mkt.dadosEmpresaAtual
                    .filter(x => !!group.idEmpresas.find(z => z == x.idSusep))
                    .reduce((agregado, item) => agregado + item.premioEmitido, 0)
    }

    const allLines: lineSheetData[] = mkt.dadosEmpresaAtual.map(item => {
        const lastYearData = mkt.dadosEmpresaAnoPassado.find(e => e.idSusep == item.idSusep)
        return {
            idSusep: item.idSusep,
            empresa: item.empresa,
            premioEmitidoEmpresaAgrupada: getAggregatedPremioEmitido(item),
            premioEmitidoAtu: item.premioEmitido,
            mktShare: "",
            premioEmitidoAnt: lastYearData.premioEmitido,  
            var: "",
            premioGanho: item.premioGanho,
            despesaResseguro: item.despesaResseguro,
            sinistroOcorrido: item.sinistroOcorrido,
            receitaResseguro: item.receitaResseguro,
            despesaComercial: item.despesaComercial,
            sinistralidade: item.sinistralidade,
            rvne: item.rvne
        } as lineSheetData;
    });

    const lineGroups:lineSheetData[] = lstGroups.map(g => {
        const companies = allLines.filter(a => !!g.idEmpresas.find(x => x === a.idSusep));
        const sum = (prop:string):number => companies.reduce((a, b) => a + b[prop], 0);
        return {
            empresa: g.nome,
            premioEmitidoAnt: sum("premioEmitidoAnt"),
            premioEmitidoAtu: sum("premioEmitidoAtu"),
            premioGanho: sum("premioEmitidoAnt"),
            despesaResseguro: sum("premioEmitidoAnt"),
            sinistroOcorrido: sum("sinistroOcorrido"),
            receitaResseguro: sum("receitaResseguro"),
            despesaComercial: sum("despesaComercial"),
            sinistralidade: sum("sinistralidade"),
            rvne: sum("rvne"),
            isGroup: true
        } as lineSheetData
    });

    [...allLines, ...lineGroups]
    .filter(line => !isEmptyLine(line))
    .sort((a: lineSheetData, b: lineSheetData) => {
        if (a.premioEmitidoEmpresaAgrupada > b.premioEmitidoEmpresaAgrupada)
          return 1;

        if (a.premioEmitidoEmpresaAgrupada < b.premioEmitidoEmpresaAgrupada)
          return -1;

        if(a.isGroup)
            return 1;

        return 0;
    })
    .forEach(line => sheet.addRow(line));
}


const downloadFile = (workbook: Excel.Workbook, fileName: string) =>
    workbook.xlsx.writeBuffer()
        .then(res => {
            const dataFile = new Blob([res], {type: "octet/stream"});
            const url = window.URL.createObjectURL(dataFile);

            const a = document.createElement("a");
            a.setAttribute("style", "display: none");
            a.href = url;
            a.download = `${fileName}.xlsx`;
            a.click();

            window.URL.revokeObjectURL(url);
        });

