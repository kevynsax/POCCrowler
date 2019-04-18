import { msgType, Mensagem, Mercado, PayloadConfigs, EstatisticaEmpresa } from "./types";
import * as $ from 'jquery';
import * as Excel from "exceljs";

const ExcelJS = require("exceljs/dist/es5/exceljs.browser");
const messager = chrome.runtime.sendMessage;
const decimalFormatting = "#,##0.##";
const intFormatting = "#,##0";
const skipTextColumns = 2;

const startProccess = (allData: Mercado[]) => {
    if(!allData)
        return;

    const start = (cfgs: PayloadConfigs) => {
        if(!cfgs.generateRawData)
            return;
            
        generateRawSpreadSheet(allData, cfgs);
    };
    messager({ type: msgType.getConfigs } as Mensagem, start);
}
messager({ type: msgType.getDataToExport } as Mensagem, startProccess);

const border = {
    top: {style:'thin'},
    left: {style:'thin'},
    bottom: {style:'thin'},
    right: {style:'thin'}
} as Partial<Excel.Borders>;

const sitylingTitle = row => {
    row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1C5E55"}
    };

    row.font = {
        name: 'Verdana',
        size: 11,
        bold: true,
        color: { argb: "ffffff" }
    };

    row.border = border;
}

const alignLeft = cell => cell.alignment = { 
    vertical: 'top', 
    horizontal: 'left' 
}

const alignCenter = cell => cell.alignment = { 
    vertical: 'top', 
    horizontal: 'center' 
}

const generateRawSpreadSheet = (data: Mercado[], cfgs: PayloadConfigs) => {
    var workbook = new ExcelJS.Workbook();
    workbook.creator = "Kevyn Pinheiro Klava";
    workbook.created = new Date();
    workbook.properties.date1904 = true;

    workbook.views = [
        {
          x: 0, y: 0, width: 10000, height: 20000,
          firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
    ];

    const metadata = [
        { prop: "dadosEmpresaAtual", stampYear: 0},
        { prop: "dadosEmpresaAnoPassado", stampYear: 1 }
    ];
    data.forEach(mkt =>
        metadata.forEach(meta => {
            const labelSheet = `DB ${mkt.nome} ${(mkt.periodoFinal - (meta.stampYear * 100)).toString().substr(0, 4)}`;
            generateSheets(workbook, mkt[meta.prop], labelSheet);
        }));
        
    downloadFile(workbook, cfgs.nameExportedFile);
}

const hasDecimalPlaces = (number: number): boolean => !!(number % 1)
const generateSheets = (workbook: Excel.Workbook, data: EstatisticaEmpresa[], titleSheet: string) => {
    const sheet = workbook.addWorksheet(titleSheet, {
        views: [{showGridLines: true}]
    });
    
    generateTitle(sheet);
    generateSubTitle(sheet, data);

    data.forEach((dt, index) => {
        const row = sheet.addRow(dt);
        
        row.border = border;
        row.font = {
            name: 'Verdana',
            size: 11,
            color: { argb: "333333" }
        };

        if(!!(index % 2))
            row.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "E3EAEB"}
            };

        Array.from({length: skipTextColumns}, (x, i) => alignLeft(row.getCell(i + 1)));
        Object.keys(dt).slice(skipTextColumns).forEach((prop, i) => {
            const cell = row.getCell(i + 1 + skipTextColumns);
            cell.numFmt = hasDecimalPlaces(dt[prop]) ? decimalFormatting : intFormatting;
        });

    });
}
const generateTitle = (sheet: Excel.Worksheet) => {
    const titles = [
        { prop: "idSusep", titulo: `Código SUSEP`, width: 17.29 },
        { prop: "empresa", titulo: `Empresa`, width: 72 },
        { prop: "premioEmitido", titulo: `Prêmio Emitido ³`, width: 20.57 },
        { prop: "premioGanho", titulo: `Prêmio Ganho ¹`, width: 19.29  },
        { prop: "despesaResseguro", titulo: `Despesa com Resseguro ³`, width: 32  },
        { prop: "sinistroOcorrido", titulo: `Sinistro Ocorrido ³`, width: 22.43  },
        { prop: "receitaResseguro", titulo: `Receita com Resseguro ³`, width: 30.71  },
        { prop: "despesaComercial", titulo: `Despesa Comercial`, width: 23.14  },
        { prop: "sinistralidade", titulo: `Sinistralidade ¹`, width: 18.57  },
        { prop: "rvne", titulo: `RVNE ³`, width: 14.57 },
    ];

    sheet.columns = titles.map(title => ({
        header: title.titulo,
        key: title.prop,
        width: title.width,
        style: {
            font: {
                name: 'Verdana',
                size: 11,
            }
        }
    }));
    const rowTitle = sheet.getRow(1);
    alignCenter(rowTitle);
    sitylingTitle(rowTitle)
}

const generateSubTitle = (sheet: Excel.Worksheet, data: EstatisticaEmpresa[]) => {
    const alphabet = "CDEFGHIJKLMNOPQRSUVWXYZ";
    const totals = [  
        { titulo: ``},
        { titulo: `Totais`},
        ...Array.from({length: sheet.columns.length - skipTextColumns}, z => ({titulo: "", sum: true}))
    ];

    const totalRows = sheet.addRow([...totals].map(a => a.titulo));
    alignCenter(totalRows.getCell(2));
    sitylingTitle(totalRows);

    totals.slice(skipTextColumns).forEach((x, i) => {
        const idCol = i + 1 + skipTextColumns;
        const cell = totalRows.getCell(idCol);
        const prop = sheet.getColumn(idCol).key;

        const sum = data.reduce((a, b) => a + b[prop], 0);
/*        cell.value = {
            formula: `=SUM(${alphabet[i]}${skipTextColumns + 1}:${alphabet[i]}${data.length + 2})`,
            result: sum
        } */
        cell.numFmt = hasDecimalPlaces(sum) ? decimalFormatting : intFormatting;
    })
}

const downloadFile = (workbook: Excel.Workbook, fileName: string) =>
    workbook.xlsx.writeBuffer()
        .then(res => {
            const dataFile = new Blob([res], {type: "octet/stream"});
            const url = window.URL.createObjectURL(dataFile);

            const a = document.createElement("a");
            a.setAttribute("style", "display: none");
            a.href = url;
            a.download = `Database ${fileName}.xlsx`;
            a.click();

            window.URL.revokeObjectURL(url);
        });
