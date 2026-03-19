"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { type Voluum } from "@/lib/api/db/api.voluum"
import {
  COLUMN_CATEGORIES,
  COLUMN_PRESETS,
  type ColumnPreset,
  getColumnsByCategory,
  getDefaultVisibleColumns,
  TABLE_COLUMNS
} from "@/lib/config/voluumTableColumns"
import { Eye, EyeOff, RotateCcw, Search, Settings2 } from "lucide-react"
import { useMemo, useState } from "react"

interface ColumnSelectorProps {
  selectedColumns: (keyof Voluum)[]
  onColumnsChange: (columns: (keyof Voluum)[]) => void
  className?: string
  children?: React.ReactNode
}

export function ColumnSelector({ 
  selectedColumns, 
  onColumnsChange, 
  className,
  children
}: ColumnSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Filter columns based on search and category
  const filteredColumns = useMemo(() => {
    let columns = [...TABLE_COLUMNS] // Create stable copy

    if (selectedCategory) {
      columns = getColumnsByCategory(selectedCategory)
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      columns = columns.filter(col => 
        col.label.toLowerCase().includes(searchLower) ||
        col.description.toLowerCase().includes(searchLower) ||
        col.key.toLowerCase().includes(searchLower)
      )
    }

    return columns
  }, [searchTerm.trim(), selectedCategory]) // Stable dependencies

  const handleColumnToggle = (columnKey: keyof Voluum, checked: boolean) => {
    if (checked) {
      onColumnsChange([...selectedColumns, columnKey])
    } else {
      onColumnsChange(selectedColumns.filter(key => key !== columnKey))
    }
  }

  const handlePresetSelect = (preset: ColumnPreset) => {
    onColumnsChange(preset.columns)
    setIsOpen(false)
  }

  const handleCategoryToggle = (category: string) => {
    const categoryColumns = getColumnsByCategory(category)
    const categoryKeys = categoryColumns.map(col => col.key)
    const allSelected = categoryKeys.every(key => selectedColumns.includes(key))
    
    if (allSelected) {
      // Deselect all in category
      onColumnsChange(selectedColumns.filter(key => !categoryKeys.includes(key)))
    } else {
      // Select all in category
      const newColumns = [...new Set([...selectedColumns, ...categoryKeys])]
      onColumnsChange(newColumns)
    }
  }

  const handleReset = () => {
    onColumnsChange(getDefaultVisibleColumns())
  }

  const selectedCount = selectedColumns.length
  const totalCount = TABLE_COLUMNS.length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className={className}>
            <Settings2 className="h-4 w-4 mr-2" />
            Columns ({selectedCount})
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[500px] sm:w-[600px]" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh'
      }}>
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Customize Table Columns</SheetTitle>
          <SheetDescription>
            Choose which data points to display. Showing {selectedCount} of {totalCount} columns.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0 gap-4 mt-6">
          {/* Search & Controls */}
          <div className="flex-shrink-0 space-y-3 p-4 bg-muted/30 rounded-lg">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button size="sm" variant="outline" onClick={() => onColumnsChange(TABLE_COLUMNS.map(col => col.key))}>
                <Eye className="h-3 w-3 mr-1" />
                All
              </Button>
              <Button size="sm" variant="outline" onClick={() => onColumnsChange([])}>
                <EyeOff className="h-3 w-3 mr-1" />
                None
              </Button>
            </div>
            
            {/* Presets */}
            <div className="flex gap-2 flex-wrap">
              {COLUMN_PRESETS.map(preset => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePresetSelect(preset)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Columns List - WORKING VERSION */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '16px'
          }}>
            {filteredColumns.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No columns found matching your search.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {COLUMN_CATEGORIES
                  .filter(category => {
                    const categoryColumns = filteredColumns.filter(col => col.category === category.id)
                    return categoryColumns.length > 0
                  })
                  .map(category => {
                    const categoryColumns = filteredColumns.filter(col => col.category === category.id)
                    const selectedInCategory = categoryColumns.filter(col => 
                      selectedColumns.includes(col.key)
                    ).length

                    return (
                      <Card key={category.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{category.icon}</span>
                              <CardTitle className="text-sm">{category.name}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {selectedInCategory}/{categoryColumns.length}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCategoryToggle(category.id)}
                            >
                              {selectedInCategory === categoryColumns.length ? "Deselect All" : "Select All"}
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          {categoryColumns.map(column => (
                            <div key={column.key} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50">
                              <Checkbox
                                id={column.key}
                                checked={selectedColumns.includes(column.key)}
                                onCheckedChange={(checked) => {
                                  handleColumnToggle(column.key, Boolean(checked))
                                }}
                              />
                              <div className="grid gap-1.5 leading-none flex-1">
                                <Label 
                                  htmlFor={column.key}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {column.label}
                                  {column.defaultVisible && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Default
                                    </Badge>
                                  )}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {column.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ColumnSelector