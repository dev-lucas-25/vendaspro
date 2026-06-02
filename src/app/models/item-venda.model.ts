import { Produto } from './produto.model';

export interface ItemVenda {
  id?: number;
  venda_id?: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  // Relacionamento opcional carregado
  produto?: Produto;
}
