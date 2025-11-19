import {
  ProductImagesInterface,
  ProductsInterface,
  TypeProducts,
  ReviewsInterface,
} from "../types/products.interface";
import { Response } from "express";
import { Utils } from "../utils/utils";
import { TaskQueue } from "../queues/cloudinary.queue";
import { ProductsQueue } from "../queues/products.queue";
import { CloudinaryService } from "./cloudinary.service";
import { ResponseHandler } from "../utils/responseHandler";
import { PaginationInterface } from "../types/req-ext.interface";
import ProductsRepository from "../repositories/products.repository";

export class ProductsService extends ProductsRepository {
  public path: String;
  public queue: any;
  public utils: Utils;
  public productsQueue: any;
  public folder: string = "products";
  public cloudinaryService: CloudinaryService;

  constructor() {
    super();
    this.path = "/products/";
    this.utils = new Utils();
    this.queue = new TaskQueue("cloudinary_products");
    this.queue.setupListeners();
    this.productsQueue = new ProductsQueue('products_contapyme');
    this.productsQueue.setupListeners();
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

      // state products
      if (query.state) {
        queryObj.state = query.state;
      }

      // category products
      if (query.category) {
        queryObj.category = query.category;
      }

      // category products
      if (query.brand) {
        queryObj.brand = query.brand;
      }

      // validate filter data
      if (query.filter && !query.filter.includes("min")) {
        const filter = JSON.parse(query.filter);
        queryObj = { ...queryObj, ...filter };
      }

      if (query.filter && query.filter.includes("min")) {
        const filter = JSON.parse(query.filter);
        queryObj = { ...queryObj, ...filter };
        if (queryObj.price) {
          const { min, max } = queryObj.price;
          queryObj.price = { $gte: Number(min), $lte: Number(max) };
        }

        if (queryObj.power) {
          const { min, max } = queryObj.power;
          queryObj["details.power"] = { $gte: Number(min), $lte: Number(max) };
          delete queryObj.power;
        }
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
    setTimeout(async () => {
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
    }, 5000);

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

  /**
   * Show product
   * @param { Response } res Express response
   * @param { string } id query of list
   * @return { Promise<void | ResponseRequestInterface> }
   */
  public async showProduct(
    res: Response,
    id: string
  ): Promise<void | ResponseHandler> {
    try {
      const product = await this.findById(id);

      // return data
      return ResponseHandler.successResponse(
        res,
        {
          product,
        },
        "Información del producto."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Show product from web
   * @param { Response } res Express response
   * @param { string } id query of list
   * @return { Promise<void | ResponseRequestInterface> }
   */
  public async showProductFromWeb(
    res: Response,
    id: string
  ): Promise<void | ResponseHandler> {
    try {
      const product = await this.findById(id);
      const similarProduct = await this.getSimilarProducts(
        product?.category,
        product?._id,
        4
      );

      // return data
      return ResponseHandler.successResponse(
        res,
        {
          product,
          similarProduct,
        },
        "Información del producto."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Delete product
   * @param { Response } res Express response
   * @param { string } id query of list
   * @return { Promise<void | ResponseRequestInterface> }
   */
  public async deleteProduct(
    res: Response,
    id: string
  ): Promise<void | ResponseHandler> {
    try {
      //  get product data
      const product = await this.delete(id);

      // return data
      return ResponseHandler.successResponse(
        res,
        {
          product,
        },
        "Producto eliminado correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Update products
   * @param { Response } res Express response
   * @param { ProductsInterface } body ProductsInterface
   * @param { Express.Multer.File } file Express.Multer.File
   */
  public async updateProducts(
    res: Response,
    body: ProductsInterface,
    id: string
  ): Promise<void | ResponseHandler> {
    try {
      // validate file
      const product = await this.findById(id);
      console.log(body);
      await this.update(id, body);

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
   * Delete products image
   * @param { Response } res Express response
   * @param { ProductsInterface } id ProductsInterface
   * @param { Express.Multer.File } imageId Express.Multer.File
   * @param { string } type
   */
  public async deleteProductImage(
    res: Response,
    id: string,
    imageId: string,
    type: string
  ) {
    try {
      // delete image
      const product = (await this.findById(id)) as ProductsInterface;
      let images = [];
      if (type !== "banner") {
        images = JSON.parse(JSON.stringify(product?.images));
      } else {
        images = JSON.parse(JSON.stringify(product?.banner));
      }

      const imageToDelete = images.find(
        (item: ProductImagesInterface) => item._id === imageId
      );

      // delete in cloudinary
      if (imageToDelete) {
        await this.queue.addJob(
          { taskType: "deleteFile", payload: { file: imageToDelete.path } },
          {
            attempts: 3,
            backoff: 5000,
          }
        );
      }

      const newImages = images.filter(
        (item: ProductImagesInterface) => item._id !== imageId
      );

      // save news images
      if (type !== "banner") {
        product.images = newImages;
      } else {
        product.banner = newImages;
      }
      await this.update(id, product);

      // return response
      return ResponseHandler.successResponse(
        res,
        newImages,
        "Imagen eliminada correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Update default image
   * @param { Response } res Express response
   * @param { string } id Product id
   * @param { string } imageId Image id
   * @param { boolean } default_image Default image flag
   */
  public async updateDefaultImage(
    res: Response,
    id: string,
    imageId: string,
    default_image: boolean
  ) {
    try {
      // get product
      const product = (await this.findById(id)) as ProductsInterface;
      
      if (!product) {
        throw new Error("Producto no encontrado.");
      }

      if (!product.images || product.images.length === 0) {
        throw new Error("El producto no tiene imágenes.");
      }
      console.log(product.images);
      
      // Convert images to plain objects to handle ObjectId comparison
      const images = JSON.parse(JSON.stringify(product?.images || []));
      
      // find image and update - try multiple comparison methods
      let imageIndex = images.findIndex(
        (item: ProductImagesInterface) => {
          if (item._id) {
            const itemId = String(item._id);
            const searchId = String(imageId);
            return itemId === searchId;
          }
          return false;
        }
      );

      // If not found by _id, try to find by index (if imageId is a number)
      if (imageIndex === -1 && !isNaN(Number(imageId))) {
        imageIndex = Number(imageId);
        if (imageIndex < 0 || imageIndex >= images.length) {
          imageIndex = -1;
        }
      }

      // If still not found, try without conversion on original array
      if (imageIndex === -1) {
        imageIndex = product.images.findIndex(
          (item: ProductImagesInterface, idx: number) => {
            if (item._id) {
              const itemIdStr = String(item._id);
              const searchIdStr = String(imageId);
              return itemIdStr === searchIdStr || item._id.toString() === imageId;
            }
            // Fallback: if no _id, try by index
            return String(idx) === String(imageId);
          }
        );
      }

      if (imageIndex === -1) {
        // Log for debugging
        console.log('Image search failed:', {
          imageId,
          imageIdType: typeof imageId,
          imagesCount: images.length,
          imagesWithId: images.filter((img: any) => img._id).length,
          firstImageId: images[0]?._id,
          firstImageIdType: typeof images[0]?._id
        });
        throw new Error(`Imagen no encontrada. ImageId recibido: ${imageId}, Total imágenes: ${images.length}`);
      }

      // If setting as default, unset other images of the same type
      if (default_image) {
        images.forEach((item: ProductImagesInterface, index: number) => {
          if (item.type === images[imageIndex].type) {
            item.default_image = index === imageIndex;
          }
        });
      } else {
        images[imageIndex].default_image = false;
      }

      // Update product with modified images
      product.images = images;

      // save updated product
      await this.update(id, product);

      // return response
      return ResponseHandler.successResponse(
        res,
        images,
        default_image 
          ? "Imagen marcada como por defecto correctamente." 
          : "Imagen desmarcada como por defecto correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Count products
   * @param { Response } res Express response
   * @param { string } type
   */
  public async getCountProducts(res: Response) {
    try {
      // count vehicles
      const productsVehicle = await this.countDocument({
        type: TypeProducts.vehicle,
      });
      const productsAccesories = await this.countDocument({
        type: TypeProducts.product,
      });

      // get last items
      const page: number = 1;
      const perPage: number = 5;
      const skip = (page - 1) * perPage;
      let queryObj: any = {
        type: TypeProducts.vehicle,
      };

      const lastFiveVehicles = await this.paginate(
        queryObj,
        skip,
        perPage,
        "createdAt",
        "-1",
        [
          "name",
          "category",
          "price",
          "discount",
          "state",
          "brand_icon",
          "model",
          "banner",
        ]
      );

      queryObj = {
        type: TypeProducts.product,
      };
      const lastFiveAccesories = await this.paginate(
        queryObj,
        skip,
        perPage,
        "createdAt",
        "-1",
        [
          "name",
          "category",
          "price",
          "discount",
          "state",
          "brand_icon",
          "model",
          "banner",
        ]
      );

      // return response
      return ResponseHandler.successResponse(
        res,
        {
          countVehicle: productsVehicle || 0,
          countAccesories: productsAccesories || 0,
          lastVehicles: lastFiveVehicles.data,
          lastProduct: lastFiveAccesories.data,
        },
        "Datos del dashboard."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Add review to product
   * @param { Response } res Express response
   * @param { ReviewsInterface }
   */
  public async addReview(res: Response, body: ReviewsInterface) {
    try {
      const product = await this.findById(body.id as string);

      if (product) {
        product.reviews.push({
          amount: body.quantity as number,
          name: body.name,
          description: body.description || "",
        });
        await this.update(body.id, product);
      }

      // return response
      return ResponseHandler.successResponse(
        res,
        { product },
        "Calificación agregada correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Get most sell products data
   * @param res
   * @param products
   * @returns
   */
  public async getMotstProductsSells(res: Response, products: string) {
    try {
      // most sell
      const productsArr = await this.getMostSellesData(products);

      // return response
      return ResponseHandler.successResponse(
        res,
        productsArr,
        "Productos mas vendidos."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * count product publish by period
   * @param { Response } res
   * @param { string } period
   */
  public async countPublishProduct(res: Response, period: string) {
    try {
      // most sell
      const dates = this.utils.getDateRange(period);
      const publishProduct = await this.loadPorductPublishInPeriod(
        dates.startDate,
        dates.endDate
      );

      // return response
      return ResponseHandler.successResponse(
        res,
        {
          products: publishProduct,
        },
        "Productos publicados."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * create from contapyme
   * @param { Response } res
   * @param { Request } req
   */
  public async createFromContapyme(res: Response, products: any) {
    try {
      for (const product of products) {
        await this.productsQueue.addJob(
          { taskType: "loadProductsData", payload: { product } },
          {
            attempts: 3,
            backoff: 5000,
          }
        );
      }

      // return response
      return ResponseHandler.successResponse(
        res,
        {
          success: true,
          message: 'Productos vinculados correctamente',
        },
        "Productos vinculados correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
