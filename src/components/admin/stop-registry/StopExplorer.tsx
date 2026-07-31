import React from "react";
import { AdminStop, StopTreeNode, getStopId } from "./stopRegistryTypes";
import { StopTreeRow } from "./StopTreeRow";

interface StopExplorerProps {
  treeNodes: StopTreeNode[];
  selectedStopId: string | null;
  expandedNodeIds: Set<string>;
  onToggleExpand: (stopId: string, e: React.MouseEvent) => void;
  onSelectStop: (stop: AdminStop) => void;
}

export const StopExplorer: React.FC<StopExplorerProps> = ({
  treeNodes,
  selectedStopId,
  expandedNodeIds,
  onToggleExpand,
  onSelectStop,
}) => {
  // Helper to render tree nodes recursively
  const renderTree = (nodes: StopTreeNode[]) => {
    return nodes.map((node) => {
      const stopId = getStopId(node.stop);
      const isSelected = selectedStopId === stopId;
      const isExpanded = expandedNodeIds.has(stopId);

      return (
        <div key={stopId} className="space-y-1">
          <StopTreeRow
            node={node}
            isSelected={isSelected}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onSelect={onSelectStop}
          />
          {/* Render children if expanded */}
          {node.children.length > 0 && isExpanded && (
            <div className="space-y-1 relative">
              {/* Subtle visual connector line */}
              <div className="absolute left-4 top-0 bottom-2 w-px bg-white/10 pointer-events-none" />
              {renderTree(node.children)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212]/40 backdrop-blur-md p-4 flex flex-col h-full min-h-[420px]">
      <div className="flex items-center justify-between px-2 pb-3 border-b border-white/10 text-xs text-white/50 font-bold uppercase tracking-wider shrink-0">
        <span>Stop Hierarchy Explorer</span>
        <span>Capability / Status</span>
      </div>

      <div className="flex-1 overflow-y-auto pt-3 space-y-1 pr-1" style={{ maxHeight: "calc(100vh - 360px)" }}>
        {renderTree(treeNodes)}
      </div>
    </div>
  );
};
