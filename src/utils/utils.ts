import fs from "fs";
import path from "path";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";
import moment from "moment";
import { sign, verify } from "jsonwebtoken";
import { User } from "../types/users.interface";
import configuration from "../../configuration/configuration";

class Utils {
  JWT_SECRET: string = "";
  salt: number = 0;
  path: string;

  constructor() {
    this.JWT_SECRET = configuration.get("JWT_SECRET") || "";
    this.salt = 10;
    this.path = `${process.cwd()}/uploads/`;
  }

  /**
   * split file by delimiter
   * @param {string} file
   * @param {string} delimiter
   * @returns {string}
   */
  splitFile(file: string, delimiter: string): string {
    const nameFile: string = file.split(delimiter).shift() as string;
    return nameFile;
  }

  /**
   * generate sesion token.
   * @param {string} id
   * @param {string} name
   */
  generateToken = async (
    { name, scopes, _id, role, last_name, email }: User,
    time = "1d"
  ) => {
    const jwt = await sign(
      { _id, name, scopes, role, last_name, email },
      this.JWT_SECRET,
      {
        expiresIn: time,
      }
    );
    return jwt;
  };

  /**
   * verify session token
   * @param {string} token
   */
  verifyToken = async (token: string) => {
    const isOk = await verify(token, this.JWT_SECRET);
    return isOk;
  };

  /**
   * Generate password encrypt
   * @param {string} password
   */
  encryptPassword = async (password: string): Promise<string> => {
    const hashedPassword = await bcrypt.hash(password, this.salt);
    return hashedPassword;
  };

  /**
   * Comapre user password
   * @param {string} userPassword user bd password
   * @param {string} loginPassword // form password
   */
  comparePassword = async (
    userPassword: string,
    loginPassword: string
  ): Promise<boolean> => {
    const compare = await bcrypt.compare(loginPassword, userPassword);
    if (!compare) return false;
    return true;
  };

  /**
   * Get current date
   */
  getCurrentDate = (): string => {
    const currentDate = new Date();
    // Get the day, month, and year
    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
    // Format the date in "dd-mm-yyyy" format
    const formattedDate = `${day}-${month}-${year}`;
    return formattedDate;
  };

  /**
   * Format date to YYYY-MM-DD
   * @param {Date} date
   */
  formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  /**
   * get path from storage
   * @param {string} path
   */
  getPath = async (path: string): Promise<string | undefined> => {
    let pathSplit = path.split("/").pop();
    if (path.includes("products")) {
      pathSplit = "products";
    }

    await this.validateOrGeneratePath(pathSplit || "");
    return pathSplit;
  };

  validateOrGeneratePath = async (path: string): Promise<void> => {
    const directory = `${this.path}/${path}`;
    const isDirectoryExist = await fs.existsSync(directory);
    if (!isDirectoryExist) {
      fs.mkdirSync(directory);
    }
  };

  /**
   * Delete file from storage
   * @param {string} path
   */
  deleteItemFromStorage = async (path: string) => {
    const directory = `${this.path}/${path}`;
    const isDirectoryExist = await fs.existsSync(directory);
    if (isDirectoryExist) {
      await fs.unlinkSync(directory);
    }
  };

  /**
   * Generate date
   * @returns { string }
   */
  getDate = () => {
    const now: any = moment().format("YYYY-MM-DD HH:mm:ss");
    return now;
  };

  /**
   * Get date from string
   * @param {string} date
   * @returns { string }
   */
  getDateFromString = (date: string | Date) => {
    const now: any = moment(date).format("YYYY-MM-DD HH:mm:ss");
    return now;
  };

  /**
   * add some time to current date
   * @param { Date } date
   * @param { string } typeAdd
   * @param { string } timeToAdd
   */
  sumTimeToDate = (date: Date, typeAdd: any, timeToAdd: any) => {
    const currentDate: moment.Moment = moment(date);
    // Add one day to the current date
    const futureDate: moment.Moment = currentDate.add(timeToAdd, typeAdd);
    const dateReturn: any = futureDate.format("YYYY-MM-DD HH:mm:ss");
    return dateReturn;
  };

  /**
   * do hash for epayco
   * @param { string } chainText
   */
  doHash = async (chainText: string): Promise<string | void> => {
    const signature: string = await crypto
      .createHash("sha256")
      .update(chainText)
      .digest("hex");
    return signature;
  };

  /**
   * generate token for recovery password.
   * @param {string} id
   * @param {string} name
   */
  generateTokenForRecoveryPassword = async ({ email }: any) => {
    const jwt = await sign({ email }, this.JWT_SECRET, {
      expiresIn: "30m",
    });
    return jwt;
  };

  /**
   * get relative path
   * @param { string } filePath
   */
  getRelativePth = async (filePath: string): Promise<string> => {
    const baseDir = path.resolve("uploads");
    const relativePath = path.relative(baseDir, filePath);
    return relativePath;
  };

  /**
   * generate bufer from file
   * @param { string } path
   */
  generateBuffer = async (path: string): Promise<Buffer> => {
    const buffer = await fs.readFileSync(path);
    return buffer;
  };

  getDateRange = (period: string) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "week":
        const day = now.getDay(); // 0 (domingo) - 6 (sábado)
        const diffToMonday = (day === 0 ? -6 : 1) - day;

        startDate = new Date(now);
        startDate.setDate(now.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        throw new Error('Período no válido. Usa "week", "month" o "year".');
    }

    return { startDate, endDate };
  };
}

export { Utils };
