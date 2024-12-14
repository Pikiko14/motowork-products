import { check } from "express-validator";
import ProductsRepository from "./../repositories/products.repository";

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
  check("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El descuento debe ser un número positivo."),
  check("category")
    .notEmpty()
    .withMessage("La categoría es obligatoria.")
    .isString()
    .withMessage("La categoría debe ser un texto."),
  check("description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser un texto.")
    .isLength({ min: 1, max: 1500 })
    .withMessage("La descripción debe tener entre 1 y 1500 caracteres."),
  check("banner")
    .optional()
    .isURL()
    .withMessage("El banner debe ser una URL válida."),
  check("images")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Las imágenes deben ser un array con al menos una URL."),
  check("images.*").isURL().withMessage("Cada imagen debe ser una URL válida."),
  check("type")
    .optional()
    .isString()
    .withMessage("El tipo debe ser vehicle o product.")
    .isLength({ min: 1, max: 10 })
    .withMessage("El tipo debe tener entre 1 y 10 caracteres."),
  check("brand_icon").optional(),

  // DETALLES
  check("details.power")
    .notEmpty()
    .withMessage("La potencia es obligatoria.")
    .isString()
    .withMessage("La potencia debe ser un texto."),
  check("details.licenseType")
    .notEmpty()
    .withMessage("El tipo de licencia es obligatorio.")
    .isString()
    .withMessage("El tipo de licencia debe ser un texto."),
  check("details.storage")
    .notEmpty()
    .withMessage("El almacenamiento es obligatorio.")
    .isString()
    .withMessage("El almacenamiento debe ser un texto."),
  check("details.testDrive")
    .notEmpty()
    .withMessage("El test drive es obligatorio."),
  check("details.colors")
    .isArray({ min: 1 })
    .withMessage("Los colores deben ser un array con al menos un valor."),
  check("details.colors.*")
    .isString()
    .withMessage("Cada color debe ser un texto."),

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
  check("additionalInfo.*.subsections.*.subsectionName")
    .notEmpty()
    .withMessage("El nombre de la subsección es obligatorio.")
    .isString()
    .withMessage("El nombre de la subsección debe ser un texto."),
  check("additionalInfo.*.subsections.*.fields")
    .isArray()
    .withMessage("Los campos de la subsección deben ser un array."),
  check("additionalInfo.*.subsections.*.fields.*.name")
    .notEmpty()
    .withMessage("El nombre del campo es obligatorio.")
    .isString()
    .withMessage("El nombre del campo debe ser un texto."),
  check("additionalInfo.*.subsections.*.fields.*.value")
    .optional()
    .isString()
    .withMessage("El valor del campo debe ser un texto."),
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
      const product = await repository.findOneByQuery({ _id: value });
      if (!product) throw new Error("El producto no existe.");
    }),
];

export { ProductCreationValidator, ProductIdValidator };
