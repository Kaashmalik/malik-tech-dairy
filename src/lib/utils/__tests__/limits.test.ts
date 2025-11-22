import {
  canAddAnimal,
  canAddUser,
  hasFeature,
  getRemainingAnimalSlots,
  getRemainingUserSlots,
} from "../limits";
import type { TenantLimits } from "@/types";

const mockLimits: TenantLimits = {
  maxAnimals: 10,
  maxUsers: 5,
  features: ["reports", "analytics"],
};

describe("canAddAnimal", () => {
  it("should return false if limits are null", () => {
    expect(canAddAnimal(null, 0)).toBe(false);
  });

  it("should return true if unlimited", () => {
    const unlimitedLimits = { ...mockLimits, maxAnimals: -1 };
    expect(canAddAnimal(unlimitedLimits, 100)).toBe(true);
  });

  it("should return true if under limit", () => {
    expect(canAddAnimal(mockLimits, 5)).toBe(true);
    expect(canAddAnimal(mockLimits, 9)).toBe(true);
  });

  it("should return false if at limit", () => {
    expect(canAddAnimal(mockLimits, 10)).toBe(false);
  });

  it("should return false if over limit", () => {
    expect(canAddAnimal(mockLimits, 11)).toBe(false);
  });
});

describe("canAddUser", () => {
  it("should return false if limits are null", () => {
    expect(canAddUser(null, 0)).toBe(false);
  });

  it("should return true if unlimited", () => {
    const unlimitedLimits = { ...mockLimits, maxUsers: -1 };
    expect(canAddUser(unlimitedLimits, 100)).toBe(true);
  });

  it("should return true if under limit", () => {
    expect(canAddUser(mockLimits, 3)).toBe(true);
    expect(canAddUser(mockLimits, 4)).toBe(true);
  });

  it("should return false if at limit", () => {
    expect(canAddUser(mockLimits, 5)).toBe(false);
  });

  it("should return false if over limit", () => {
    expect(canAddUser(mockLimits, 6)).toBe(false);
  });
});

describe("hasFeature", () => {
  it("should return false if limits are null", () => {
    expect(hasFeature(null, "reports")).toBe(false);
  });

  it("should return true if feature exists", () => {
    expect(hasFeature(mockLimits, "reports")).toBe(true);
    expect(hasFeature(mockLimits, "analytics")).toBe(true);
  });

  it("should return false if feature does not exist", () => {
    expect(hasFeature(mockLimits, "premium")).toBe(false);
    expect(hasFeature(mockLimits, "unknown")).toBe(false);
  });
});

describe("getRemainingAnimalSlots", () => {
  it("should return null if limits are null", () => {
    expect(getRemainingAnimalSlots(null, 0)).toBe(null);
  });

  it("should return null if unlimited", () => {
    const unlimitedLimits = { ...mockLimits, maxAnimals: -1 };
    expect(getRemainingAnimalSlots(unlimitedLimits, 100)).toBe(null);
  });

  it("should return correct remaining slots", () => {
    expect(getRemainingAnimalSlots(mockLimits, 5)).toBe(5);
    expect(getRemainingAnimalSlots(mockLimits, 9)).toBe(1);
    expect(getRemainingAnimalSlots(mockLimits, 10)).toBe(0);
  });

  it("should return 0 if over limit", () => {
    expect(getRemainingAnimalSlots(mockLimits, 11)).toBe(0);
  });
});

describe("getRemainingUserSlots", () => {
  it("should return null if limits are null", () => {
    expect(getRemainingUserSlots(null, 0)).toBe(null);
  });

  it("should return null if unlimited", () => {
    const unlimitedLimits = { ...mockLimits, maxUsers: -1 };
    expect(getRemainingUserSlots(unlimitedLimits, 100)).toBe(null);
  });

  it("should return correct remaining slots", () => {
    expect(getRemainingUserSlots(mockLimits, 2)).toBe(3);
    expect(getRemainingUserSlots(mockLimits, 4)).toBe(1);
    expect(getRemainingUserSlots(mockLimits, 5)).toBe(0);
  });

  it("should return 0 if over limit", () => {
    expect(getRemainingUserSlots(mockLimits, 6)).toBe(0);
  });
});

