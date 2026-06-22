import { v2 as cloudinary } from "cloudinary";

export const PROGRAMAS_BASE_FOLDER = "programa-de-mano";
const PROGRAM_METADATA_PUBLIC_ID = "programa-de-mano-metadata";

export type ProgramPage = {
  assetId: string;
  publicId: string;
  url: string;
  optimizedUrl: string;
  width: number;
  height: number;
  order: number;
  format: string;
};

export type ProgramSummary = {
  name: string;
  slug: string;
  ticketUrl: string;
  pageCount: number;
  coverUrl: string | null;
  updatedAt: string | null;
};

const CLOUDINARY_UPLOAD_MARKER = "/upload/";
const PROGRAM_PAGE_WIDTH = 1080;

export type ProgramDetails = {
  name: string;
  slug: string;
  ticketUrl: string;
  pages: ProgramPage[];
};

const STATIC_PROGRAMS: Record<string, ProgramDetails> = {
  charlie: {
    name: "Charlie y la fábrica de chocolate",
    slug: "charlie",
    ticketUrl: "https://tuentrada.com/charlie-ylfdc-tgr",
    pages: [
      createStaticProgramPage("charlie", 1, 1080, 1920),
      createStaticProgramPage("charlie", 2, 1080, 1507),
      createStaticProgramPage("charlie", 3, 1080, 3761),
      createStaticProgramPage("charlie", 4, 1080, 6081),
      createStaticProgramPage("charlie", 5, 1080, 7936),
      createStaticProgramPage("charlie", 6, 1081, 3510),
      createStaticProgramPage("charlie", 7, 1080, 4836),
      createStaticProgramPage("charlie", 8, 1080, 1200),
      createStaticProgramPage("charlie", 9, 1080, 1485),
      createStaticProgramPage("charlie", 10, 1080, 1559),
      createStaticProgramPage("charlie", 11, 1080, 1774),
    ],
  },
};

type ProgramMetadata = {
  name: string;
  slug: string;
  ticketUrl: string;
};

