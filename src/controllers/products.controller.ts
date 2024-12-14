import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { ResponseHandler } from "../utils/responseHandler";
import { ProductsService } from "../services/products.service";
import { ProductsInterface } from "../types/products.interface";
import { ResponseRequestInterface } from "../types/response.interface";
import { PaginationInterface, RequestExt } from "../types/req-ext.interface";

export class ProductsController {
  public service;

  constructor() {
    this.service = new ProductsService();
  }

  /**
   * Create product
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  createProducts = async (
    req: Request,
    res: Response
  ): Promise<void | ResponseRequestInterface | any> => {
    try {
      // get body
      const body = matchedData(req) as ProductsInterface;

      // store brand
      return await this.service.createProducts(
        res,
        body,
        req.file as Express.Multer.File
      );
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  };

  /**
   * Get products
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  getProducts = async (
    req: RequestExt,
    res: Response
  ): Promise<void | ResponseRequestInterface> => {
    try {
      // get query
      const query = matchedData(req) as PaginationInterface;

      // return data
      return await this.service.getProducts(res, query);
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  };
}
