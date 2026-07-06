import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import HomePage from "../page"

describe("Landing Page", () => {
  it("renders the main headline", () => {
    render(<HomePage />)
    expect(screen.getByText("Unlock Your Career Potential")).toBeInTheDocument()
  })

  it("renders CTA buttons", () => {
    render(<HomePage />)
    expect(screen.getByText("Book Your Free Consultation")).toBeInTheDocument()
  })

  it("renders all pricing plans", () => {
    render(<HomePage />)
    expect(screen.getByText("Free Trial")).toBeInTheDocument()
    expect(screen.getByText("Premium")).toBeInTheDocument()
    expect(screen.getByText("Premium Pro")).toBeInTheDocument()
  })

  it("renders the FAQ section with questions", () => {
    render(<HomePage />)
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument()
    expect(screen.getByText(/Is My Career Dock really free/)).toBeInTheDocument()
  })
})
