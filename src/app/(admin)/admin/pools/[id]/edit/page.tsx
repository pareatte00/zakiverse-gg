"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ImagePicker } from "@/components/admin/cards/image-picker"
import { RotationGroupEditor } from "@/components/admin/pools/rotation-group-editor"
import { GameButton, GameButtonGroup } from "@/components/game/game-button"
import { PackCard } from "@/components/game/pack-card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { PackPayload } from "@/lib/api/db/api.pack"
import { packFindAll } from "@/lib/api/db/api.pack"
import type { BannerType, PackPoolPackItem, RotationOrderMode, RotationType } from "@/lib/api/db/api.pack-pool"
import { packPoolAssignPacks, packPoolFindOneById, packPoolSortRotation, packPoolUpdateOneById } from "@/lib/api/db/api.pack-pool"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowLeft, CalendarIcon, Check, Clock, Loader2, Package, Save, Search } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const underlineInput = "h-auto rounded-none border-x-0 border-t-0 border-b border-zinc-700/60 bg-transparent px-0 pb-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-amber-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"
const labelClass = "mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"
const sectionCard = "rounded-xl border border-zinc-800/40 bg-zinc-900/60 p-5"
const BANNER_OPTIONS: { value: BannerType, label: string, selectedClassName?: string }[] = [
  { value: "standard", label: "Standard", selectedClassName: "!bg-zinc-600/20 !text-zinc-300 !border-zinc-600/50" },
  { value: "featured", label: "Featured", selectedClassName: "!bg-amber-500/15 !text-amber-400 !border-amber-500/30" },
]
const ROTATION_OPTIONS: { value: RotationType, label: string, selectedClassName?: string }[] = [
  { value: "none", label: "None" },
  { value: "weekly", label: "Weekly", selectedClassName: "!bg-blue-500/15 !text-blue-400 !border-blue-500/30" },
  { value: "monthly", label: "Monthly", selectedClassName: "!bg-violet-500/15 !text-violet-400 !border-violet-500/30" },
]
const DAY_OF_WEEK_OPTIONS: { value: string, label: string, selectedClassName?: string }[] = [
  { value: "0", label: "Sun", selectedClassName: "!bg-rose-500/15 !text-rose-400 !border-rose-500/30" },
  { value: "1", label: "Mon", selectedClassName: "!bg-amber-500/15 !text-amber-400 !border-amber-500/30" },
  { value: "2", label: "Tue", selectedClassName: "!bg-amber-500/15 !text-amber-400 !border-amber-500/30" },
  { value: "3", label: "Wed", selectedClassName: "!bg-amber-500/15 !text-amber-400 !border-amber-500/30" },
  { value: "4", label: "Thu", selectedClassName: "!bg-amber-500/15 !text-amber-400 !border-amber-500/30" },
  { value: "5", label: "Fri", selectedClassName: "!bg-amber-500/15 !text-amber-400 !border-amber-500/30" },
  { value: "6", label: "Sat", selectedClassName: "!bg-sky-500/15 !text-sky-400 !border-sky-500/30" },
]
const ORDER_MODE_OPTIONS: { value: RotationOrderMode, label: string, selectedClassName?: string }[] = [
  { value: "auto", label: "Auto", selectedClassName: "!bg-emerald-500/15 !text-emerald-400 !border-emerald-500/30" },
  { value: "manual", label: "Manual", selectedClassName: "!bg-amber-500/15 !text-amber-400 !border-amber-500/30" },
]

