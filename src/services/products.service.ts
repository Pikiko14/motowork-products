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
    this.path = "/products/";
    this.queue = new TaskQueue("cloudinary_products");
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
        "Listado de products."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Upload file
   * @param { Response } res Express response
   * @param { Express.Multer.File } file Express.Multer.File
   */
  public async uploadFiles(
    res: Response,
    bannerMobile: Express.Multer.File,
    bannerDesktop: Express.Multer.File,
    imagesMobile: Express.Multer.File[],
    imagesDesktop: Express.Multer.File[],
    productId: string
  ): Promise<void> {
    
      // get product
      const product = await this.findById(productId);

      // save mobile and desktop banner
      if (bannerDesktop) {
        await this.queue.addJob(
          {
            taskType: "uploadFile",
            payload: {
              file: bannerDesktop,
              product,
              folder: this.folder,
              path: this.path,
              entity: "banner",
            },
          },
          {
            attempts: 3,
            backoff: 5000,
          }
        );
      }

      if (bannerMobile) {
        await this.queue.addJob(
          {
            taskType: "uploadFile",
            payload: {
              file: bannerMobile,
              product,
              folder: this.folder,
              path: this.path,
              entity: "banner",
            },
          },
          {
            attempts: 3,
            backoff: 5000,
          }
        );
      }

      // save desktop images
      if (imagesDesktop && imagesDesktop.length > 0) {
        await this.queue.addJob(
          {
            taskType: "uploadMultipleFiles",
            payload: {
              product,
              images: imagesDesktop,
              folder: this.folder,
              path: this.path,
              entity: "images",
            },
          },
          {
            attempts: 3,
            backoff: 5000,
          }
        );
      }

      // save mobile images
      if (imagesMobile && imagesMobile.length > 0) {
        await this.queue.addJob(
          {
            taskType: "uploadMultipleFiles",
            payload: {
              product,
              images: imagesMobile,
              folder: this.folder,
              path: this.path,
              entity: "images",
            },
          },
          {
            attempts: 3,
            backoff: 5000,
          }
        );
      }

      return ResponseHandler.successResponse(res, product, "Imagenes subidas.");
    
  }
}
