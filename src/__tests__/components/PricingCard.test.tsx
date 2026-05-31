import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PricingCard from "@/components/marketing/PricingCard";
import { PLANS } from "@/lib/clientPlans";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const freePlan = {
  name: PLANS.FREE.name,
  description: PLANS.FREE.description,
  price: PLANS.FREE.price,
  features: PLANS.FREE.features,
  ctaLabel: "Get Started Free",
  ctaHref: "/sign-up",
};

const proPlan = {
  name: PLANS.PRO.name,
  description: PLANS.PRO.description,
  price: PLANS.PRO.price,
  features: PLANS.PRO.features,
  featured: true as const,
  ctaLabel: "Upgrade to Pro",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PricingCard", () => {
  it("renders the plan name and price", () => {
    render(<PricingCard {...freePlan} />);
    expect(screen.getByTestId("plan-name")).toHaveTextContent("Free");
    expect(screen.getByTestId("plan-price")).toHaveTextContent("$0");
  });

  it("renders all feature bullets", () => {
    render(<PricingCard {...freePlan} />);
    const list = screen.getByTestId("feature-list");
    // FREE plan has 5 features
    expect(list.querySelectorAll("li").length).toBe(PLANS.FREE.features.length);
  });

  it("renders CTA as a link when ctaHref is provided", () => {
    render(<PricingCard {...freePlan} />);
    const cta = screen.getByTestId("cta-button");
    expect(cta.tagName.toLowerCase()).toBe("a");
    expect(cta).toHaveTextContent("Get Started Free");
  });

  it("renders CTA as a button when no ctaHref is provided", () => {
    const onCtaClick = vi.fn();
    render(<PricingCard {...proPlan} onCtaClick={onCtaClick} />);
    const cta = screen.getByTestId("cta-button");
    expect(cta.tagName.toLowerCase()).toBe("button");
  });

  it("calls onCtaClick when button CTA is clicked", () => {
    const onCtaClick = vi.fn();
    render(<PricingCard {...proPlan} onCtaClick={onCtaClick} />);
    fireEvent.click(screen.getByTestId("cta-button"));
    expect(onCtaClick).toHaveBeenCalledOnce();
  });

  it("disables the CTA button when isLoading=true", () => {
    render(<PricingCard {...proPlan} isLoading onCtaClick={vi.fn()} />);
    expect(screen.getByTestId("cta-button")).toBeDisabled();
  });

  it("shows 'Most Popular' ribbon for featured plan", () => {
    render(<PricingCard {...proPlan} onCtaClick={vi.fn()} />);
    expect(screen.getByTestId("featured-ribbon")).toBeInTheDocument();
  });

  it("does NOT show ribbon for non-featured plan", () => {
    render(<PricingCard {...freePlan} />);
    expect(screen.queryByTestId("featured-ribbon")).toBeNull();
  });

  it("renders Enterprise plan with contact-sales CTA label", () => {
    render(
      <PricingCard
        name={PLANS.ENTERPRISE.name}
        description={PLANS.ENTERPRISE.description}
        price={PLANS.ENTERPRISE.price}
        features={PLANS.ENTERPRISE.features}
        ctaLabel="Contact Sales"
        onCtaClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId("cta-button")).toHaveTextContent("Contact Sales");
    expect(screen.getByTestId("plan-price")).toHaveTextContent("$99");
  });
});
