export interface Recebimento {
  id?: number;
  venda_id: number;
  valor: number;
  status: 'Pendente' | 'Pago' | 'Cancelado';
  data_pagamento?: string;
}
