import Dexie, { Table } from 'dexie';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  cost_price: number;
  category: string;
  stock: number;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  stock_qty: number;
  reorder_level: number;
  expiry_date?: string;
  updated_at: string;
}

export interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Sale {
  localId?: string;
  id?: string;
  seller_id: string;
  total_amount: number;
  items?: SaleItem[]; // Items can be joined or stored as nested
  synced: boolean;
  created_at: string;
}

export interface Activity {
  id?: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  timestamp: string;
}

export class POSDatabase extends Dexie {
  products!: Table<Product, string>;
  inventory!: Table<InventoryItem, string>;
  sales!: Table<Sale, string>;
  activities!: Table<Activity, string>;

  constructor() {
    super('POSDatabase');
    this.version(3).stores({
      products: 'id, barcode, name, category',
      inventory: 'id, product_id, stock_qty',
      sales: 'localId, id, seller_id, synced, created_at',
      activities: '++id, user_id, timestamp'
    });
  }
}

export const db = new POSDatabase();
