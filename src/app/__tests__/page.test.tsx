import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import HomePage from "../page"

describe("Landing Page", () => {
  it("renders the main headline", () => {
    render(<HomePage />)
    expect(screen.getByText("Career Accelerator")).toBeInTheDocument()
  })

  it("renders CTA buttons", () => {
    render(<HomePage />)
    expect(screen.getByText("Start Free")).toBeInTheDocument()
  })

  it("renders all feature cards", () => {
    render(<HomePage />)
    expect(screen.getByText("ATS Resume Builder")).toBeInTheDocument()
    expect(screen.getByText("Job Pipeline Tracker")).toBeInTheDocument()
    expect(screen.getByText("Smart Suggestions")).toBeInTheDocument()
    expect(screen.getByText("Expert Consultations")).toBeInTheDocument()
  })
})
