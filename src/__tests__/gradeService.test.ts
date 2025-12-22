import { describe, it, expect } from "vitest";
import { getGrade } from "../utils/gradeService";

describe("GradeServiceTest", () => {
  it("Status INVALID untuk nilai tidak valid", () => {
    expect(getGrade(-1)).toBe("INVALID");
    expect(getGrade(101)).toBe("INVALID");
    // @ts-expect-error: sengaja kirim tipe salah
    expect(getGrade("90")).toBe("INVALID");
  });

  it("Menghasilkan Grade A untuk rentang nilai tinggi", () => {
    expect(getGrade(80)).toBe("A");
    expect(getGrade(95)).toBe("A");
    expect(getGrade(100)).toBe("A");
  });

  it("Menghasilkan Grade B untuk rentang nilai menengah", () => {
    expect(getGrade(60)).toBe("B");
    expect(getGrade(75)).toBe("B");
  });

  it("Menghasilkan Grade C untuk rentang nilai rendah", () => {
    expect(getGrade(0)).toBe("C");
    expect(getGrade(59)).toBe("C");
  });
});
