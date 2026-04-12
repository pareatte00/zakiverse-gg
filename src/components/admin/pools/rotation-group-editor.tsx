"use client"

import { GameButton } from "@/components/game/game-button"
import { PackCard } from "@/components/game/pack-card"
import { Input } from "@/components/ui/input"
import type { PackPayload } from "@/lib/api/db/api.pack"
import type { PackPoolPackItem } from "@/lib/api/db/api.pack-pool"
import { cn } from "@/lib/utils"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Loader2, Package, Plus, Search, Trash2, X } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"

// ── Types ──

interface PackDisplayInfo {
  id:             string
  code:           string
  name:           string
  image:          string
  name_image:     string | null
  total_cards:    number
  cards_per_pull: number
}

interface RotationGroupEditorProps {
  allPacks:       PackPayload[]
  poolPacks?:     PackPoolPackItem[]
  packsLoading:   boolean
  packSearch:     string
  onPackSearch:   (search: string) => void
  activeCount:    number
  groups:         string[][]
  onGroupsChange: (groups: string[][]) => void
}

// ── Helpers ──

const UNASSIGNED = "unassigned"

function buildPackMap(
  allPacks: PackPayload[],
  poolPacks?: PackPoolPackItem[],
): Map<string, PackDisplayInfo> {
  const map = new Map<string, PackDisplayInfo>()

  for (const p of allPacks) {
    map.set(p.id, { id: p.id, code: p.code, name: p.name, image: p.image, name_image: p.name_image, total_cards: p.total_cards, cards_per_pull: p.cards_per_pull })
  }

  if (poolPacks) {
    for (const p of poolPacks) {
      if (!map.has(p.id)) {
        map.set(p.id, { id: p.id, code: p.code, name: p.name, image: p.image, name_image: p.name_image, total_cards: 0, cards_per_pull: p.cards_per_pull })
      }
    }
  }

  return map
}

function containerId(index: number): string {
  return `group-${index}`
}

// ── SortablePackItem ──

