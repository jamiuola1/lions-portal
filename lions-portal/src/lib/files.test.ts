import { describe, expect, it } from "vitest";
import { sniffFile } from "./files";

const bytes = (...n: number[]) => new Uint8Array([...n, ...new Array(32).fill(0)]);
describe("sniffFile", () => {
  it("recognizes common types", () => {
    expect(sniffFile(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffFile(bytes(0x25, 0x50, 0x44, 0x46))).toBe("application/pdf");
    expect(sniffFile(bytes(0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70))).toBe("video/mp4");
  });
  it("rejects scripts and unknown data", () => {
    expect(sniffFile(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(sniffFile(bytes(0x4d, 0x5a))).toBeNull(); // Windows executable
  });
});
