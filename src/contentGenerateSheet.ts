import { msgType, Mensagem, Mercado, GrupoEmpresarial, EstatisticaEmpresa, PayloadConfigs } from "./types";
import { roundNumber } from "./round";
import * as Excel from 'exceljs';

const ExcelJS = require("exceljs/dist/es5/exceljs.browser");

const skipLinesTitle = 2;
const textColumns = [1,2,6];
const listCentered = [1, 4, 6, 12];

interface lineSheetData{
    premioEmitidoEmpresaAgrupada: number;
    idSusep: number;
    empresa: string;
    premioEmitidoAtu: number;
    mktShare: string;
    premioEmitidoAnt: number;
    var: number;
    premioGanho: number;
    despesaResseguro: number;
    sinistroOcorrido: number;
    receitaResseguro: number;
    despesaComercial: number;
    sinistralidade: number;
    rvne: number;
    isGroup: boolean;
    isAxa: boolean;
}

const messager = chrome.runtime.sendMessage;

const decimalFormatting = "#,##0.##";
const intFormatting = "#,##0";
const hasDecimalPlaces = (number: number): boolean => !!(number % 1);

const border = {
    top: {style:'thin'},
    left: {style:'thin'},
    bottom: {style:'thin'},
    right: {style:'thin'}
} as Partial<Excel.Borders>;

const alignLeft = cell => cell.alignment = { 
    vertical: 'top', 
    horizontal: 'left' 
}

const alignCenter = cell => cell.alignment = { 
    vertical: 'top', 
    horizontal: 'center' 
}

const alignRight = cell => cell.alignment = { 
    vertical: 'top', 
    horizontal: 'right' 
}