function SortablePackItem({
  id,
  pack,
  onRemove,
  isOverlay,
}: {
  id:         string
  pack:       PackDisplayInfo | undefined
  onRemove?:  () => void
  isOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!pack) return null

  return (
    <div
      className={cn(
        "group relative cursor-grab touch-none active:cursor-grabbing",
        isDragging && !isOverlay && "opacity-30",
      )}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <PackCard pack={pack as PackPayload} tiltEnabled={false} />

      {onRemove && (
        <button
          className={"absolute right-1.5 top-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100"}
          type={"button"}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className={"h-3 w-3"} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

// ── DroppableGroup ──

function DroppableGroup({
  groupIndex,
  packIds,
  activeCount,
  packMap,
  onRemovePack,
  onDeleteGroup,
}: {
  groupIndex:    number
  packIds:       string[]
  activeCount:   number
  packMap:       Map<string, PackDisplayInfo>
  onRemovePack:  (packId: string) => void
  onDeleteGroup: () => void
}) {
  const id = containerId(groupIndex)
  const { setNodeRef } = useDroppable({ id })
  const isFull = packIds.length >= activeCount

  return (
    <div
      className={cn(
        "rounded-xl border bg-zinc-900/60 transition-colors",
        isFull ? "border-amber-500/20" : "border-zinc-800/40",
      )}
      ref={setNodeRef}
    >
      <div className={"flex items-center justify-between rounded-t-xl bg-zinc-800/40 px-4 py-2"}>
        <div className={"flex items-center gap-2"}>
          <span className={"text-sm font-semibold text-amber-400/80"}>Rotation {groupIndex + 1}</span>

          <span className={"text-[10px] text-zinc-500"}>
            {packIds.length}/{activeCount} packs
          </span>
        </div>

        <button
          className={"rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-700/40 hover:text-red-400"}
          title={"Delete group"}
          type={"button"}
          onClick={onDeleteGroup}
        >
          <Trash2 className={"h-3.5 w-3.5"} />
        </button>
      </div>

      <SortableContext id={id} items={packIds} strategy={rectSortingStrategy}>
        <div className={"min-h-[80px] p-3"}>
          {packIds.length === 0
            ? (
              <div className={"flex h-16 items-center justify-center rounded-lg border border-dashed border-zinc-700/40 text-[11px] text-zinc-600"}>
                Drop packs here
              </div>
            )
            : (
              <div className={"grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}>
                {packIds.map((packId) => (
                  <SortablePackItem
                    id={packId}
                    key={packId}
                    pack={packMap.get(packId)}
                    onRemove={() => onRemovePack(packId)}
                  />
                ))}
              </div>
            )}
        </div>
      </SortableContext>
    </div>
  )
}

// ── Main Editor ──

export function RotationGroupEditor({
  allPacks,
  poolPacks,
  packsLoading,
  packSearch,
  onPackSearch,
  activeCount,
  groups,
  onGroupsChange,
}: RotationGroupEditorProps) {
  const [ activeId, setActiveId ] = useState<UniqueIdentifier | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const { setNodeRef: setUnassignedRef } = useDroppable({ id: UNASSIGNED })
  const packMap = useMemo(() => buildPackMap(allPacks, poolPacks), [ allPacks, poolPacks ])
  // All pack IDs currently assigned to any group
  const assignedIds = useMemo(() => new Set(groups.flat()), [ groups ])
  // Unassigned = packs from allPacks that are NOT in any group
  const unassignedIds = useMemo(
    () => allPacks.filter((p) => !assignedIds.has(p.id)).map((p) => p.id),
    [ allPacks, assignedIds ],
  )
  // Build container map: "unassigned" -> ids, "group-0" -> ids, etc.
  const containers = useMemo(() => {
    const map: Record<string, string[]> = { [UNASSIGNED]: unassignedIds }

    groups.forEach((g, i) => {
      map[containerId(i)] = g
    })

    return map
  }, [ unassignedIds, groups ])
  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 }}),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  // Collision detection: pointerWithin first, fallback to closestCenter
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pw = pointerWithin(args)

    if (pw.length > 0) return pw

    return closestCenter(args)
  }, [])

  // Find which container holds an item (or if the id IS a container)
  function findContainer(id: UniqueIdentifier): string | undefined {
    const idStr = String(id)

    if (idStr in containers) return idStr

    return Object.keys(containers).find((key) => containers[key].includes(idStr))
  }

  // ── DnD handlers ──

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event

    if (!over) return

    const activeContainer = findContainer(active.id)
    let overContainer = findContainer(over.id)

    // If over.id is a container itself (e.g. dropping on an empty group)
    if (!overContainer && String(over.id) in containers) {
      overContainer = String(over.id)
    }

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    // Prevent dropping into a full group (unless it's the unassigned pool)
    if (overContainer !== UNASSIGNED) {
      const groupIdx = parseInt(overContainer.replace("group-", ""), 10)

      if (!isNaN(groupIdx) && groups[groupIdx]?.length >= activeCount) return
    }

    // Move item from activeContainer to overContainer
    const activeItems = [ ...containers[activeContainer] ]
    const overItems = [ ...containers[overContainer] ]
    const activeIndex = activeItems.indexOf(String(active.id))
    // Find insertion index
    const overIndex = overItems.indexOf(String(over.id))
    const insertIndex = overIndex >= 0 ? overIndex : overItems.length

    // Remove from source
    activeItems.splice(activeIndex, 1)

    // Insert into target
    overItems.splice(insertIndex, 0, String(active.id))

    // Update groups state
    const newGroups = [ ...groups ]

    if (activeContainer === UNASSIGNED) {
      // Item moved from unassigned to a group — no change to groups for source
    }
    else {
      const srcIdx = parseInt(activeContainer.replace("group-", ""), 10)

      if (!isNaN(srcIdx)) newGroups[srcIdx] = activeItems
    }

    if (overContainer === UNASSIGNED) {
      // Item moved to unassigned — remove from group (already handled above)
    }
    else {
      const dstIdx = parseInt(overContainer.replace("group-", ""), 10)

      if (!isNaN(dstIdx)) newGroups[dstIdx] = overItems
    }

    onGroupsChange(newGroups)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer || activeContainer !== overContainer) return

    // Same-container reorder
    const items = containers[activeContainer]
    const oldIndex = items.indexOf(String(active.id))
    const newIndex = items.indexOf(String(over.id))

    if (oldIndex === newIndex) return

    if (activeContainer === UNASSIGNED) return // no reorder in unassigned

    const groupIdx = parseInt(activeContainer.replace("group-", ""), 10)

    if (isNaN(groupIdx)) return

    const newGroups = [ ...groups ]

    newGroups[groupIdx] = arrayMove(items, oldIndex, newIndex)
    onGroupsChange(newGroups)
  }

  // ── Group operations ──

  function addGroup() {
    onGroupsChange([ ...groups, [] ])
  }

  function deleteGroup(index: number) {
    // Remove group — packs go back to unassigned automatically
    const newGroups = groups.filter((_, i) => i !== index)

    if (newGroups.length === 0) newGroups.push([])

    onGroupsChange(newGroups)
  }

  function removePack(groupIndex: number, packId: string) {
    const newGroups = [ ...groups ]

    newGroups[groupIndex] = newGroups[groupIndex].filter((id) => id !== packId)
    onGroupsChange(newGroups)
  }

  function handleSearch(value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current)

    searchTimer.current = setTimeout(() => {
      onPackSearch(value)
    }, 300)
  }

  const activePack = activeId ? packMap.get(String(activeId)) : undefined

  return (
    <DndContext
      collisionDetection={collisionDetection}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      {/* ── Unassigned Pack Pool ── */}
      <div className={"mb-5"}>
        <p className={"mb-2 text-[11px] uppercase tracking-wider text-zinc-500"}>Available Packs</p>

        <div className={"rounded-xl border border-dashed border-zinc-700/40 bg-zinc-900/30 p-4"} ref={setUnassignedRef}>
          <div className={"relative mb-3"}>
            <Search className={"absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600"} />

            <Input
              className={"h-auto rounded-none border-x-0 border-t-0 border-b border-zinc-700/60 bg-transparent px-0 pb-1.5 pl-8 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-amber-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"}
              defaultValue={packSearch}
              placeholder={"Search packs..."}
              type={"text"}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {packsLoading
            ? (
              <div className={"flex items-center gap-2 py-4 text-sm text-zinc-500"}>
                <Loader2 className={"h-4 w-4 animate-spin"} />
                Loading packs...
              </div>
            )
            : unassignedIds.length === 0
              ? (
                <div className={"flex flex-col items-center gap-2 py-6"}>
                  <Package className={"h-5 w-5 text-zinc-700"} />

                  <p className={"text-xs text-zinc-600"}>
                    {allPacks.length === 0 ? "No packs found." : "All packs assigned to groups."}
                  </p>
                </div>
              )
              : (
                <SortableContext id={UNASSIGNED} items={unassignedIds} strategy={rectSortingStrategy}>
                  <div className={"grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}>
                    {unassignedIds.map((id) => (
                      <SortablePackItem id={id} key={id} pack={packMap.get(id)} />
                    ))}
                  </div>
                </SortableContext>
              )}
        </div>
      </div>

      {/* ── Rotation Groups ── */}
      <div className={"space-y-3"}>
        {groups.map((packIds, index) => (
          <DroppableGroup
            activeCount={activeCount}
            groupIndex={index}
            key={containerId(index)}
            packIds={packIds}
            packMap={packMap}
            onDeleteGroup={() => deleteGroup(index)}
            onRemovePack={(packId) => removePack(index, packId)}
          />
        ))}
      </div>

      <GameButton
        className={"mt-3 w-full"}
        variant={"ghost"}
        onClick={addGroup}
      >
        <Plus className={"h-3.5 w-3.5"} />
        {" "}
        Add Rotation Group
      </GameButton>

      {/* ── Drag Overlay ── */}
      <DragOverlay>
        {activeId && activePack
          ? (
            <div className={"w-36 opacity-80"}>
              <PackCard pack={activePack as PackPayload} tiltEnabled={false} />
            </div>
          )
          : null}
      </DragOverlay>
    </DndContext>
  )
}