export default function EditPoolPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const poolId = params.id
  const initialized = useRef(false)
  const [ loading, setLoading ] = useState(true)
  const [ saving, setSaving ] = useState(false)
  // General
  const [ name, setName ] = useState("")
  const [ description, setDescription ] = useState("")
  const [ image, setImage ] = useState("")
  const [ customImages, setCustomImages ] = useState<string[]>([])
  const [ sortOrder, setSortOrder ] = useState(0)
  const [ isActive, setIsActive ] = useState(false)
  const [ previewDays, setPreviewDays ] = useState(0)
  // Banner
  const [ bannerType, setBannerType ] = useState<BannerType>("standard")
  // Schedule
  const [ openAt, setOpenAt ] = useState<Date | undefined>(undefined)
  const [ closeAt, setCloseAt ] = useState<Date | undefined>(undefined)
  // Rotation
  const [ rotationType, setRotationType ] = useState<RotationType>("none")
  const [ rotationDay, setRotationDay ] = useState<number | undefined>(undefined)
  const [ rotationInterval, setRotationInterval ] = useState(1)
  const [ rotationHour, setRotationHour ] = useState(0)
  // Rotation info (read-only)
  const [ nextRotationAt, setNextRotationAt ] = useState<string | null>(null)
  const [ lastRotatedAt, setLastRotatedAt ] = useState<string | null>(null)
  // Packs
  const [ rotationOrderMode, setRotationOrderMode ] = useState<RotationOrderMode>("auto")
  const [ activeCount, setActiveCount ] = useState(1)
  const [ rotationGroups, setRotationGroups ] = useState<string[][]>([ [] ])
  const [ poolPacks, setPoolPacks ] = useState<PackPoolPackItem[]>([])
  const poolPacksRef = useRef<PackPoolPackItem[]>([])
  const [ allPacks, setAllPacks ] = useState<PackPayload[]>([])
  const [ selectedPackIds, setSelectedPackIds ] = useState<Set<string>>(new Set())
  const [ packsLoading, setPacksLoading ] = useState(true)
  const [ packSearch, setPackSearch ] = useState("")
  const packSearchTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const fetchPacks = useCallback(async (search: string) => {
    setPacksLoading(true)

    const { response, status } = await packFindAll({ page: 1, limit: 10, search: search || undefined, unassigned: true })

    if (status >= 400) {
      toast.error("Failed to load packs")
    }

    // Merge: pool's own packs (filtered by search) + unassigned packs
    const unassigned = response?.payload ?? []
    const current = poolPacksRef.current
    const searchLower = search.toLowerCase()
    const matchingPoolPacks = search
      ? current.filter((p) => p.name.toLowerCase().includes(searchLower) || p.code.toLowerCase().includes(searchLower))
      : current
    const poolIds = new Set(matchingPoolPacks.map((p) => p.id))

    setAllPacks([
      ...(matchingPoolPacks as PackPayload[]),
      ...unassigned.filter((p) => !poolIds.has(p.id)),
    ])
    setPacksLoading(false)
  }, [])

  function handlePackSearch(value: string) {
    setPackSearch(value)

    if (packSearchTimer.current) clearTimeout(packSearchTimer.current)

    packSearchTimer.current = setTimeout(() => {
      void fetchPacks(value)
    }, 300)
  }

  const loadPool = useCallback(async () => {
    if (initialized.current) return

    initialized.current = true

    const [ poolResult, packsResult ] = await Promise.all([
      packPoolFindOneById(poolId),
      packFindAll({ page: 1, limit: 10, unassigned: true }),
    ])

    if (poolResult.status >= 400 || !poolResult.response?.payload) {
      toast.error("Pool not found")
      router.replace(Admin.Pools.List)

      return
    }

    const p = poolResult.response.payload

    setName(p.name)
    setDescription(p.description ?? "")
    setImage(p.image ?? "")
    setSortOrder(p.sort_order)
    setBannerType(p.banner_type)
    setIsActive(p.is_active)
    setOpenAt(p.open_at ? new Date(p.open_at) : undefined)
    setCloseAt(p.close_at ? new Date(p.close_at) : undefined)
    setRotationType(p.rotation_type)
    setRotationDay(p.rotation_day ?? undefined)
    setRotationInterval(p.rotation_interval)
    setRotationOrderMode(p.rotation_order_mode)
    setPreviewDays(p.preview_days)
    setNextRotationAt(p.next_rotation_at)
    setLastRotatedAt(p.last_rotated_at)

    setRotationHour(p.rotation_hour)

    // Packs
    setActiveCount(p.active_count || 1)

    if (p.packs) {
      setPoolPacks(p.packs)
      poolPacksRef.current = p.packs
      setSelectedPackIds(new Set(p.packs.map((pack) => pack.id)))

      // Build rotation groups for manual mode
      if (p.rotation_order_mode === "manual" && p.active_count > 0) {
        const groups: string[][] = []

        for (let i = 0; i < p.packs.length; i += p.active_count) {
          groups.push(p.packs.slice(i, i + p.active_count).map((pk) => pk.id))
        }

        if (groups.length === 0) groups.push([])

        setRotationGroups(groups)
      }
    }

    // Merge: pool's own packs + unassigned packs (deduped)
    const unassignedPacks = packsResult.response?.payload ?? []
    const poolPackIds = new Set((p.packs ?? []).map((pk) => pk.id))

    setAllPacks([
      ...((p.packs ?? []) as PackPayload[]),
      ...unassignedPacks.filter((pk) => !poolPackIds.has(pk.id)),
    ])
    setPacksLoading(false)
    setLoading(false)
  }, [ poolId, router ])

  useEffect(() => {
    void loadPool()
  }, [ loadPool ])

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Pool name is required")

      return
    }

    setSaving(true)

    const packIds = rotationOrderMode === "manual"
      ? rotationGroups.flat()
      : Array.from(selectedPackIds)
    const { status } = await packPoolUpdateOneById(poolId, {
      name:                name.trim(),
      description:         description.trim() || undefined,
      image:               image || undefined,
      banner_type:         bannerType,
      sort_order:          sortOrder,
      is_active:           isActive,
      open_at:             openAt?.toISOString(),
      close_at:            closeAt?.toISOString(),
      active_count:        activeCount,
      rotation_type:       rotationType,
      rotation_day:        rotationType !== "none" ? rotationDay : undefined,
      rotation_interval:   rotationType === "weekly" ? rotationInterval : 1,
      rotation_hour:       rotationType !== "none" ? rotationHour : undefined,
      timezone_offset:     rotationType !== "none" ? -(new Date().getTimezoneOffset() / 60) : undefined,
      rotation_order_mode: rotationOrderMode,
      preview_days:        previewDays || undefined,
    })

    if (status >= 400) {
      setSaving(false)
      toast.error("Failed to update pool")

      return
    }

    // Assign packs (also unassigns packs no longer in the list)
    await packPoolAssignPacks(poolId, { ids: packIds })

    // Sort rotation order for manual mode
    if (rotationOrderMode === "manual" && packIds.length > 0) {
      await packPoolSortRotation(poolId, { ids: packIds })
    }

    setSaving(false)
    toast.success("Pool updated")
    router.push(Admin.Pools.List)
  }

  function togglePack(packId: string) {
    setSelectedPackIds((prev) => {
      const next = new Set(prev)

      if (next.has(packId)) next.delete(packId)
      else next.add(packId)

      return next
    })
  }

  if (loading) {
    return (
      <div className={"flex min-h-screen flex-col items-center justify-center"}>
        <Loader2 className={"h-8 w-8 animate-spin text-zinc-500"} />
        <p className={"mt-4 text-sm text-zinc-400"}>Loading pool...</p>
      </div>
    )
  }

  return (
    <div className={"p-8"}>
      <AdminPageHeader
        actions={(
          <div className={"flex items-center gap-2"}>
            <GameButton
              disabled={saving || !name.trim()}
              variant={"amber"}
              onClick={() => void handleSave()}
            >
              {saving
                ? (
                  <>
                    <Loader2 className={"h-4 w-4 animate-spin"} />
                    {" "}
                    Saving...
                  </>
                )
                : (
                  <>
                    <Save className={"h-4 w-4"} />
                    {" "}
                    Save Changes
                  </>
                )}
            </GameButton>

            <GameButton asChild variant={"ghost"}>
              <Link href={Admin.Pools.List}>
                <ArrowLeft className={"h-4 w-4"} />
                {" "}
                Back
              </Link>
            </GameButton>
          </div>
        )}
        description={"Edit pack pool configuration."}
        title={"Edit Pool"}
      />

      {/* ── General ── */}
      <div className={"mt-6"}>
        <h3 className={"mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400"}>General</h3>

        <div className={sectionCard}>
          <div className={"flex items-center justify-end"}>
            <div className={"flex items-center gap-2"}>
              <Switch
                checked={isActive}
                className={"data-[state=checked]:bg-emerald-500"}
                onCheckedChange={setIsActive}
              />

              <Label className={"text-xs text-zinc-400"}>Active</Label>
            </div>
          </div>

          <div className={"mt-3 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]"}>
            <div className={"space-y-4"}>
              <div>
                <Label className={labelClass}>Name</Label>

                <Input
                  className={underlineInput}
                  placeholder={"Pool name..."}
                  type={"text"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label className={labelClass}>Description</Label>

                <Textarea
                  className={"min-h-0 resize-none rounded-none border-x-0 border-t-0 border-b border-zinc-700/60 bg-transparent px-0 pb-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-amber-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"}
                  placeholder={"Optional description..."}
                  rows={1}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Image</Label>

                <ImagePicker
                  customImages={customImages}
                  defaultImage={""}
                  pictures={[]}
                  selected={image}
                  onCustomImageAdd={(url) => setCustomImages((prev) => [ ...prev, url ])}
                  onSelect={setImage}
                />
              </div>
            </div>

            <div className={"space-y-4"}>
              <div>
                <Label className={labelClass}>Sort Order</Label>

                <Input
                  className={cn(underlineInput, "w-20")}
                  min={0}
                  type={"number"}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>

              <div>
                <Label className={labelClass}>Preview Days</Label>

                <Input
                  className={cn(underlineInput, "w-20")}
                  min={0}
                  type={"number"}
                  value={previewDays}
                  onChange={(e) => setPreviewDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />

                <p className={"mt-1 text-[10px] text-zinc-600"}>
                  Days before open to show preview.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Banner ── */}
      <div className={"mt-8"}>
        <h3 className={"mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400"}>Banner</h3>

        <div className={sectionCard}>
          <Label className={labelClass}>Banner Type</Label>

          <GameButtonGroup
            options={BANNER_OPTIONS}
            value={bannerType}
            onChange={setBannerType}
          />
        </div>
      </div>

      {/* ── Schedule ── */}
      <div className={"mt-8"}>
        <h3 className={"mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400"}>Schedule</h3>

        <div className={cn(sectionCard, "grid grid-cols-2 gap-4")}>
          <div>
            <Label className={labelClass}>Open At</Label>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 text-left text-sm transition-colors hover:border-zinc-600",
                    openAt ? "text-zinc-200" : "text-zinc-600",
                  )}
                  type={"button"}
                >
                  <CalendarIcon className={"h-3.5 w-3.5 shrink-0 text-zinc-500"} />
                  {openAt ? format(openAt, "MMM d, yyyy") : "Not set"}
                </button>
              </PopoverTrigger>

              <PopoverContent align={"start"} className={"w-auto border-zinc-700 bg-zinc-900 p-0"}>
                <Calendar
                  className={"rounded-lg border w-60"}
                  mode={"single"}
                  selected={openAt}
                  onSelect={setOpenAt}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className={labelClass}>Close At</Label>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 text-left text-sm transition-colors hover:border-zinc-600",
                    closeAt ? "text-zinc-200" : "text-zinc-600",
                  )}
                  type={"button"}
                >
                  <CalendarIcon className={"h-3.5 w-3.5 shrink-0 text-zinc-500"} />
                  {closeAt ? format(closeAt, "MMM d, yyyy") : "Not set"}
                </button>
              </PopoverTrigger>

              <PopoverContent align={"start"} className={"w-auto border-zinc-700 bg-zinc-900 p-0"}>
                <Calendar
                  className={"rounded-lg border w-60"}
                  mode={"single"}
                  selected={closeAt}
                  onSelect={setCloseAt}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* ── Rotation ── */}
      <div className={"mt-8"}>
        <h3 className={"mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400"}>Rotation</h3>

        <div className={sectionCard}>
          <Label className={labelClass}>Rotation Type</Label>

          <GameButtonGroup
            options={ROTATION_OPTIONS}
            value={rotationType}
            onChange={(v) => {
              setRotationType(v)

              if (v === "none") setRotationOrderMode("auto")
            }}
          />

          {rotationType !== "none" && (
            <div className={"mt-5 space-y-5"}>
              {/* Interval */}
              {rotationType === "weekly" && (
                <div>
                  <Label className={labelClass}>Interval (weeks)</Label>

                  <Input
                    className={cn(underlineInput, "w-20")}
                    min={1}
                    type={"number"}
                    value={rotationInterval}
                    onChange={(e) => setRotationInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  />
                </div>
              )}

              {/* Day picker */}
              {rotationType === "weekly" && (
                <div>
                  <Label className={labelClass}>Day of Week</Label>

                  <GameButtonGroup
                    options={DAY_OF_WEEK_OPTIONS}
                    value={rotationDay != null ? String(rotationDay) : ""}
                    onChange={(v) => setRotationDay(parseInt(v, 10))}
                  />
                </div>
              )}

              {rotationType === "monthly" && (
                <div>
                  <Label className={labelClass}>Day of Month</Label>

                  <div className={"mt-2 grid grid-cols-7 gap-1.5"}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <GameButton
                        className={cn("!px-0 !py-1.5 !text-xs", rotationDay === day && "!bg-violet-500/15 !text-violet-400 !border-violet-500/30")}
                        key={day}
                        pressed={rotationDay === day}
                        variant={"ghost"}
                        onClick={() => setRotationDay(day)}
                      >
                        {day}
                      </GameButton>
                    ))}
                  </div>

                  <p className={"mt-1.5 text-[10px] text-zinc-600"}>
                    If the month has fewer days, it clamps to the last day (e.g. 31 in Feb → 28/29).
                  </p>
                </div>
              )}

              {/* Hour grid */}
              <div>
                <Label className={labelClass}>Rotation Hour</Label>

                <div className={"mt-2 grid grid-cols-6 gap-1.5"}>
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <GameButton
                      className={cn("!px-0 !py-1.5 !text-xs", rotationHour === hour && "!bg-amber-500/15 !text-amber-400 !border-amber-500/30")}
                      key={hour}
                      pressed={rotationHour === hour}
                      variant={"ghost"}
                      onClick={() => setRotationHour(hour)}
                    >
                      {String(hour).padStart(2, "0")}:00
                    </GameButton>
                  ))}
                </div>
              </div>

              {/* Rotation info — read-only */}
              <div className={"flex items-center gap-6 rounded-lg bg-zinc-800/30 px-4 py-2.5"}>
                <Clock className={"h-4 w-4 shrink-0 text-zinc-600"} />

                <div>
                  <span className={"text-[10px] uppercase tracking-wider text-zinc-600"}>Next Rotation</span>

                  <p className={"text-xs text-zinc-300"}>
                    {nextRotationAt ? format(new Date(nextRotationAt), "MMM d, yyyy HH:mm") : "Not scheduled"}
                  </p>
                </div>

                <div>
                  <span className={"text-[10px] uppercase tracking-wider text-zinc-600"}>Last Rotated</span>

                  <p className={"text-xs text-zinc-300"}>
                    {lastRotatedAt ? format(new Date(lastRotatedAt), "MMM d, yyyy HH:mm") : "Never"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Packs ── */}
      <div className={"mt-8"}>
        <h3 className={"mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400"}>
          Packs
          {rotationOrderMode === "auto" && selectedPackIds.size > 0 && (
            <span className={"ml-2 text-zinc-600"}>({selectedPackIds.size} selected)</span>
          )}

          {rotationOrderMode === "manual" && rotationGroups.flat().length > 0 && (
            <span className={"ml-2 text-zinc-600"}>
              ({rotationGroups.flat().length} assigned)
            </span>
          )}
        </h3>

        <div className={sectionCard}>
          {/* Order Mode + Active Count */}
          <div className={"mb-5 flex items-start justify-between gap-4"}>
            {rotationType !== "none" && (
              <div>
                <Label className={labelClass}>Order Mode</Label>

                <GameButtonGroup
                  options={ORDER_MODE_OPTIONS}
                  value={rotationOrderMode}
                  onChange={setRotationOrderMode}
                />
              </div>
            )}

            <div className={"ml-auto text-right"}>
              <Label className={labelClass}>Active Count</Label>

              <Input
                className={cn(underlineInput, "ml-auto w-20 text-right")}
                min={1}
                type={"number"}
                value={activeCount}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value, 10) || 1)

                  setActiveCount(val)

                  if (rotationOrderMode === "manual") {
                    const flat = rotationGroups.flat()
                    const newGroups: string[][] = []

                    for (let i = 0; i < flat.length; i += val) {
                      newGroups.push(flat.slice(i, i + val))
                    }

                    if (newGroups.length === 0) newGroups.push([])

                    setRotationGroups(newGroups)
                  }
                }}
              />

              <p className={"mt-1 text-[10px] text-zinc-600"}>Packs per rotation cycle.</p>
            </div>
          </div>

          {/* Auto mode: current selection grid */}
          {rotationOrderMode === "auto" && (
            <>
              <div className={"relative mb-3"}>
                <Search className={"absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600"} />

                <Input
                  className={cn(underlineInput, "pl-8")}
                  placeholder={"Search packs..."}
                  type={"text"}
                  value={packSearch}
                  onChange={(e) => handlePackSearch(e.target.value)}
                />
              </div>

              {packsLoading
                ? (
                  <div className={"flex items-center gap-2 py-4 text-sm text-zinc-500"}>
                    <Loader2 className={"h-4 w-4 animate-spin"} />
                    Loading packs...
                  </div>
                )
                : allPacks.length === 0
                  ? (
                    <div className={"flex flex-col items-center gap-2 py-8"}>
                      <Package className={"h-6 w-6 text-zinc-700"} />
                      <p className={"text-sm text-zinc-600"}>No packs found.</p>
                    </div>
                  )
                  : (
                    <div className={"grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}>
                      {allPacks.map((pack) => {
                        const isSelected = selectedPackIds.has(pack.id)

                        return (
                          <div className={"relative"} key={pack.id}>
                            <div className={cn("transition-opacity", isSelected && "opacity-40")}>
                              <PackCard
                                pack={pack}
                                tiltEnabled={false}
                                onClick={() => togglePack(pack.id)}
                              />
                            </div>

                            {isSelected && (
                              <div className={"absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-lg"}>
                                <Check className={"h-3 w-3 text-white"} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
            </>
          )}

          {/* Manual mode: rotation group editor */}
          {rotationOrderMode === "manual" && (
            <RotationGroupEditor
              activeCount={activeCount}
              allPacks={allPacks}
              groups={rotationGroups}
              packSearch={packSearch}
              packsLoading={packsLoading}
              poolPacks={poolPacks}
              onGroupsChange={setRotationGroups}
              onPackSearch={(v) => handlePackSearch(v)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
