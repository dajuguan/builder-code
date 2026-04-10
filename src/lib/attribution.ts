export type Schema = "0" | "1" | "2";

export type DecodedAttribution =
  | {
      schemaId: 0;
      codes: string[];
    }
  | {
      schemaId: 1;
      codes: string[];
      codeRegistry: {
        address: string;
        chainId: number;
      };
    }
  | {
      schemaId: 2;
      cborDataHex: string;
    };

export const ERC8021_MARKER = "80218021802180218021802180218021";

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("0x") || trimmed.startsWith("0X")
    ? trimmed.slice(2).toLowerCase()
    : trimmed.toLowerCase();
}

function isValidHex(value: string): boolean {
  return value.length > 0 && value.length % 2 === 0 && /^[0-9a-f]+$/.test(value);
}

function asciiToHex(value: string): string {
  return Array.from(value)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

function hexToAscii(hex: string): string {
  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  }
  return out;
}

function numberToHex(value: number, bytes = 1): string {
  return value.toString(16).padStart(bytes * 2, "0");
}

function parseCodes(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function decodeAttributionFromHex(inputHex: string):
  | {
      ok: true;
      decoded: DecodedAttribution;
    }
  | {
      ok: false;
      error: string;
    } {
  const hex = normalizeHex(inputHex);

  if (!isValidHex(hex)) {
    return { ok: false, error: "Input data must be valid even-length hex." };
  }

  if (!hex.endsWith(ERC8021_MARKER)) {
    return { ok: false, error: "ERC-8021 marker not found at the end of input data." };
  }

  let cursor = hex.length - ERC8021_MARKER.length;
  if (cursor < 2) {
    return { ok: false, error: "Missing schema id before ERC-8021 marker." };
  }

  const schemaId = parseInt(hex.slice(cursor - 2, cursor), 16);
  cursor -= 2;

  if (schemaId === 0) {
    if (cursor < 2) {
      return { ok: false, error: "Missing codes length for schema 0." };
    }

    const codesLength = parseInt(hex.slice(cursor - 2, cursor), 16);
    cursor -= 2;

    const codesHexLen = codesLength * 2;
    if (cursor < codesHexLen) {
      return { ok: false, error: "Invalid codes length for schema 0." };
    }

    const codesHex = hex.slice(cursor - codesHexLen, cursor);

    return {
      ok: true,
      decoded: {
        schemaId: 0,
        codes: parseCodes(hexToAscii(codesHex)),
      },
    };
  }

  if (schemaId === 1) {
    if (cursor < 2) {
      return { ok: false, error: "Missing codes length for schema 1." };
    }

    const codesLength = parseInt(hex.slice(cursor - 2, cursor), 16);
    cursor -= 2;

    const codesHexLen = codesLength * 2;
    if (cursor < codesHexLen + 2 + 40) {
      return { ok: false, error: "Malformed schema 1 payload." };
    }

    const codesHex = hex.slice(cursor - codesHexLen, cursor);
    cursor -= codesHexLen;

    const chainIdLength = parseInt(hex.slice(cursor - 2, cursor), 16);
    cursor -= 2;

    const chainIdHexLen = chainIdLength * 2;
    if (cursor < chainIdHexLen + 40) {
      return { ok: false, error: "Malformed chain id in schema 1 payload." };
    }

    const chainIdHex = hex.slice(cursor - chainIdHexLen, cursor);
    cursor -= chainIdHexLen;

    const addressHex = hex.slice(cursor - 40, cursor);
    const chainId = chainIdHex ? parseInt(chainIdHex, 16) : 0;

    return {
      ok: true,
      decoded: {
        schemaId: 1,
        codes: parseCodes(hexToAscii(codesHex)),
        codeRegistry: {
          address: `0x${addressHex}`,
          chainId,
        },
      },
    };
  }

  if (schemaId === 2) {
    if (cursor < 2) {
      return { ok: false, error: "Missing CBOR data length for schema 2." };
    }

    const dataLength = parseInt(hex.slice(cursor - 2, cursor), 16);
    cursor -= 2;

    const dataHexLen = dataLength * 2;
    if (cursor < dataHexLen) {
      return { ok: false, error: "Invalid CBOR data length for schema 2." };
    }

    const cborDataHex = hex.slice(cursor - dataHexLen, cursor);

    return {
      ok: true,
      decoded: {
        schemaId: 2,
        cborDataHex: `0x${cborDataHex}`,
      },
    };
  }

  return { ok: false, error: `Unsupported schema id: ${schemaId}.` };
}

export function encodeAttribution(params: {
  schema: Schema;
  codesText: string;
  codeRegistryAddress: string;
  chainIdText: string;
  cborDataHex: string;
}): { ok: true; suffix: string } | { ok: false; error: string } {
  const marker = ERC8021_MARKER;

  if (params.schema === "0") {
    const codes = parseCodes(params.codesText);
    if (codes.length === 0) {
      return { ok: false, error: "Please provide at least one builder code." };
    }

    const codesHex = asciiToHex(codes.join(","));
    const codesLength = codesHex.length / 2;

    if (codesLength > 255) {
      return { ok: false, error: "Builder codes are too long (max 255 bytes)." };
    }

    const suffix = `${codesHex}${numberToHex(codesLength, 1)}00${marker}`;
    return { ok: true, suffix: `0x${suffix}` };
  }

  if (params.schema === "1") {
    const codes = parseCodes(params.codesText);
    if (codes.length === 0) {
      return { ok: false, error: "Please provide at least one builder code." };
    }

    const address = normalizeHex(params.codeRegistryAddress);
    if (!/^[0-9a-f]{40}$/.test(address)) {
      return {
        ok: false,
        error: "Code registry address must be a valid 20-byte hex address.",
      };
    }

    const chainId = Number.parseInt(params.chainIdText, 10);
    if (!Number.isInteger(chainId) || chainId < 0) {
      return { ok: false, error: "Chain ID must be a non-negative integer." };
    }

    const chainIdHexRaw = chainId.toString(16);
    const chainIdHex = chainIdHexRaw.length % 2 === 0 ? chainIdHexRaw : `0${chainIdHexRaw}`;
    const chainIdLength = chainIdHex.length / 2;

    if (chainIdLength > 255) {
      return { ok: false, error: "Chain ID is too large." };
    }

    const codesHex = asciiToHex(codes.join(","));
    const codesLength = codesHex.length / 2;

    if (codesLength > 255) {
      return { ok: false, error: "Builder codes are too long (max 255 bytes)." };
    }

    const suffix = `${address}${chainIdHex}${numberToHex(chainIdLength, 1)}${codesHex}${numberToHex(codesLength, 1)}01${marker}`;
    return { ok: true, suffix: `0x${suffix}` };
  }

  const cbor = normalizeHex(params.cborDataHex);
  if (!isValidHex(cbor)) {
    return { ok: false, error: "CBOR data must be valid even-length hex." };
  }

  const cborLength = cbor.length / 2;
  if (cborLength > 255) {
    return { ok: false, error: "CBOR data is too long (max 255 bytes)." };
  }

  const suffix = `${cbor}${numberToHex(cborLength, 1)}02${marker}`;
  return { ok: true, suffix: `0x${suffix}` };
}
