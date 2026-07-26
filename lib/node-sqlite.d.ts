declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      all(...values: unknown[]): any[];
      get(...values: unknown[]): any;
      run(...values: unknown[]): {
        changes: number;
        lastInsertRowid: number | bigint;
      };
    };
  }
}
