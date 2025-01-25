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

  /**
   * Upload files
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  uploadFiles = async (req: RequestExt, res: Response): Promise<void> => {
    try {
      const bannerMobile = req.files["bannerMobile"]
        ? req.files["bannerMobile"][0]
        : null;
      const bannerDesktop = req.files["bannerDesktop"]
        ? req.files["bannerDesktop"][0]
        : null;
      const imagesMobile = req.files["imagesMobile"]
        ? req.files["imagesMobile"]
        : null;
      const imagesDesktop = req.files["imagesDesktop"]
        ? req.files["imagesDesktop"]
        : null;
      // console.log(bannerMobile);
      // console.log(bannerDesktop);
      // console.log(imagesMobile?.length);
      // console.log(imagesDesktop?.length);

      // store products
      return await this.service.uploadFiles(
        res,
        bannerMobile,
        bannerDesktop,
        imagesMobile,
        imagesDesktop,
        req.body.id
      );

      res.status(200).json({ success: true });
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  };

  /**
   * Show product
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  showProduct = async (req: RequestExt, res: Response) => {
    try {
      const { id } = req.params;
      return await this.service.showProduct(res, id);
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  };

   /**
   * Show product from web
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
   showProductFromWeb = async (req: RequestExt, res: Response) => {
    try {
      const { id } = req.params;
      return await this.service.showProductFromWeb(res, id);
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  };

  /**
   * delete products*
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  deleteProduct = async (req: RequestExt, res: Response) => {
    try {
      const { id } = req.params;
      return await this.service.deleteProduct(res, id);
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  }

  /**
   * Update product
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  updateProducts = async (
    req: Request,
    res: Response
  ): Promise<void | ResponseRequestInterface | any> => {
    try {
      // get body
      const body = matchedData(req) as ProductsInterface;
      const { id } = req.params;

      // store brand
      return await this.service.updateProducts(
        res,
        body,
        id,
      );
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  };

  /**
   * delete products image
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  deleteProductImage = async (req: RequestExt, res: Response) => {
    try {
      const { id } = req.params;
      const { imageId, type } = req.query;
      return await this.service.deleteProductImage(res, id, imageId as string, type as string);
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  }

  /**
   * get count products
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  getCountProducts = async (req: RequestExt, res: Response) => {
    try {
      return await this.service.getCountProducts(res);
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  }
}
