// Fora do módulo "use client" de propósito: exportado de lá, o servidor receberia uma
// referência de cliente em vez da string, e o cabeçalho da tabela perderia o alinhamento.
export const COLUNAS =
  "grid grid-cols-[minmax(9rem,1fr)_4.5rem_7rem_6rem_6.5rem_7rem_3.5rem_5.5rem] items-center gap-2";
