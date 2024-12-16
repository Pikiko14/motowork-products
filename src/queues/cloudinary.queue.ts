import { Utils } from "../utils/utils";
import Bull, { Job, Queue, QueueOptions } from "bull";
import { CloudinaryService } from "../services/cloudinary.service";
import productsRepository from "../repositories/products.repository";
import ProductsRepository from "../repositories/products.repository";
import { BannerType, ProductsInterface } from "../types/products.interface";

export class TaskQueue<T> extends productsRepository {
  private utils: Utils;
  private path: string;
  private queue: Queue<T>;
  public redisConfig: QueueOptions["redis"] = {
    host: "127.0.0.1",
    port: 6379,
  };
  public folder: string = "products";
  public cloudinaryService: CloudinaryService;

  constructor(queueName: string) {
    super();
    this.queue = new Bull<T>(queueName, {
      redis: this.redisConfig,
    });
    this.path = "/products/";
    this.utils = new Utils();
    this.initializeProcessor();
    this.cloudinaryService = new CloudinaryService();
  }

  /**
   * Inicializa el procesador de la cola
   */
  private initializeProcessor() {
    this.queue.process(async (job: Job<T>) => {
      try {
        console.log(`Procesando trabajo: ${job.id}`);
        await this.handleTask(job);
      } catch (error) {
        console.error(`Error procesando trabajo ${job.id}:`, error);
        throw error;
      }
    });
  }

  /**
   * Lógica para manejar cada tarea
   */
  private async handleTask(job: Job<any>): Promise<void> {
    let fileResponse = null;
    let repository = new ProductsRepository();
    let productEntity: ProductsInterface | null = null;

    // upload single file
    let folderString = "";
    if (job.data.taskType === "uploadFile") {
      const { file, product, folder, path, entity } = job.data.payload;
      productEntity = await repository.findById(product._id);
      folderString = folder;
      const imgBuffer = await this.utils.generateBuffer(file.path);
      await this.utils.deleteItemFromStorage(
        `${file.filename ? `${path}${file.filename}` : ""}`
      );
      fileResponse = await this.cloudinaryService.uploadImage(
        imgBuffer,
        folder
      );

      if (entity === "banner" && productEntity) {
        const bannerImg = {
          type_banner:
            file.fieldname === "bannerDesktop"
              ? BannerType.desktop
              : BannerType.mobile,
          path: fileResponse.secure_url,
        };
        productEntity.banner.push(bannerImg);
        await repository.update(productEntity.id, productEntity);
      }
    }

    // upload multiple files
    if (job.data.taskType === "uploadMultipleFiles") {
      const { product, images, folder, path, entity } = job.data.payload;
      productEntity = await repository.findById(product._id);
      folderString = folder;
      for (const image of images) {
        const imgBuffer = await this.utils.generateBuffer(image.path);
        // delete local storage
        await this.utils.deleteItemFromStorage(
          `${image.path ? `${path}${image.filename}` : ""}`
        );

        // upload single
        fileResponse = await this.cloudinaryService.uploadImage(
          imgBuffer,
          folder
        );

        // save in bbdd
        if (entity === "images" && productEntity) {
          const imageObj = {
            path: fileResponse.secure_url,
            type:
              image.fieldname === "imagesDesktop"
                ? BannerType.desktop
                : BannerType.mobile,
          };
          productEntity.images.push(imageObj);
          await repository.update(productEntity.id, productEntity);
        }
      }
      // upload multiples
      // fileResponse = await this.cloudinaryService.uploadMultipleFiles(bufferArray, this.folder);
    }

    // delete file
    if (job.data.taskType === "deleteFile") {
      const { file, folder } = job.data.payload;
      folderString = folder;
      fileResponse = await this.cloudinaryService.deleteImageByUrl(file);
    }
    console.log(`Tarea procesada con respuesta:`, fileResponse);
  }

  /**
   * Agrega un trabajo a la cola
   */
  public async addJob(data: T, options?: Bull.JobOptions): Promise<Job<T>> {
    const job = await this.queue.add(data, options);
    console.log(`Trabajo encolado: ${job.id}`);
    return job;
  }

  /**
   * Configura eventos de la cola
   */
  public setupListeners() {
    this.queue.on("completed", (job: Job) => {
      console.log(`Trabajo completado: ${job.id}`);
    });

    this.queue.on("failed", (job: Job, err: Error) => {
      console.error(`Trabajo fallido: ${job.id}`, err);
    });
  }
}
