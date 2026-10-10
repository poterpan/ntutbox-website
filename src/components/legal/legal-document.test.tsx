import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalRichText } from "./legal-document";

describe("LegalRichText", () => {
  it("站內連結、外部連結與待確認標記", () => {
    const { container } = render(
      <LegalRichText text="見[使用條款](/terms/)，或寫信到[信箱](mailto:a@b.c)、[IG](https://x.y)。【待確認：時限】結尾" />,
    );
    const links = container.querySelectorAll("a");
    // 測試環境的 next/link 不套 trailingSlash，站內連結只比路徑本身
    expect([...links].map((a) => a.getAttribute("href")?.replace(/\/$/, ""))).toEqual([
      "/terms",
      "mailto:a@b.c",
      "https://x.y",
    ]);
    expect(links[1].getAttribute("target")).toBeNull();
    expect(links[2].getAttribute("target")).toBe("_blank");
    expect(container.querySelector("mark")?.textContent).toBe("【待確認：時限】");
    expect(container.textContent).toBe("見使用條款，或寫信到信箱、IG。【待確認：時限】結尾");
  });
});
