import { createReadStream, existsSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { v2 as cloudinary } from "cloudinary";

const BASE_FOLDER = "programa-de-mano";
const PROGRAMAS_DIRECTORY = join(process.cwd(), "public", "programas");
const IMAGE_EXTENSIONS = new Set([".avif", ".webp", ".png", ".jpg", ".jpeg"]);
const dryRun = process.argv.includes("--dry-run");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

if (!existsSync(PROGRAMAS_DIRECTORY)) {
  console.error(`No existe ${PROGRAMAS_DIRECTORY}`);
  process.exit(1);
}

if (!dryRun && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
  console.error("Faltan variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET.");
  process.exit(1);
}

const programs = readdirSync(PROGRAMAS_DIRECTORY, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((first, second) => first.localeCompare(second));

for (const slug of programs) {
  const programDirectory = join(PROGRAMAS_DIRECTORY, slug);
  const pages = readdirSync(programDirectory)
    .filter((fileName) => IMAGE_EXTENSIONS.has(extname(fileName).toLowerCase()))
    .map((fileName) => ({
      fileName,
      path: join(programDirectory, fileName),
      pageNumber: getPageNumber(fileName),
    }))
    .filter((page) => page.pageNumber !== null)
    .sort((first, second) => first.pageNumber - second.pageNumber);

  console.log(`${dryRun ? "[dry-run] " : ""}${slug}: ${pages.length} páginas`);

  if (dryRun) {
    pages.forEach((page, index) => {
      const order = index + 1;
      console.log(`  ${page.fileName} -> ${BASE_FOLDER}/${slug}/${String(order).padStart(3, "0")} (order ${order})`);
    });
    continue;
  }

  await cloudinary.api.create_folder(`${BASE_FOLDER}/${slug}`).catch((error) => {
    if (error?.http_code !== 409) throw error;
  });

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const order = index + 1;
    const publicId = `${BASE_FOLDER}/${slug}/${String(order).padStart(3, "0")}`;

    await uploadPage(page.path, publicId, slug, order);
    console.log(`  uploaded ${page.fileName} -> ${publicId}`);
  }
}

function uploadPage(path, publicId, slug, order) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        unique_filename: false,
        context: { order: String(order), slug },
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }

        resolve(result);
      },
    );

    createReadStream(path).pipe(stream);
  });
}

function getPageNumber(fileName) {
  const match = fileName.match(/^(\d+)\.(avif|webp|png|jpe?g)$/i);
  return match ? Number(match[1]) : null;
}
