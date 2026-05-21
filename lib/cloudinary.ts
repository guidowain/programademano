import { v2 as cloudinary } from "cloudinary";

export const PROGRAMAS_BASE_FOLDER = "programa-de-mano";

export type ProgramPage = {
  assetId: string;
  publicId: string;
  url: string;
  width: number;
  height: number;
  order: number;
  format: string;
};

export type ProgramSummary = {
  slug: string;
  pageCount: number;
  coverUrl: string | null;
  updatedAt: string | null;
};

type CloudinaryResource = {
  asset_id: string;
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  created_at?: string;
  context?: {
    custom?: Record<string, string>;
    [key: string]: unknown;
  };
};

let configured = false;

export class MissingCloudinaryConfigError extends Error {
  constructor() {
    super("Missing Cloudinary configuration");
    this.name = "MissingCloudinaryConfigError";
  }
}

export function configureCloudinary() {
  if (configured) return;

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new MissingCloudinaryConfigError();
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
}

export function getCloudinary() {
  configureCloudinary();
  return cloudinary;
}

export function isValidProgramSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

export function getProgramFolder(slug: string) {
  return `${PROGRAMAS_BASE_FOLDER}/${slug}`;
}

export async function listPrograms(): Promise<ProgramSummary[]> {
  const api = getCloudinary().api;

  try {
    const folders = await api.sub_folders(PROGRAMAS_BASE_FOLDER);
    const summaries = await Promise.all(
      (folders.folders || []).map(async (folder: { name: string }) => {
        const pages = await listProgramPages(folder.name);
        return {
          slug: folder.name,
          pageCount: pages.length,
          coverUrl: pages[0]?.url ?? null,
          updatedAt: null,
        };
      }),
    );

    return summaries.sort((first, second) => first.slug.localeCompare(second.slug));
  } catch (error: unknown) {
    if (isCloudinaryNotFound(error)) return [];
    throw error;
  }
}

export async function createProgramFolder(slug: string) {
  if (!isValidProgramSlug(slug)) {
    throw new Error("Invalid slug");
  }

  try {
    await getCloudinary().api.create_folder(getProgramFolder(slug));
  } catch (error: unknown) {
    if (!isCloudinaryAlreadyExists(error)) throw error;
  }
}

export async function listProgramPages(slug: string): Promise<ProgramPage[]> {
  if (!isValidProgramSlug(slug)) return [];

  const folder = getProgramFolder(slug);
  const resources: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await getCloudinary().api.resources({
      type: "upload",
      resource_type: "image",
      prefix: `${folder}/`,
      max_results: 500,
      context: true,
      next_cursor: nextCursor,
    });

    resources.push(...(response.resources || []));
    nextCursor = response.next_cursor;
  } while (nextCursor);

  return resources
    .filter((resource) => resource.public_id.startsWith(`${folder}/`))
    .map((resource, index) => ({
      assetId: resource.asset_id,
      publicId: resource.public_id,
      url: resource.secure_url,
      width: resource.width ?? 1080,
      height: resource.height ?? 1920,
      order: getResourceOrder(resource, index),
      format: resource.format ?? "image",
    }))
    .sort((first, second) => first.order - second.order || first.publicId.localeCompare(second.publicId));
}

export async function uploadProgramPages(slug: string, files: File[]) {
  if (!isValidProgramSlug(slug)) {
    throw new Error("Invalid slug");
  }

  const existingPages = await listProgramPages(slug);
  const maxOrder = existingPages.reduce((order, page) => Math.max(order, page.order), 0);
  const uploaded: ProgramPage[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const order = maxOrder + index + 1;
    const buffer = Buffer.from(await files[index].arrayBuffer());
    const result = await uploadBuffer(buffer, slug, order);

    uploaded.push({
      assetId: result.asset_id,
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      order,
      format: result.format,
    });
  }

  return uploaded;
}

export async function reorderProgramPages(slug: string, assetIds: string[]) {
  const pages = await listProgramPages(slug);
  const pagesByAssetId = new Map(pages.map((page) => [page.assetId, page]));

  if (
    assetIds.length !== pages.length ||
    assetIds.some((assetId) => !pagesByAssetId.has(assetId))
  ) {
    throw new Error("Invalid page order");
  }

  await Promise.all(
    assetIds.map((assetId, index) => {
      const page = pagesByAssetId.get(assetId)!;
      return getCloudinary().api.update(page.publicId, {
        resource_type: "image",
        context: { order: String(index + 1), slug },
        invalidate: true,
      });
    }),
  );

  return listProgramPages(slug);
}

export async function deleteProgramPage(slug: string, assetId: string) {
  const pages = await listProgramPages(slug);
  const page = pages.find((item) => item.assetId === assetId);

  if (!page) {
    throw new Error("Page not found");
  }

  await getCloudinary().uploader.destroy(page.publicId, {
    resource_type: "image",
    invalidate: true,
  });
}

export async function deleteProgram(slug: string) {
  if (!isValidProgramSlug(slug)) {
    throw new Error("Invalid slug");
  }

  const folder = getProgramFolder(slug);
  const api = getCloudinary().api;

  await api.delete_resources_by_prefix(`${folder}/`, {
    resource_type: "image",
    invalidate: true,
  });

  try {
    await api.delete_folder(folder);
  } catch (error: unknown) {
    if (!isCloudinaryNotFound(error)) throw error;
  }
}

function uploadBuffer(buffer: Buffer, slug: string, order: number) {
  const folder = getProgramFolder(slug);
  const publicId = `${folder}/${String(order).padStart(3, "0")}`;

  return new Promise<CloudinaryResource & { width: number; height: number; format: string }>((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        unique_filename: false,
        context: { order: String(order), slug },
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result as unknown as CloudinaryResource & { width: number; height: number; format: string });
      },
    );

    stream.end(buffer);
  });
}

function getResourceOrder(resource: CloudinaryResource, fallbackIndex: number) {
  const context = resource.context?.custom ?? {};
  const order = Number(context.order);

  if (Number.isFinite(order) && order > 0) return order;

  const match = resource.public_id.match(/\/(\d+)$/);
  if (match) return Number(match[1]);

  return fallbackIndex + 1;
}

function isCloudinaryNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "http_code" in error &&
    (error as { http_code?: number }).http_code === 404
  );
}

function isCloudinaryAlreadyExists(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "http_code" in error &&
    (error as { http_code?: number }).http_code === 409
  );
}
