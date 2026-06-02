import { Cliente } from './cliente.model';
import { ItemVenda } from './item-venda.model';

export interface Venda {
  id?: number;
  cliente_id: number;
  data_venda: string;
  subtotal: number;
  total: number;
  // Relacionamentos carregados
  cliente?: Cliente;
  itens?: ItemVenda[];
}
