export enum msgType{
    startProcess,
    insertData,
    getNext,
    getCrowlerIsActive,
    getDataToExport,
    cleanStorage
}

export interface Mensagem{
    type: msgType,
    payload: PayloadTableData | Mercado | Number | null
}

export interface PayloadTableData{
    metadata: Mercado,
    tableData: EstatisticaEmpresa[]
}

export interface EstatisticaEmpresa{
    idSusep: number,
    empresa: string,
    premioEmitido: number,
    premioGanho: number,
    despesaResseguro: number,
    sinistroOcorrido: number,
    receitaResseguro: number,
    despesaComercial: number,
    sinistralidade: number,
    rvne: number
}

export interface Mercado{
    nome: string,
    idRamos: number[],
    periodoInicial: number,
    periodoFinal: number,
    dadosEmpresaAtual: EstatisticaEmpresa[],
    dadosEmpresaAnoPassado: EstatisticaEmpresa[]
}