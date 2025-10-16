import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { NetworkSnapshot } from "../../../server/src/routers/analytics";
import { formatSignedUSD, formatUSD } from "@/utils/formatters";
import { cn } from "@/lib/utils";

type WalletEntity = NetworkSnapshot["walletEntities"][number];
type NetworkEvent = NetworkSnapshot["events"][number];
type EntityType = WalletEntity["type"];

type GraphNode = d3.SimulationNodeDatum & {
  id: string;
  wallet: WalletEntity;
  radius: number;
};

type GraphLink = d3.SimulationLinkDatum<GraphNode> & {
  id: string;
  value: number;
  chain: string;
  token: string;
};

type TooltipState = {
  wallet: WalletEntity;
  position: {
    x: number;
    y: number;
  };
};

type NetworkGraphProps = {
  wallets: WalletEntity[];
  events: NetworkEvent[];
  selectedChain: string;
  highlightedWalletId: string | null;
  onWalletHover?: (walletId: string | null) => void;
  onWalletSelect?: (walletId: string | null) => void;
  className?: string;
};

const typeToColor: Record<EntityType, string> = {
  whale: "#f97316",
  exchange: "#22d3ee",
};

const defaultRadius = 18;

const NetworkGraphComponent = ({
  wallets,
  events,
  selectedChain,
  highlightedWalletId,
  onWalletHover,
  onWalletSelect,
  className,
}: NetworkGraphProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown> | null>(null);
  const linkSelectionRef = useRef<d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown> | null>(null);
  const labelSelectionRef = useRef<d3.Selection<SVGTextElement, GraphNode, SVGGElement, unknown> | null>(null);
  const linksRef = useRef<GraphLink[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const radiusScale = useMemo(() => {
    if (!wallets.length) {
      return () => defaultRadius;
    }

    const extent = d3.extent(wallets, (wallet) => wallet.balanceUSD) as [number | undefined, number | undefined];

    if (extent[0] == null || extent[1] == null || extent[0] === extent[1]) {
      return () => defaultRadius;
    }

    const scale = d3.scaleSqrt().domain(extent).range([14, 34]);
    return (value: number) => scale(value);
  }, [wallets]);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = wallets.map((wallet) => ({
      id: wallet.id,
      wallet,
      radius: radiusScale(wallet.balanceUSD),
    }));

    const links: GraphLink[] = events.map((event) => ({
      id: event.id,
      source: event.from,
      target: event.to,
      value: event.amountUSD,
      chain: event.chain,
      token: event.token,
    }));

    return { nodes, links };
  }, [wallets, events, radiusScale]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      const height = Math.max(360, width * 0.6);
      setDimensions({ width, height });
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!dimensions.width || !dimensions.height) return;

    const nodes = graphData.nodes.map((node) => ({ ...node }));
    const links = graphData.links.map((link) => ({ ...link }));
    linksRef.current = links;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .style("overflow", "visible");

    const link = svg
      .append("g")
      .attr("stroke", "rgba(148, 163, 184, 0.45)")
      .attr("stroke-width", 1.2)
      .attr("stroke-linecap", "round")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links, (d) => d.id)
      .join("line")
      .attr("stroke-opacity", 0.4);

    const node = svg
      .append("g")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(nodes, (d) => d.id)
      .join("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => typeToColor[d.wallet.type])
      .attr("stroke", "rgba(15,23,42,0.65)")
      .attr("stroke-width", 1.4)
      .style("cursor", "pointer");

    const labels = svg
      .append("g")
      .selectAll<SVGTextElement, GraphNode>("text")
      .data(nodes, (d) => d.id)
      .join("text")
      .text((d) => d.wallet.label)
      .attr("font-size", 12)
      .attr("fill", "rgba(226,232,240,0.9)")
      .attr("font-weight", 500)
      .attr("pointer-events", "none");

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((linkDatum) => {
            const normalized = Math.log10(linkDatum.value + 10);
            return 150 - normalized * 12;
          })
          .strength(0.6),
      )
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => d.radius + 18));

    const dragBehaviour = d3
      .drag<SVGCircleElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(dragBehaviour as any);

    node
      .on("mouseenter", (event, d) => {
        const rect = containerRef.current?.getBoundingClientRect();
        const x = event.clientX - (rect?.left ?? 0);
        const y = event.clientY - (rect?.top ?? 0);
        setTooltip({ wallet: d.wallet, position: { x, y } });
        onWalletHover?.(d.wallet.id);
      })
      .on("mousemove", (event, d) => {
        const rect = containerRef.current?.getBoundingClientRect();
        const x = event.clientX - (rect?.left ?? 0);
        const y = event.clientY - (rect?.top ?? 0);
        setTooltip({ wallet: d.wallet, position: { x, y } });
      })
      .on("mouseleave", () => {
        setTooltip(null);
        onWalletHover?.(null);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        onWalletSelect?.(d.wallet.id);
      });

    svg.on("click", (event) => {
      if (event.target === svg.node()) {
        onWalletSelect?.(null);
        onWalletHover?.(null);
        setTooltip(null);
      }
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => ((d.source as GraphNode).x ?? 0))
        .attr("y1", (d) => ((d.source as GraphNode).y ?? 0))
        .attr("x2", (d) => ((d.target as GraphNode).x ?? 0))
        .attr("y2", (d) => ((d.target as GraphNode).y ?? 0));

      node
        .attr("cx", (d) => d.x ?? 0)
        .attr("cy", (d) => d.y ?? 0);

      labels
        .attr("x", (d) => (d.x ?? 0) + Math.sign(d.x ?? 1) * (d.radius + 8))
        .attr("y", (d) => (d.y ?? 0) + 4);
    });

    nodeSelectionRef.current = node;
    linkSelectionRef.current = link;
    labelSelectionRef.current = labels;

    return () => {
      simulation.stop();
      svg.on("click", null);
    };
  }, [graphData, dimensions.width, dimensions.height, onWalletHover, onWalletSelect]);

  useEffect(() => {
    const nodeSelection = nodeSelectionRef.current;
    const linkSelection = linkSelectionRef.current;
    const labelSelection = labelSelectionRef.current;

    if (!nodeSelection || !linkSelection) return;

    const activeWalletId = highlightedWalletId;
    const chainFilterActive = selectedChain && selectedChain !== "all";

    const connectedWallets = new Set<string>();

    if (activeWalletId) {
      linksRef.current.forEach((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;
        if (sourceId === activeWalletId) connectedWallets.add(targetId);
        if (targetId === activeWalletId) connectedWallets.add(sourceId);
      });
    }

    const computeNodeOpacity = (node: GraphNode) => {
      const matchesChain = !chainFilterActive || node.wallet.chain === selectedChain;
      if (activeWalletId) {
        if (node.wallet.id === activeWalletId) return 1;
        if (connectedWallets.has(node.wallet.id)) return 0.92;
        return 0.12;
      }
      if (chainFilterActive) {
        return matchesChain ? 0.95 : 0.2;
      }
      return 0.92;
    };

    nodeSelection
      .attr("opacity", (d) => computeNodeOpacity(d))
      .attr("stroke", (d) => (activeWalletId === d.wallet.id ? "#fb7185" : "rgba(15,23,42,0.65)"))
      .attr("stroke-width", (d) => (activeWalletId === d.wallet.id ? 3 : 1.4));

    linkSelection
      .attr("stroke-opacity", (link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;
        const matchesChain = !chainFilterActive || link.chain === selectedChain;
        if (activeWalletId) {
          return sourceId === activeWalletId || targetId === activeWalletId ? 0.9 : 0.05;
        }
        if (chainFilterActive) {
          return matchesChain ? 0.55 : 0.1;
        }
        return 0.4;
      })
      .attr("stroke", (link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;
        const isActive = activeWalletId
          ? sourceId === activeWalletId || targetId === activeWalletId
          : false;
        return isActive ? "#fb7185" : "rgba(148,163,184,0.5)";
      })
      .attr("stroke-width", (link) => {
        const base = Math.max(1.4, Math.log10(link.value + 10) * 0.9);
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;
        if (activeWalletId && (sourceId === activeWalletId || targetId === activeWalletId)) {
          return base + 1.2;
        }
        return base;
      });

    labelSelection?.attr("opacity", (d) => {
      const nodeOpacity = computeNodeOpacity(d);
      return nodeOpacity > 0.4 ? 1 : 0.15;
    });
  }, [selectedChain, highlightedWalletId]);

  if (!wallets.length || !events.length) {
    return (
      <div className={cn("flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 text-sm text-slate-400", className)}>
        Not enough network activity for this selection yet.
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full overflow-hidden rounded-xl bg-slate-950/60", className)}>
      <svg ref={svgRef} role="img" aria-label="Wallet network graph" className="w-full" />

      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center gap-4 rounded-lg bg-slate-900/80 px-4 py-2 text-xs text-slate-300 backdrop-blur">
        <div className="flex items-center gap-1"><span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: typeToColor.whale }} />Whales</div>
        <div className="flex items-center gap-1"><span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: typeToColor.exchange }} />Exchanges</div>
        {selectedChain !== "all" && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{selectedChain} focus</span>
        )}
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 w-56 -translate-y-full rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 shadow-xl backdrop-blur"
          style={{
            left: Math.min(Math.max(tooltip.position.x + 12, 8), Math.max(8, (dimensions.width ?? 0) - 200)),
            top: Math.max(tooltip.position.y - 16, 40),
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-100">{tooltip.wallet.label}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                tooltip.wallet.type === "whale"
                  ? "bg-orange-500/15 text-orange-300"
                  : "bg-sky-500/15 text-sky-200",
              )}
            >
              {tooltip.wallet.type}
            </span>
          </div>
          <div className="mt-2 space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span>Chain</span>
              <span>{tooltip.wallet.chain}</span>
            </div>
            <div className="flex justify-between">
              <span>Balance</span>
              <span>{formatUSD(tooltip.wallet.balanceUSD)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net flow</span>
              <span className={tooltip.wallet.netFlowUSD >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {formatSignedUSD(tooltip.wallet.netFlowUSD)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const NetworkGraph = memo(NetworkGraphComponent);
export default NetworkGraph;
