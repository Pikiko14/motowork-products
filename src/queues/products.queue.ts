import Bull, { Job, Queue, QueueOptions } from "bull";
import configuration from "../../configuration/configuration";
import productsRepository from "../repositories/products.repository";
import { BannerType } from "../types/products.interface";

export class ProductsQueue<T> extends productsRepository {
  private queue: Queue<T>;
  public redisConfig: QueueOptions["redis"] = {
    host: "127.0.0.1",
    port: 6379,
  };

  constructor(queueName: string) {
    super();
    this.queue = new Bull<T>(queueName, {
      redis: this.redisConfig,
    });
    this.initializeProcessor();
  }

  /**
   * Inicializa el procesador de la cola
   */
  private initializeProcessor() {
    this.queue.process(1, async (job: Job<T>) => {
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
    // await this.create(element);
    const { product } = job.data.payload;

    // load product data
    let productsImages: any[] = [];
    if (product.sku) {
      const url = `${configuration.get(
        "CONTAPYME_MS_API_URL"
      )}/contacpime/product/${product.sku}`;
      const productContapymeRequest = await fetch(url);
      const productContapyme = await productContapymeRequest.json();
      if (productContapyme && productContapyme.length > 0) {
        const responseProductObj = productContapyme.shift();
        const { datos } = responseProductObj.respuesta;
        const { listaprecios, infobasica } = datos;
        // set price
        if (listaprecios && listaprecios.length > 0) {
          const priceList = listaprecios.find((el: any) => el.ilista === "1");
          product.price = Number(priceList.mprecio);
        }

        // validate image
        if (infobasica?.qimagenes && parseInt(infobasica?.qimagenes) > 0) {
          console.log(`Debo sacar las imagenes del producto: ${product.sku}`);
          const urlImg = `${configuration.get(
            "CONTAPYME_MS_API_URL"
          )}/contacpime/product/${product.sku}/images`;
          const imageRequest = await fetch(urlImg);
          const imageProduct = await imageRequest.json();
          const images = [
            {
              path: `https://pymes.motowork.co${imageProduct.path}`,
              type: BannerType.desktop,
            },
            {
              path: `https://pymes.motowork.co${imageProduct.path}`,
              type: BannerType.mobile,
            },
          ];
          productsImages = images;
        }
      }
      const productbd: any = await this.findOneByQuery({ sku: product.sku });
      if (!productbd) {
        product.images = productsImages;
        await this.create(product);
      } else {
        productbd.images = productsImages;
        productbd.price = Number(product.price);
        await this.update(productbd.id, productbd);
      }
    }
  }

  /**
   * Agrega un trabajo a la cola
   */
  public async addJob(data: T, options?: Bull.JobOptions): Promise<Job<T>> {
    const job = await this.queue.add(data, options);
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