const sitylingTitle = row => {
    row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "3f3f3f"}
    };

    row.font = {
        name: 'Verdana',
        size: 9,
        bold: true,
        color: { argb: "ffffff" }
    };

    row.border = border;
}

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
    const distinctFilter = (ramo, index, lstRamos) => 
        lstRamos.indexOf(ramo) === index;
    const firsLabel = `YTD ${labelPeriodoInicial}/${labelPeriodoFinal}  - 
        ${mkt.nome} (${mkt.idRamos.filter(distinctFilter).join(', ')})`;
    const columns = [
        { id: "class", name: "Title", subTitle: "Class.", width: 6.14 },
        { id: "empresa", name: firsLabel, subTitle: "Totais", isStyleRed: true, width: 53 },
        { id: "premioEmitidoAtu", name: `Prêmio Emitido (${mkt.periodoInicial.toString().substr(0,4)})`, width: 23 },
        { id: "mktShare", name: `MKT Share` , subTitle: "100%", width: 10.71 },
        { id: "premioEmitidoAnt", name: `Prêmio Emitido (${(mkt.periodoInicial - 100).toString().substr(0,4)})`, width: 23 },
        { id: "var", name: `Var.`, subTitle: " ", width: 4.43 },
        { id: "premioGanho", name: `Prêmio Ganho`, width: 14 },
        { id: "despesaResseguro", name: `Despesa c/ Resseguro`, width: 22.14 },
        { id: "sinistroOcorrido", name: `Sinistro Ocorrido`, width: 17 },
        { id: "receitaResseguro", name: `Receita c/ Resseguro`, width: 21.14 },
        { id: "despesaComercial", name: `Despesa Comercial`, width: 18.86 },
        { id: "sinistralidade", name: `Sinistralidade`, width: 13.71 },
        { id: "rvne", name: `RVNE`, width: 14.86 },
    ] 
    sheet.columns = columns.map(item => ({
        header: item.name,
        key: item.id,
        width: item.width
    }));

    const isEmptyLine = (l: lineSheetData):boolean =>
        !l.premioEmitidoAtu;

    const getGroup = (l: EstatisticaEmpresa | lineSheetData): GrupoEmpresarial => 
        lstGroups.find(group => !!group.idEmpresas.find(c => c === l.idSusep));

    const getAggregatedPremioEmitido = (l: EstatisticaEmpresa) =>{
        const group = getGroup(l);
        if(!group)
            return l.premioEmitido;

        return mkt.dadosEmpresaAtual
                    .filter(x => !!group.idEmpresas.find(z => z == x.idSusep))
                    .reduce((agregado, item) => agregado + item.premioEmitido, 0)
    }

    const dataLines: lineSheetData[] = mkt.dadosEmpresaAtual.map(item => {
        const lastYearData = mkt.dadosEmpresaAnoPassado.find(e => e.idSusep == item.idSusep) || { premioEmitido: 0}
        return {
            idSusep: item.idSusep,
            empresa: item.empresa,
            premioEmitidoEmpresaAgrupada: getAggregatedPremioEmitido(item),
            premioEmitidoAtu: item.premioEmitido,
            mktShare: "",
            premioEmitidoAnt: lastYearData.premioEmitido,  
            var: 0, //item.premioEmitido > lastYearData.premioEmitido ? 1 : 0,
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
        const companies = dataLines.filter(a => !!g.idEmpresas.find(x => x === a.idSusep));
        const sum = (prop: string): number => companies.reduce((a, b) => a + b[prop], 0);
        const agg = (companies[0] && companies[0].premioEmitidoEmpresaAgrupada) || 0;
        return {
            empresa: g.nome,
            premioEmitidoAnt: sum("premioEmitidoAnt"),
            premioEmitidoAtu: sum("premioEmitidoAtu"),
            premioGanho:      sum("premioGanho"),
            despesaResseguro: sum("despesaResseguro"),
            sinistroOcorrido: sum("sinistroOcorrido"),
            receitaResseguro: sum("receitaResseguro"),
            despesaComercial: sum("despesaComercial"),
            sinistralidade:   sum("sinistralidade"),
            rvne:             sum("rvne"),
            premioEmitidoEmpresaAgrupada: agg,
            isGroup: true,
            isAxa: g.isAxa
        } as lineSheetData
    });
    
    const calcTotal = prop => dataLines.reduce((a, b) => a + b[prop],0);
    const rowSubTitle = sheet.addRow(columns.map(item => item.subTitle || calcTotal(item.id)));

    sheet.columns.forEach((col, o) => { 
        const cell = rowSubTitle.getCell(o + 1);  
        cell.numFmt = hasDecimalPlaces(cell.value as number) ? decimalFormatting : intFormatting;
    })
    const allLines = [...dataLines, ...lineGroups];

    const totalPremioEmitido = calcTotal(columns[2].id);
    const totalPremioEmitidoAnoPassado = calcTotal(columns[4].id);

    //align Totais
    [...listCentered, 2].forEach(x => alignCenter(rowSubTitle.getCell(x)));
    
    //set column var
    rowSubTitle.getCell(6).value = 
        totalPremioEmitido > totalPremioEmitidoAnoPassado ? 1 : 0;

    //set column sinestridade
    rowSubTitle.getCell(12).value = mkt.totalSinistridade;

    let countClassification = 1;
    allLines
    .filter(line => !isEmptyLine(line))
    .sort((a: lineSheetData, b: lineSheetData) => {
        if (a.premioEmitidoEmpresaAgrupada > b.premioEmitidoEmpresaAgrupada)
          return -1;

        if (a.premioEmitidoEmpresaAgrupada < b.premioEmitidoEmpresaAgrupada)
          return 1;

        if(a.isGroup)
            return -1;

        return 0;
    })
    .forEach((line, index) => {
        const row = sheet.addRow(line);

        const group = getGroup(line);
        if(!!group)
            row.outlineLevel = 1;
        else
            row.getCell(1).value = `${countClassification++}º`;

        //set mktShare
        const mktShare = row.getCell(4);
        mktShare.value = `${(roundNumber(line.premioEmitidoAtu * 1000 / totalPremioEmitido, 1) / 10).toFixed(2)}%`;
        mktShare.numFmt = "00.0%";
        
        const mktVar = row.getCell(6);
        mktVar.value = line.premioEmitidoAtu > line.premioEmitidoAnt ? 1 : 0;

        Object.keys(line).forEach((prop, i) => {
            const idCol = i + 1;
            const cell = row.getCell(idCol);

            if(!textColumns.find(v => v == idCol)){
                cell.numFmt = hasDecimalPlaces(line[prop]) ? decimalFormatting : intFormatting;
                alignRight(cell);   
            }

            if(idCol === 2)
                alignLeft(cell);

            if(listCentered.find(c => c === idCol))
                alignCenter(cell);
            
            cell.border = border;
            cell.font = {
                name: 'Verdana',
                size: 9,
                color: { argb: "333333" }
            };
            
            if(line.isAxa){
                cell.font = {
                    name: 'Verdana',
                    size: 9,
                    bold: true,
                    color: { argb: "333333" }
                };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFF00"}
                };
            }
        });
    });

    Array.from({ length: skipLinesTitle }, 
        (a, i) => sheet.columns.forEach((col, z) => 
            sitylingTitle(sheet.getRow(i + 1).getCell(z + 1))));

    sheet.getRow(1).getCell(1).value = "";
    sheet.mergeCells("A1:B1");
    sheet.getRow(1).getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "C00000"}
    };
    
    const cell = sheet.getCell("A1")
    cell.value = columns[1].name;
    alignCenter(cell);
    
    sheet.properties.outlineLevelRow = 1;

    messager({ type: msgType.finishiesExportSpreadSheet } as Mensagem)
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
