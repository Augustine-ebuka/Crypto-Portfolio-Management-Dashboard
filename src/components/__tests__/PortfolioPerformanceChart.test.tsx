// import { render, screen, fireEvent } from "@testing-library/react";
// import "@testing-library/jest-dom";
// import { PortfolioPerformanceChart } from "../PortfolioPerformanceChart";

// describe("PortfolioPerformanceChart", () => {
//   const mockData = [
//     { timestamp: "Sep 1", date: "2025-09-01", open: 100, high: 110, low: 95, close: 105, volume: 1000, value: 105 },
//     { timestamp: "Sep 2", date: "2025-09-02", open: 105, high: 115, low: 100, close: 110, volume: 2000, value: 110 },
//   ];

//   it("renders the chart with default props", () => {
//     render(<PortfolioPerformanceChart data={mockData} symbol="BTC" />);

//     expect(screen.getByText("BTC Advanced Chart")).toBeInTheDocument();
//     expect(screen.getByText(/\$/)).toBeInTheDocument(); // shows price
//   });

//   it("switches timeframe when tab is clicked", () => {
//     render(<PortfolioPerformanceChart data={mockData} symbol="BTC" />);

//     const tab30D = screen.getByRole("tab", { name: "30D" });
//     fireEvent.click(tab30D);

//     expect(tab30D).toHaveAttribute("data-state", "active"); // shadcn/ui sets data-state
//   });

//   it("switches chart type to candlestick", () => {
//     render(<PortfolioPerformanceChart data={mockData} symbol="BTC" />);

//     const candlestickTab = screen.getByRole("tab", { name: "Candlestick" });
//     fireEvent.click(candlestickTab);

//     expect(candlestickTab).toHaveAttribute("data-state", "active");
//   });

//   it("handles zoom in and reset buttons", () => {
//     render(<PortfolioPerformanceChart data={mockData} symbol="BTC" />);

//     const zoomInButton = screen.getByRole("button", { name: "" }); // no text, just icon
//     fireEvent.click(zoomInButton);

//     const resetButton = screen.getByRole("button", { name: "" });
//     fireEvent.click(resetButton);

//     // We can’t directly test chart zoom values, but we can ensure no errors
//     expect(screen.getByText("BTC Advanced Chart")).toBeInTheDocument();
//   });
// });
