import { Response } from "express";
import { TaskQueue } from '../queues/cloudinary.queue';
import { CloudinaryService } from "./cloudinary.service";
import { ResponseHandler } from "../utils/responseHandler";
import { ProductsInterface } from "../types/products.interface";
import { PaginationInterface } from "../types/req-ext.interface";
import ProductsRepository from "../repositories/products.repository";

export class ProductsService extends ProductsRepository {
  public path: String;
  public queue: any;
  public folder: string = "products";
  public cloudinaryService: CloudinaryService;

  constructor(
  ) {
    super();
    this.path = "/brands/";
    this.queue = new TaskQueue('cloudinary');
    this.queue.setupListeners();
    this.cloudinaryService = new CloudinaryService();
  }

  /**
   * Create products
   * @param { Response } res Express response
   * @param { ProductsInterface } body ProductsInterface
   * @param { Express.Multer.File } file Express.Multer.File
   */
  public async createProducts(
    res: Response,
    body: ProductsInterface,
    file: Express.Multer.File
  ): Promise<void | ResponseHandler> {
    try {
      // validate file
      const product = (await this.create(body)) as ProductsInterface;

      // set file
      if (file) {
        // execute queue for upload
        await this.queue.addJob(
          { taskType: 'uploadFile', payload: { file, product } },
          {
            attempts: 3,
            backoff: 5000,
          }
        );
      }

      // return response
      return ResponseHandler.successResponse(
        res,
        product,
        "Producto creado correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
