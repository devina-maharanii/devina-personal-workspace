import { describe, it, expect } from "vitest";
import { cn } from "../src/lib/utils";

describe("Tailwind Merge Utility (cn)", () => {
  it("should merge classes successfully", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
  });

  it("should resolve conflicts correctly", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("should handle dynamic conditional classes", () => {
    const active = true;
    const disabled = false;
    const result = cn("btn", active && "btn-active", disabled && "btn-disabled");
    expect(result).toBe("btn btn-active");
  });
});