type CloudinaryResource = {
  asset_id: string;
  public_id: string;
  secure_url: string;
  asset_folder?: string;
  filename?: string;
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
    const metadata = await getProgramMetadata();
    const metadataBySlug = new Map(metadata.map((program) => [program.slug, program]));
    const folders = await api.sub_folders(PROGRAMAS_BASE_FOLDER);
    const summaries = await Promise.all(
      (folders.folders || []).map(async (folder: { name: string }) => {
        const pages = await listProgramPages(folder.name);
        const programMetadata = metadataBySlug.get(folder.name);

        return {
          name: programMetadata?.name || formatSlugName(folder.name),
          slug: folder.name,
          ticketUrl: programMetadata?.ticketUrl || "",
          pageCount: pages.length,
          coverUrl: pages[0]?.optimizedUrl ?? null,
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

export async function createProgram(slug: string, name: string, ticketUrl = "") {
  await createProgramFolder(slug);
  await upsertProgramMetadata({
    slug,
    name: normalizeProgramName(name, slug),
    ticketUrl: normalizeTicketUrl(ticketUrl),
  });
}

export async function updateProgram(currentSlug: string, input: { name: string; slug: string; ticketUrl: string }) {
  const nextSlug = input.slug.trim().toLowerCase();

  if (!isValidProgramSlug(currentSlug) || !isValidProgramSlug(nextSlug)) {
    throw new Error("Invalid slug");
  }

  if (currentSlug !== nextSlug) {
    await getCloudinary().api.rename_folder(getProgramFolder(currentSlug), getProgramFolder(nextSlug));
  }

  await upsertProgramMetadata({
    slug: nextSlug,
    name: normalizeProgramName(input.name, nextSlug),
    ticketUrl: normalizeTicketUrl(input.ticketUrl),
  }, currentSlug);

  return getProgramDetails(nextSlug);
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

export async function getProgramDetails(slug: string): Promise<ProgramDetails> {
  const staticProgram = STATIC_PROGRAMS[slug];
  if (staticProgram) return staticProgram;

  const pages = await listProgramPages(slug);
  const metadata = await getProgramMetadata();
  const programMetadata = metadata.find((program) => program.slug === slug);

  return {
    name: programMetadata?.name || formatSlugName(slug),
    slug,
    ticketUrl: programMetadata?.ticketUrl || "",
    pages,
  };
}

export async function listProgramPages(slug: string): Promise<ProgramPage[]> {
  const staticProgram = STATIC_PROGRAMS[slug];
  if (staticProgram) return staticProgram.pages;

  if (!isValidProgramSlug(slug)) return [];

  const folder = getProgramFolder(slug);
  const resources = await searchProgramFolder(folder);

  return resources
    .map((resource, index) => ({
      assetId: resource.asset_id,
      publicId: resource.public_id,
      url: resource.secure_url,
      optimizedUrl: getOptimizedCloudinaryImageUrl(resource.secure_url, PROGRAM_PAGE_WIDTH),
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

  await createProgramFolder(slug);

  const existingPages = await listProgramPages(slug);
  const maxOrder = existingPages.reduce((order, page) => Math.max(order, page.order), 0);
  const uploaded: ProgramPage[] = [];
  const sortedFiles = [...files].sort(compareFilesByPageOrder);

  for (let index = 0; index < sortedFiles.length; index += 1) {
    const order = maxOrder + index + 1;
    const file = sortedFiles[index];
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, slug, order, file.name);

    uploaded.push({
      assetId: result.asset_id,
      publicId: result.public_id,
      url: result.secure_url,
      optimizedUrl: getOptimizedCloudinaryImageUrl(result.secure_url, PROGRAM_PAGE_WIDTH),
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
  const pages = await listProgramPages(slug);

  await Promise.all(
    pages.map((page) =>
      getCloudinary().uploader.destroy(page.publicId, {
        resource_type: "image",
        invalidate: true,
      }),
    ),
  );

  try {
    await api.delete_folder(folder);
  } catch (error: unknown) {
    if (!isCloudinaryNotFound(error)) throw error;
  }

  await removeProgramMetadata(slug);
}

async function getProgramMetadata(): Promise<ProgramMetadata[]> {
  try {
    const resource = await getCloudinary().api.resource(PROGRAM_METADATA_PUBLIC_ID, {
      resource_type: "raw",
    });
    const response = await fetch(resource.secure_url, { cache: "no-store" });

    if (!response.ok) return [];

    const data = await response.json();
    return normalizeProgramMetadata(data);
  } catch (error: unknown) {
    if (isCloudinaryNotFound(error)) return [];
    return [];
  }
}

async function saveProgramMetadata(metadata: ProgramMetadata[]) {
  const dataUri = `data:application/json;base64,${Buffer.from(
    JSON.stringify(normalizeProgramMetadata(metadata), null, 2),
    "utf-8",
  ).toString("base64")}`;

  await getCloudinary().uploader.upload(dataUri, {
    public_id: PROGRAM_METADATA_PUBLIC_ID,
    resource_type: "raw",
    overwrite: true,
    invalidate: true,
  });
}

async function upsertProgramMetadata(program: ProgramMetadata, previousSlug = program.slug) {
  const metadata = await getProgramMetadata();
  const nextMetadata = metadata.filter((item) => item.slug !== previousSlug && item.slug !== program.slug);

  nextMetadata.push(program);
  await saveProgramMetadata(nextMetadata);
}

async function removeProgramMetadata(slug: string) {
  const metadata = await getProgramMetadata();
  await saveProgramMetadata(metadata.filter((program) => program.slug !== slug));
}

function uploadBuffer(buffer: Buffer, slug: string, order: number, fileName: string) {
  const folder = getProgramFolder(slug);
  const publicId = `${String(order).padStart(3, "0")}_${slug}_${getSafeFileStem(fileName)}`;

  return new Promise<CloudinaryResource & { width: number; height: number; format: string }>((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      {
        asset_folder: folder,
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

function createStaticProgramPage(slug: string, order: number, width: number, height: number): ProgramPage {
  const url = `/programas/${slug}/${order}.webp`;

  return {
    assetId: `${slug}-${String(order).padStart(3, "0")}`,
    publicId: `static/${slug}/${order}`,
    url,
    optimizedUrl: url,
    width,
    height,
    order,
    format: "webp",
  };
}

export function getOptimizedCloudinaryImageUrl(url: string, width = PROGRAM_PAGE_WIDTH) {
  if (!url.includes("res.cloudinary.com") || !url.includes(CLOUDINARY_UPLOAD_MARKER)) return url;

  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  const uploadEndIndex = markerIndex + CLOUDINARY_UPLOAD_MARKER.length;
  const rest = url.slice(uploadEndIndex);
  const firstSegment = rest.split("/")[0] || "";

  if (firstSegment.includes(",") || firstSegment.startsWith("f_") || firstSegment.startsWith("q_") || firstSegment.startsWith("c_")) {
    return url;
  }

  return `${url.slice(0, uploadEndIndex)}f_auto,q_auto:good,c_limit,w_${Math.round(width)}/${rest}`;
}

function getResourceOrder(resource: CloudinaryResource, fallbackIndex: number) {
  const context = getResourceContext(resource);
  const order = Number(context.order);

  if (Number.isFinite(order) && order > 0) return order;

  const name = resource.filename || getPublicIdBasename(resource.public_id);
  const match = name.match(/^0*(\d+)(?:[_-].*)?$/);
  if (match) return Number(match[1]);

  return fallbackIndex + 1;
}

function getResourceContext(resource: CloudinaryResource) {
  const context = resource.context ?? {};
  const customContext = context.custom;

  if (customContext && typeof customContext === "object") {
    return customContext;
  }

  return context as Record<string, string>;
}

async function searchProgramFolder(folder: string): Promise<CloudinaryResource[]> {
  const resources: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await getCloudinary().search
      .expression(`resource_type:image AND asset_folder="${folder}"`)
      .with_field("context")
      .max_results(500)
      .next_cursor(nextCursor)
      .execute();

    resources.push(...((response.resources || []) as CloudinaryResource[]));
    nextCursor = response.next_cursor;
  } while (nextCursor);

  return resources;
}

function compareFilesByPageOrder(first: File, second: File) {
  const firstOrder = getFileNameOrder(first.name);
  const secondOrder = getFileNameOrder(second.name);

  if (firstOrder !== secondOrder) return firstOrder - secondOrder;
  return first.name.localeCompare(second.name, undefined, { numeric: true, sensitivity: "base" });
}

function getFileNameOrder(fileName: string) {
  const match = fileName.match(/^0*(\d+)(?:[_\-.].*)?$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function getPublicIdBasename(publicId: string) {
  return publicId.split("/").pop() || publicId;
}

function getSafeFileStem(fileName: string) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const cleanStem = stem
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleanStem || "page";
}

function normalizeProgramName(name: string, slug: string) {
  return name.trim() || formatSlugName(slug);
}

function normalizeProgramMetadata(data: unknown): ProgramMetadata[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      const raw = item && typeof item === "object" ? (item as Partial<ProgramMetadata>) : {};
      const slug = String(raw.slug || "").trim().toLowerCase();
      const name = normalizeProgramName(String(raw.name || ""), slug);
      const ticketUrl = normalizeTicketUrl(String(raw.ticketUrl || ""));

      return { slug, name, ticketUrl };
    })
    .filter((program) => isValidProgramSlug(program.slug));
}

function normalizeTicketUrl(url: string) {
  return url.trim();
}

function formatSlugName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || slug;
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
