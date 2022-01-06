import formidable from "formidable";
import fs from "fs";
import crypto from "crypto";
import Client from "@veryfi/veryfi-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

const get = async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      items: true,
    },
  });
  return res.status(200).send(orders);
};

const post = async (req, res) => {
  //const filePath = await saveFile(req);
  const data = fs.readFileSync("./public/example.json"); // await getOrderData(filePath);
  const { line_items, img_url, total } = JSON.parse(data);
  const order = {
    items: line_items.map((i) => {
      return {
        item: i.description,
        quantity: i.quantity,
        price: i.price,
      };
    }),
    token: crypto.randomBytes(5).toString('hex'),
    total,
    img_url,
  };
  const savedOrder = await saveOrder(order);
  return res.status(201).send(savedOrder);
};

const saveOrder = async (order) => {
  const savedOrder = await prisma.order.create({
    data: {
      total: order.total,
      imageURL: order.img_url,
      items: { create: order.items },
    },
  });
  return savedOrder;
};

const getOrderData = async (path) => {
  const veryfi = new Client(
    process.env.VERYFI_CLIENT_ID,
    process.env.VERYFI_CLIENT_SECRET,
    process.env.VERYFI_USERNAME,
    process.env.VERYFI_API_KEY
  );
  const response = await veryfi.process_document(path, [
    "Meals & Entertainment",
  ]);
  return response;
};

const saveFile = async (req) => {
  const form = new formidable.IncomingForm();
  const filePath = await new Promise(function (resolve, reject) {
    form.parse(req, async function (err, fields, files) {
      const file = files.file;
      const data = fs.readFileSync(file.filepath);
      const path = `./public/${file.originalFilename}`;
      fs.writeFileSync(path, data);
      await fs.unlinkSync(file.filepath);
      resolve(path);
    });
  });
  return filePath;
};

export default (req, res) => {
  req.method === "GET"
    ? get(req, res)
    : req.method === "POST"
    ? post(req, res)
    : req.method === "DELETE"
    ? console.log("DELETE")
    : req.method === "PUT"
    ? console.log("PUT")
    : res.status(404).send("");
};