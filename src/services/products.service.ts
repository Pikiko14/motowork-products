import { Response } from "express";
import { TaskQueue } from "../queues/cloudinary.queue";
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

  constructor() {
    super();
    this.path = "/brands/";
    this.queue = new TaskQueue("cloudinary");
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
          { taskType: "uploadFile", payload: { file, product } },
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

  /**
   * List products
   * @param { Response } res Express response
   * @param { PaginationInterface } query query of list
   * @return { Promise<void | ResponseRequestInterface> }
   */
  public async getProducts(
    res: Response,
    query: PaginationInterface
  ): Promise<void | ResponseHandler> {
    try {
      // validamos la data de la paginacion
      const page: number = (query.page as number) || 1;
      const perPage: number = (query.perPage as number) || 7;
      const skip = (page - 1) * perPage;

      // Iniciar busqueda
      let queryObj: any = {};
      if (query.search) {
        const searchRegex = new RegExp(query.search as string, "i");
        queryObj = {
          $or: [{ name: searchRegex }],
        };
      }

      // validate is active
      if (query.is_active) {
        queryObj.is_active = query.is_active;
      }

      // type products
      if (query.type) {
        queryObj.type = query.type;
      }

      // do query
      const fields = query.fields ? query.fields.split(",") : [];
      const products = await this.paginate(
        queryObj,
        skip,
        perPage,
        query.sortBy,
        query.order,
        fields
      );

      // return data
      return ResponseHandler.successResponse(
        res,
        {
          brands: products.data,
          totalItems: products.totalItems,
          totalPages: products.totalPages,
        },
        "Listado de marcas."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
