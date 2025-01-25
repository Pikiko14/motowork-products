import { check } from "express-validator";
import ProductsRepository from "./../repositories/products.repository";
import { NextFunction, Request, Response } from "express";
import { handlerValidator } from "../utils/handler.validator";

const repository = new ProductsRepository();

const ProductCreationValidator = [
  // INFO GENERAL
  check("name")
    .notEmpty()
    .withMessage("El nombre del producto es obligatorio.")
    .isString()
    .withMessage("El nombre debe ser un texto.")
    .isLength({ min: 1, max: 90 })
    .withMessage("El nombre debe tener entre 1 y 90 caracteres."),
  check("model")
    .notEmpty()
    .withMessage("El modelo del producto es obligatorio.")
    .isString()
    .withMessage("El modelo debe ser un texto.")
    .isLength({ min: 1, max: 90 })
    .withMessage("El modelo debe tener entre 1 y 90 caracteres."),
  check("state")
    .notEmpty()
    .withMessage("El estado del producto es obligatorio.")
    .isIn(["Nueva", "Usada"])
    .withMessage("El estado debe ser 'Nueva' o 'Usada'."),
  check("brand")
    .notEmpty()
    .withMessage("La marca del producto es obligatoria.")
    .isString()
    .withMessage("La marca debe ser un texto.")
    .isLength({ min: 1, max: 90 })
    .withMessage("La marca debe tener entre 1 y 90 caracteres."),
  check("price")
    .notEmpty()
    .withMessage("El precio es obligatorio.")
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser un número mayor a 0."),
  check("discount").optional(),
  check("sku").optional(),
  check("category")
    .notEmpty()
    .withMessage("La categoría es obligatoria.")
    .isString()
    .withMessage("La categoría debe ser un texto."),
  check("description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser un texto.")
    .isLength({ min: 0, max: 1500 })
    .withMessage("La descripción debe tener entre 1 y 1500 caracteres."),
  check("type")
    .optional()
    .isString()
    .withMessage("El tipo debe ser vehicle o product.")
    .isLength({ min: 1, max: 10 })
    .withMessage("El tipo debe tener entre 1 y 10 caracteres."),
  check("brand_icon").optional(),

  // DETALLES
  check("details.power")
    .optional()
    .isString()
    .withMessage("La potencia debe ser un numero."),
  check("details.weight")
    .optional()
    .isString()
    .withMessage("El tipo de licencia debe ser un texto."),
  check("details.max_power")
    .optional()
    .isString()
    .withMessage("El almacenamiento debe ser un texto."),
  check("details.torque")
    .optional()
    .isString()
    .withMessage("El torque debe ser un texto."),
  check("details.type_engine")
    .optional()
    .isString()
    .withMessage("El tipo de motor debe ser un texto."),
  check("details.colors")
    .optional()
    .isArray({ min: 0 })
    .withMessage("Los colores deben ser un array con al menos un valor."),
  check("details.colors.*.hex")
    .notEmpty()
    .isString()
    .withMessage("Cada color debe ser un texto."),
  check("details.colors.*.image")
    .optional()
    .isString()
    .withMessage("La imagen debe ser un string."),

  // INFO ADICIONAL
  check("additionalInfo")
    .optional()
    .isArray()
    .withMessage("La información adicional debe ser un array."),
  check("additionalInfo.*.enable")
    .isBoolean()
    .withMessage("El enable debe ser un valor booleano."),
  check("additionalInfo.*.sectionName")
    .notEmpty()
    .withMessage("El nombre de la sección es obligatorio.")
    .isString()
    .withMessage("El nombre de la sección debe ser un texto."),
  check("additionalInfo.*.subsections")
    .isArray()
    .withMessage("Las subsecciones deben ser un array."),
  check("additionalInfo.*.subsections.*.name")
    .notEmpty()
    .withMessage("El nombre de la subsección es obligatorio.")
    .isString()
    .withMessage("El nombre de la subsección debe ser un texto."),
  check("additionalInfo.*.subsections.*.name")
    .notEmpty()
    .withMessage("El nombre del campo es obligatorio.")
    .isString()
    .withMessage("El nombre del campo debe ser un texto."),
  check("additionalInfo.*.subsections.*.value")
    .optional()
    .isString()
    .withMessage("El valor del campo debe ser un texto."),

  // variables
  check("variants")
    .optional()
    .isArray()
    .withMessage("Las variables deben ser un array."),
  check("variants.*.sku")
    .notEmpty()
    .isString()
    .withMessage("El SKU debe ser un texto.")
    .isLength({ min: 1, max: 60 })
    .withMessage("El SKU debe tener entre 1 y 60 caracteres."),
  check("variants.*.attribute")
    .notEmpty()
    .isString()
    .withMessage("El atributo debe ser un texto.")
    .isLength({ min: 1, max: 60 })
    .withMessage("El atributo debe tener entre 1 y 60 caracteres."),
  check("variants.*.description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser un string.")
    .isLength({ min: 0, max: 1500 })
    .withMessage("La descripción debe tener entre 1 y 1500 caracteres."),
  check("variants.*.image")
    .optional()
    .isString()
    .withMessage("La imagen debe ser un string."),
  (req: Request, res: Response, next: NextFunction) =>
    handlerValidator(req, res, next),
];

const ProductIdValidator = [
  check("id")
    .exists()
    .withMessage("Debes especificar el id del producto.")
    .notEmpty()
    .withMessage("El id del producto no puede estar vacio.")
    .isMongoId()
    .withMessage("El id del producto debe ser un id de mongo.")
    .custom(async (value: string) => {
      const product = await repository.findById(value);
      if (!product) {
        throw new Error("El producto no existe.");
      }
    }),
  (req: Request, res: Response, next: NextFunction) =>
    handlerValidator(req, res, next),
];

export { ProductCreationValidator, ProductIdValidator };
