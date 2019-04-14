export enum msgType{
    startProcess,
    insertData,
    getNext,
    getCrowlerIsActive,
    getDataToExport,
    cleanStorage,
    getAggregatedCompanies,
    saveConfigs,
    getConfigs,
    resetConfigs
}

export interface Mensagem{
    type: msgType;
    payload: PayloadTableData | PayloadConfigs | Mercado | PayloadStartProcess | Number | null;
}

export interface PayloadStartProcess{
    periodoInicial: number,
    periodoFinal: number
}

export interface PayloadTableData{
    metadata: Mercado;
    tableData: EstatisticaEmpresa[];
}

export interface PayloadConfigs{
    markets: Mercado[];
    aggregatedCompanies: GrupoEmpresarial[];
    generateRawData: boolean;
}

export interface EstatisticaEmpresa{
    idSusep: number;
    empresa: string;
    premioEmitido: number;
    premioGanho: number;
    despesaResseguro: number;
    sinistroOcorrido: number;
    receitaResseguro: number;
    despesaComercial: number;
    sinistralidade: number;
    rvne: number;
}

export interface Mercado{
    nome: string;
    idRamos: number[];
    periodoInicial: number;
    periodoFinal: number;
    dadosEmpresaAtual: EstatisticaEmpresa[];
    dadosEmpresaAnoPassado: EstatisticaEmpresa[];
}

export interface GrupoEmpresarial{
    nome: string;
    idEmpresas: number[];
    isAxa: boolean;
}