import { Schema, model } from "mongoose";
import { TaskQueue } from "../queues/cloudinary.queue";
import {
  ProductsInterface,
  TypeProducts,
  BannerType,
} from "../types/products.interface";
import { Utils } from "../utils/utils";
const utils = new Utils();

const ProductSchema = new Schema<ProductsInterface>(
  {
    // INFO GENERAL
    name: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      enum: ["Nueva", "Usada"],
      required: true,
    },
    dive_test: {
      type: Boolean,
      required: false,
      default: false,
    },
    brand: {
      type: String,
      required: true,
    },
    brand_icon: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: false,
    },
    description: {
      type: String,
    },
    sku: {
      type: String,
      required: false,
    },
    banner: [
      {
        type_banner: {
          type: String,
          enum: Object.values(BannerType),
          required: false,
        },
        path: {
          type: String,
          required: false,
        }
      }
    ],
    images: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          auto: true,
        },
        path: {
          type: String,
          required: false,
        },
        type: {
          type: String,
          enum: Object.values(BannerType),
          required: false,
        },
        default_image: {
          type: Boolean,
          required: false,
          default: false,
        },
      },
    ],
    type: {
      type: String,
      enum: Object.values(TypeProducts),
      required: true,
    },
    active: {
      type: Boolean,
      required: false,
      default: true,
    },
    reviews: [
      {
        date: {
          type: String,
          default: utils.getCurrentDate()
        },
        amount: {
          type: Number,
          required: false,
        },
        name: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: false
        }
      }
    ],

    // DETALLES
    details: {
      power: { type: Number, required: false },
      weight: { type: String, required: false },
      max_power: { type: String, required: false },
      torque: { type: String, required: false },
      type_engine: { type: String, required: false },
      colors: [
        {
          hex: { type: String, required: false },
          image: { type: String, required: false }
        }
      ],
    },

    // INFO ADICIONAL
    additionalInfo: [
      {
        sectionName: { type: String, required: true },
        enable: { type: Boolean, required: true },
        subsections: [
          {
            name: { type: String, required: true },
            value: { type: String },
          },
        ],
      },
    ],

    // variants
    variants: [
      {
        sku: { type: String, default: '', require: true },
        attribute: { type: String, default: '', require: true },
        description: { type: String, default: '', require: false },
        image: { type: String, default: '', require: false },
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para optimización
ProductSchema.index({ name: 1, category: 1, brand: 1 });

// Middleware para manejar eliminación de imágenes antes de borrar un producto
ProductSchema.pre(
  "findOneAndDelete",
  { document: true, query: true },
  async function (next: any) {
    const queue = new TaskQueue("cloudinary_products");
    queue.setupListeners();
    const product: ProductsInterface = await this.model.findOne(this.getQuery()).exec();
    try {
      // Eliminar banner
      if (product && product.banner) {
        for (const item of product.banner) {
          await queue.addJob(
            { taskType: "deleteFile", payload: { file: item.path } },
            {
              attempts: 3,
              backoff: 5000,
            }
          );
        }
      }

      // Eliminar imágenes del producto
      if (product.images.length > 0) {
        for (const image of product.images) {
          await queue.addJob(
            { taskType: "deleteFile", payload: { file: image.path } },
            {
              attempts: 3,
              backoff: 5000,
            }
          );
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  }
);

const ProductModel = model<ProductsInterface>("products", ProductSchema);

export default ProductModel;
