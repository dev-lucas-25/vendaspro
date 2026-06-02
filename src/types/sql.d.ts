declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[] | Record<string, any>): void;
    exec(sql: string, params?: any[] | Record<string, any>): QueryResult[];
    prepare(sql: string, params?: any[] | Record<string, any>): Statement;
    export(): Uint8Array;
    close(): void;
  }
  export interface QueryResult {
    columns: string[];
    values: any[][];
  }
  export interface Statement {
    bind(params: any[] | Record<string, any>): boolean;
    step(): boolean;
    getAsObject(): Record<string, any>;
    run(params?: any[] | Record<string, any>): void;
    free(): void;
  }
  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }
  export default function initSqlJs(config?: { locateFile?: (filename: string) => string }): Promise<SqlJsStatic>;
}
