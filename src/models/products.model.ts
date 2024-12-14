import { Schema, model, Types } from "mongoose";
import { TaskQueue } from "../queues/cloudinary.queue";
import {
  ProductsInterface,
  SubsectionInterface,
  DetailsProducts,
} from "../types/products.interface";

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
    brand: {
      type: String,
      required: true,
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
      required: true,
    },
    description: {
      type: String,
    },
    banner: {
      type: String,
      required: false,
    },
    images: [
      {
        type: String,
      },
    ],

    // DETALLES
    details: {
      power: { type: String, required: true },
      licenseType: { type: String, required: true },
      storage: { type: String, required: true },
      testDrive: { type: String, required: true },
      colors: [{ type: String, required: true }],
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para optimización
ProductSchema.index({ name: 1, category: 1 });

// Middleware para manejar eliminación de imágenes antes de borrar un producto
// ProductSchema.pre(
//   "findOneAndDelete",
//   { document: true, query: true },
//   async function (next: any) {
//     const queue = new TaskQueue("cloudinary");
//     queue.setupListeners();
//
//     const product: ProductsInterface = await this.model.findOne(this.getQuery()).exec();
//     try {
//       // Eliminar banner
//       if (product.banner) {
//         await queue.addJob(
//           { taskType: "deleteFile", payload: { file: product.banner } },
//           {
//             attempts: 3,
//             backoff: 5000,
//           }
//         );
//       }
//
//       // Eliminar imágenes del producto
//       if (product.images.length > 0) {
//         for (const image of product.images) {
//           await queue.addJob(
//             { taskType: "deleteFile", payload: { file: image } },
//             {
//               attempts: 3,
//               backoff: 5000,
//             }
//           );
//         }
//       }
//       next();
//     } catch (error) {
//       next(error);
//     }
//   }
// );

const ProductModel = model<ProductsInterface>("products", ProductSchema);

export default ProductModel;
