/**
 * @quack/core - Express Router Factory
 * Creates an Express router with all Quack API routes
 */
import { Router } from 'express';
import { QuackStore } from '../store/index.js';
export interface QuackRouterOptions {
    store: QuackStore;
}
export declare function createQuackRouter(options: QuackRouterOptions): Router;
//# sourceMappingURL=index.d.ts.map