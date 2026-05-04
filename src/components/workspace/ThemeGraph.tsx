"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Ic, ic } from "./icons";
import type { Theme, Code } from "./types";

interface ThemeGraphProps {
  themes: Theme[];
  codes: Code[];
  onBack: () => void;
}

type GraphNode = d3.SimulationNodeDatum & {
  id: string;
  name: string;
  color: string;
  type: "theme" | "code";
  count?: number;
  radius: number;
};

type GraphLink = d3.SimulationLinkDatum<GraphNode> & {
  source: string | GraphNode;
  target: string | GraphNode;
};

export function ThemeGraph({ themes, codes, onBack }: ThemeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });

  // Measure container
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ w: rect.width, h: rect.height });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build and render graph
  useEffect(() => {
    if (!svgRef.current || !dimensions.w) return;

    const allCodes = codes.flatMap((c) => [c, ...(c.children || [])]);
    const { w, h } = dimensions;

    // Build nodes
    const themeNodes: GraphNode[] = themes.map((t) => ({
      id: `t-${t.id}`,
      name: t.name,
      color: t.color,
      type: "theme" as const,
      radius: 24,
    }));

    const codeIdSet = new Set<string>();
    themes.forEach((t) => t.themeCodes.forEach((tc) => codeIdSet.add(tc.code.id)));

    const codeNodes: GraphNode[] = allCodes
      .filter((c) => codeIdSet.has(c.id))
      .map((c) => ({
        id: `c-${c.id}`,
        name: c.name,
        color: c.color,
        type: "code" as const,
        count: c._count.codings,
        radius: Math.max(8, Math.min(18, 8 + c._count.codings * 2)),
      }));

    const nodes: GraphNode[] = [...themeNodes, ...codeNodes];

    // Build links
    const links: GraphLink[] = [];
    themes.forEach((t) => {
      t.themeCodes.forEach((tc) => {
        links.push({ source: `t-${t.id}`, target: `c-${tc.code.id}` });
      });
    });

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(100).strength(0.7))
      .force("charge", d3.forceManyBody<GraphNode>().strength(-300))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => d.radius + 8));

    // Links
    const link = g
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6);

    // Nodes
    const node = g
      .selectAll<SVGGElement, GraphNode>("g.node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Circle
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", (d) => (d.type === "theme" ? 0.9 : 0.7))
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", (d) => (d.type === "theme" ? 3 : 1.5))
      .attr("stroke-opacity", 0.3);

    // Theme icon (inner circle)
    node
      .filter((d) => d.type === "theme")
      .append("circle")
      .attr("r", 8)
      .attr("fill", "white")
      .attr("fill-opacity", 0.3);

    // Label
    node
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.radius + 14)
      .attr("font-size", (d) => (d.type === "theme" ? 12 : 10))
      .attr("font-weight", (d) => (d.type === "theme" ? 600 : 400))
      .attr("fill", "#44403c");

    // Count label for codes
    node
      .filter((d) => d.type === "code" && (d.count ?? 0) > 0)
      .append("text")
      .text((d) => String(d.count))
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("font-size", 9)
      .attr("font-weight", 600)
      .attr("fill", "white");

    // Click handler
    node.on("click", (_, d) => {
      setSelected(d);
    });

    // Hover
    node
      .on("mouseenter", function () {
        d3.select(this).select("circle").transition().duration(150).attr("stroke-opacity", 1);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle").transition().duration(150).attr("stroke-opacity", 0.3);
      });

    // Tick
    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Center view
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    return () => {
      sim.stop();
    };
  }, [themes, codes, dimensions]);

  // Find related info for selected node
  const selectedInfo = selected
    ? selected.type === "theme"
      ? {
          label: "Tema",
          name: selected.name,
          color: selected.color,
          codes: themes
            .find((t) => `t-${t.id}` === selected.id)
            ?.themeCodes.map((tc) => tc.code) || [],
        }
      : {
          label: "Código",
          name: selected.name,
          color: selected.color,
          count: selected.count ?? 0,
          themes: themes
            .filter((t) =>
              t.themeCodes.some((tc) => `c-${tc.code.id}` === selected.id)
            )
            .map((t) => ({ name: t.name, color: t.color })),
        }
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1 rounded hover:bg-stone-100 text-stone-400 transition">
          <Ic d={ic.arrowLeft} className="w-4 h-4" />
        </button>
        <Ic d={ic.graph} className="w-4 h-4 text-trama-500" />
        <h2 className="text-base font-semibold text-stone-800 flex-1">Grafo de Temas</h2>
        <div className="flex items-center gap-4 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-stone-400" /> Tema
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-stone-300" /> Código
          </span>
          <span>Arraste nós · Scroll para zoom</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Graph area */}
        <div ref={containerRef} className="flex-1 relative bg-stone-50">
          <svg ref={svgRef} width={dimensions.w} height={dimensions.h} className="w-full h-full" />
        </div>

        {/* Detail panel */}
        {selectedInfo && (
          <div className="w-64 border-l border-stone-200 p-4 overflow-y-auto bg-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                {selectedInfo.label}
              </span>
              <button onClick={() => setSelected(null)} className="text-stone-300 hover:text-stone-500">
                <Ic d={ic.x} className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: selectedInfo.color }} />
              <span className="text-sm font-semibold text-stone-800">{selectedInfo.name}</span>
            </div>

            {"codes" in selectedInfo && (
              <>
                <p className="text-[11px] font-medium text-stone-400 mb-2">
                  {selectedInfo.codes?.length} código{selectedInfo.codes?.length !== 1 && "s"}:
                </p>
                <div className="space-y-1">
                  {selectedInfo.codes?.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-stone-50">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <span className="text-xs text-stone-600">{c.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {"count" in selectedInfo && (
              <>
                <p className="text-xs text-stone-500 mb-3">
                  {selectedInfo.count} codificaç{selectedInfo.count !== 1 ? "ões" : "ão"}
                </p>
                <p className="text-[11px] font-medium text-stone-400 mb-2">
                  Presente em {selectedInfo.themes?.length} tema{selectedInfo.themes?.length !== 1 && "s"}:
                </p>
                <div className="space-y-1">
                  {selectedInfo.themes?.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-stone-50">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                      <span className="text-xs text-stone-600">{t.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
