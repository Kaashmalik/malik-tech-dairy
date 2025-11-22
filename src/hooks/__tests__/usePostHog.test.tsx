import { renderHook } from "@testing-library/react";
import { usePostHogAnalytics } from "../usePostHog";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";

// Mock dependencies
jest.mock("@clerk/nextjs");
jest.mock("posthog-js/react");

const mockPostHog = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  group: jest.fn(),
};

describe("usePostHogAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      userId: "test-user-id",
    });
    (useOrganization as jest.Mock).mockReturnValue({
      organization: {
        id: "test-org-id",
        slug: "test-org",
      },
    });
    (usePostHog as jest.Mock).mockReturnValue(mockPostHog);
  });

  it("should track events with tenant context", () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    result.current.trackEvent("test_event", { customProp: "value" });

    expect(mockPostHog.capture).toHaveBeenCalledWith("test_event", {
      customProp: "value",
      tenantId: "test-org-id",
      tenantSlug: "test-org",
      userId: "test-user-id",
    });
  });

  it("should track page views", () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    result.current.trackPageView("/dashboard", { section: "main" });

    expect(mockPostHog.capture).toHaveBeenCalledWith("$pageview", {
      page_name: "/dashboard",
      section: "main",
      tenantId: "test-org-id",
      tenantSlug: "test-org",
      userId: "test-user-id",
    });
  });

  it("should track button clicks", () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    result.current.trackButtonClick("submit_button", "form", { formType: "animal" });

    expect(mockPostHog.capture).toHaveBeenCalledWith("button_clicked", {
      button_name: "submit_button",
      location: "form",
      formType: "animal",
      tenantId: "test-org-id",
      tenantSlug: "test-org",
      userId: "test-user-id",
    });
  });

  it("should track milk log events", () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    result.current.trackMilkLog({
      animalId: "animal-123",
      quantity: 15.5,
      session: "morning",
    });

    expect(mockPostHog.capture).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button_name: "log_milk",
        location: "milk_log_form",
        event_type: "milk_logged",
        animalId: "animal-123",
        quantity: 15.5,
        session: "morning",
      })
    );
  });

  it("should track animal creation events", () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    result.current.trackAnimalCreation({
      species: "cow",
      breed: "Holstein",
    });

    expect(mockPostHog.capture).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button_name: "create_animal",
        location: "animal_form",
        event_type: "animal_created",
        species: "cow",
        breed: "Holstein",
      })
    );
  });

  it("should track report download events", () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    result.current.trackReportDownload({
      reportType: "daily",
      format: "pdf",
    });

    expect(mockPostHog.capture).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button_name: "download_report",
        location: "reports_page",
        event_type: "report_downloaded",
        reportType: "daily",
        format: "pdf",
      })
    );
  });

  it("should return posthog instance for feature flags", () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    expect(result.current.posthog).toBe(mockPostHog);
  });

  it("should handle missing posthog gracefully", () => {
    (usePostHog as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => usePostHogAnalytics());

    // Should not throw
    result.current.trackEvent("test_event");
    expect(mockPostHog.capture).not.toHaveBeenCalled();
  });
});

