"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type Voluum } from "@/lib/api/db/api.voluum"
import {
  formatColumnValue,
  getColumnDefinition,
  type TableColumn
} from "@/lib/config/voluumTableColumns"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Globe } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
// Create interface locally since hook doesn't exist
interface UsePaginatedVoluumDataReturn {
  data: Voluum[]
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  isFirstPage: boolean
  isLastPage: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  goToPage: (page: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  setPageSize: (size: number) => void
  refresh: () => void
  // API-based sorting support
  onSort?: (field: keyof Voluum, direction?: "asc" | "desc") => void
  currentSort?: {
    field: keyof Voluum
    order: "asc" | "desc"
  }
  sortLoading?: boolean
}

interface PaginatedDataTableProps {
  paginatedData: UsePaginatedVoluumDataReturn
  selectedColumns: (keyof Voluum)[]
  className?: string
  showDomainGrouping?: boolean
  showPaginationInfo?: boolean
  showPageSizeSelector?: boolean
}

interface SortConfig {
  key: keyof Voluum | null
  direction: 'asc' | 'desc'
}

export function PaginatedDataTable({ 
  paginatedData,
  selectedColumns, 
  className,
  showDomainGrouping = true,
  showPaginationInfo = true,
  showPageSizeSelector = true
}: PaginatedDataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())

  // Get column definitions for selected columns
  const columns = useMemo(() => {
    return selectedColumns
      .map(key => getColumnDefinition(key))
      .filter((col): col is TableColumn => col !== undefined)
  }, [selectedColumns])

  // Apply sorting to flat data (API-based or client-side fallback)
  const sortedFlatData = useMemo(() => {
    if (showDomainGrouping) {
      return paginatedData.data // No sorting needed for grouped view
    }

    // If API-based sorting is being used, data is already sorted by the server
    if (paginatedData.onSort && paginatedData.currentSort) {
      return paginatedData.data
    }

    // Client-side fallback sorting
    if (!sortConfig.key) {
      return paginatedData.data
    }

    const sorted = [...paginatedData.data]
    
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      // Compare based on data type
      let comparison = 0
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      } else {
        // Convert to string for comparison
        comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase())
      }
      
      // Apply sort direction
      return sortConfig.direction === 'desc' ? -comparison : comparison
    })
    
    return sorted
  }, [paginatedData.data, paginatedData.onSort, paginatedData.currentSort, sortConfig.key, sortConfig.direction, showDomainGrouping])

  // Group data by referrer domain if enabled
  const groupedData = useMemo(() => {
    if (!showDomainGrouping) {
      return null // Don't group, use flat structure
    }

    // Group campaigns by referrer domain
    const groups = paginatedData.data.reduce((acc, campaign) => {
      const domain = campaign.referrer_domain || 'Unknown Domain'
      if (!acc[domain]) {
        acc[domain] = {
          domain,
          campaigns: [],
          totals: {
            // Numeric totals
            visits: 0,
            unique_visits: 0,
            clicks: 0,
            unique_clicks: 0,
            conversions: 0,
            first_deposit: 0,
            second_deposit: 0,
            deposit: 0,
            withdraw: 0,
            register: 0,
            paid: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            roi: 0,
            cr: 0,
            ctr: 0,
            ltv: 0,
            suspicious_visits: 0,
            suspicious_visits_percentages: 0,
            // String fields
            campaign_country: '',
            traffic_source_name: '',
            campaign_name_postfix: '',
            // System fields
            referrer_domain: domain,
            id: `domain-${domain}`,
            synced_at: '',
            cost_model: ''
          },
          countryCount: {} as Record<string, number>,
          trafficSourceCount: {} as Record<string, number>
        }
      }
      
      // Add campaign with formatted name
      const formattedCampaign = {
        ...campaign,
        formatted_name: `${campaign.traffic_source_name || 'Unknown'} • ${campaign.campaign_country || 'Unknown'} • ${campaign.campaign_name_postfix || 'Unknown'}`
      }
      
      acc[domain].campaigns.push(formattedCampaign)
      
      // Count countries and traffic sources for this domain
      const country = campaign.campaign_country || 'Unknown'
      const trafficSource = campaign.traffic_source_name || 'Unknown'
      acc[domain].countryCount[country] = (acc[domain].countryCount[country] || 0) + 1
      acc[domain].trafficSourceCount[trafficSource] = (acc[domain].trafficSourceCount[trafficSource] || 0) + 1
      
      // Calculate numeric totals for the domain
      acc[domain].totals.visits += campaign.visits || 0
      acc[domain].totals.unique_visits += campaign.unique_visits || 0
      acc[domain].totals.clicks += campaign.clicks || 0
      acc[domain].totals.unique_clicks += campaign.unique_clicks || 0
      acc[domain].totals.conversions += campaign.conversions || 0
      acc[domain].totals.first_deposit += campaign.first_deposit || 0
      acc[domain].totals.second_deposit += campaign.second_deposit || 0
      acc[domain].totals.deposit += campaign.deposit || 0
      acc[domain].totals.withdraw += campaign.withdraw || 0
      acc[domain].totals.register += campaign.register || 0
      acc[domain].totals.paid += campaign.paid || 0
      acc[domain].totals.revenue += campaign.revenue || 0
      acc[domain].totals.cost += campaign.cost || 0
      acc[domain].totals.profit += campaign.profit || 0
      acc[domain].totals.suspicious_visits += campaign.suspicious_visits || 0
      
      return acc
    }, {} as Record<string, {domain: string, campaigns: (Voluum & {formatted_name: string})[], totals: any, countryCount: Record<string, number>, trafficSourceCount: Record<string, number>}>)

    // Post-process to calculate averages and most common values
    Object.values(groups).forEach(group => {
      const campaignCount = group.campaigns.length
      
      if (campaignCount > 0) {
        // Calculate averages for percentage fields
        group.totals.roi = group.campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaignCount
        group.totals.cr = group.campaigns.reduce((sum, c) => sum + (c.cr || 0), 0) / campaignCount
        group.totals.ctr = group.campaigns.reduce((sum, c) => sum + (c.ctr || 0), 0) / campaignCount
        group.totals.ltv = group.campaigns.reduce((sum, c) => sum + (c.ltv || 0), 0) / campaignCount
        group.totals.suspicious_visits_percentages = group.campaigns.reduce((sum, c) => sum + (c.suspicious_visits_percentages || 0), 0) / campaignCount
        
        // Find most common country and traffic source
        const mostCommonCountry = Object.entries(group.countryCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        const mostCommonTrafficSource = Object.entries(group.trafficSourceCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        
        group.totals.campaign_country = Object.keys(group.countryCount).length > 1 
          ? `${mostCommonCountry} (+${Object.keys(group.countryCount).length - 1} more)`
          : mostCommonCountry
          
        group.totals.traffic_source_name = Object.keys(group.trafficSourceCount).length > 1
          ? `${mostCommonTrafficSource} (+${Object.keys(group.trafficSourceCount).length - 1} more)`
          : mostCommonTrafficSource
          
        group.totals.campaign_name_postfix = `${campaignCount} campaigns`
        group.totals.synced_at = group.campaigns[0].synced_at // Use most recent
      }
    })

    // Convert to array and sort by total revenue (descending)
    return Object.values(groups).sort((a, b) => b.totals.revenue - a.totals.revenue)
  }, [paginatedData.data, showDomainGrouping])

  // Auto-expand all domains when domain grouping is enabled and data changes
  useEffect(() => {
    if (showDomainGrouping && groupedData && groupedData.length > 0) {
      const allDomains = new Set(groupedData.map(group => group.domain))
      setExpandedDomains(allDomains)
    }
  }, [showDomainGrouping, groupedData])

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains)
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain)
    } else {
      newExpanded.add(domain)
    }
    setExpandedDomains(newExpanded)
  }

  // Improved API-based sort handler
  const handleSort = (column: TableColumn) => {
    // Prevent sorting while loading or sort operation in progress
    if (paginatedData.loading || paginatedData.sortLoading) {
      return
    }

    // If API-based sorting is available, use it
    if (paginatedData.onSort) {
      // Let the parent handle the sort logic - it has better validation and state management
      void paginatedData.onSort(column.key as keyof Voluum)
      return
    }

    // Fallback to client-side sorting if API sorting not available
    const isCurrentColumn = sortConfig.key === column.key
    const newDirection = isCurrentColumn 
      ? (sortConfig.direction === 'asc' ? 'desc' : 'asc')
      : 'asc'
    
    setSortConfig({ key: column.key as keyof Voluum, direction: newDirection as 'asc' | 'desc' })
  }

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const pages: number[] = []
    const { currentPage, totalPages } = paginatedData
    
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i)
    }
    
    return pages
  }

  const renderCellContent = (column: TableColumn, value: any) => {
    // Special rendering for specific columns
    switch (column.key) {
      case 'campaign_country':
        return (
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {value || "Unknown"}
          </div>
        )
      
      case 'cr':
      case 'roi':
      case 'ctr':
        const numValue = Number(value)
        return (
          <Badge variant={
            numValue > 10 ? "default" : 
            numValue > 5 ? "secondary" : 
            numValue > 0 ? "outline" : 
            "destructive"
          }>
            {formatColumnValue(column.key, value)}
          </Badge>
        )
      
      case 'suspicious_visits':
      case 'suspicious_visits_percentages':
        if (Number(value) > 0) {
          return (
            <Badge variant="destructive">
              {formatColumnValue(column.key, value)}
            </Badge>
          )
        }
        return formatColumnValue(column.key, value)
      
      case 'first_deposit':
      case 'register':
      case 'conversions':
        if (Number(value) > 0) {
          return (
            <Badge variant="default">
              {formatColumnValue(column.key, value)}
            </Badge>
          )
        }
        return formatColumnValue(column.key, value)
      
      default:
        return formatColumnValue(column.key, value)
    }
  }

  // Show error state if there's an error
  if (paginatedData.error && !paginatedData.loading) {
    return (
      <div className="text-center p-8 text-destructive">
        <p className="font-semibold">Error loading data</p>
        <p className="text-sm">{paginatedData.error}</p>
        <button 
          onClick={paginatedData.refresh} 
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Show loading state
  if (paginatedData.loading && paginatedData.data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Loading table data..." />
      </div>
    )
  }

  if (columns.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No columns selected.</p>
        <p className="text-sm">Use the column selector to choose which data to display.</p>
      </div>
    )
  }

  if (paginatedData.data.length === 0 && !paginatedData.loading) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No data available.</p>
        <p className="text-sm">Data will appear here when available from the API.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Debug: Current sort state */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted/20 rounded">
          Sort State: {sortConfig.key ? `${String(sortConfig.key)} ${sortConfig.direction}` : 'none'} | 
          Loading: {paginatedData.loading ? 'yes' : 'no'} | 
          Data: {paginatedData.data.length} items
        </div>
      )}
      
      {/* Loading overlay for pagination */}
      {paginatedData.loading && paginatedData.data.length > 0 && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <LoadingSpinner text="Loading..." size="sm" />
        </div>
      )}
      
      <div className={`relative ${paginatedData.loading ? 'opacity-50' : ''}`}>
        <Table>
        <TableHeader>
          <TableRow>
            {showDomainGrouping && groupedData && <TableHead className="w-8"></TableHead>}
            <TableHead className="font-semibold">Campaign / Domain</TableHead>
            {columns.filter(col => col.key !== 'campaign_name_postfix' && col.key !== 'referrer_domain').map(column => (
              <TableHead 
                key={column.key}
                style={{ 
                  width: column.width, 
                  minWidth: column.minWidth 
                }}
                className={`cursor-pointer hover:bg-muted/50 select-none ${
                  (paginatedData.loading || paginatedData.sortLoading) ? 'opacity-50 cursor-wait' : ''
                }`}
                onClick={() => {
                  handleSort(column)
                }}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {/* Show loading spinner if sort is in progress for this column */}
                  {paginatedData.sortLoading && paginatedData.currentSort?.field === column.key ? (
                    <LoadingSpinner size="sm" className="h-3 w-3" />
                  ) : (
                    /* Show API sort state if available, fallback to local sort state */
                    (() => {
                      const currentField = paginatedData.currentSort?.field || sortConfig.key
                      const currentOrder = paginatedData.currentSort?.order || sortConfig.direction
                      const isCurrentColumn = currentField === column.key
                      
                      if (isCurrentColumn) {
                        return currentOrder === 'asc' ? 
                          <ArrowUp className="h-3 w-3 text-primary" /> : 
                          <ArrowDown className="h-3 w-3 text-primary" />
                      } else {
                        return <ArrowUpDown className="h-3 w-3 opacity-50" />
                      }
                    })()
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {showDomainGrouping && groupedData ? (
            // Domain-grouped rendering
            groupedData.map((domainGroup) => {
              const isExpanded = expandedDomains.has(domainGroup.domain)
              
              return (
                <React.Fragment key={domainGroup.domain}>
                  {/* Domain Header Row */}
                  <TableRow className="bg-muted/30 hover:bg-muted/50 font-medium cursor-pointer" onClick={() => toggleDomain(domainGroup.domain)}>
                    <TableCell className="w-8">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {isExpanded ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {domainGroup.domain}
                        <Badge variant="outline" className="text-xs">
                          {domainGroup.campaigns.length} campaigns
                        </Badge>
                      </div>
                    </TableCell>
                    {columns.filter(col => col.key !== 'campaign_name_postfix' && col.key !== 'referrer_domain').map(column => (
                      <TableCell key={column.key}>
                        {renderCellContent(column, domainGroup.totals[column.key])}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Campaign Rows (shown when expanded) */}
                  {isExpanded && domainGroup.campaigns.map((campaign, index) => (
                    <TableRow key={campaign.id || `${domainGroup.domain}-${index}`} className="bg-background border-l-4 border-l-muted-foreground/20">
                      <TableCell className="w-8"></TableCell>
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        {campaign.formatted_name}
                      </TableCell>
                      {columns.filter(col => col.key !== 'campaign_name_postfix' && col.key !== 'referrer_domain').map(column => (
                        <TableCell key={column.key} className="text-sm">
                          {renderCellContent(column, campaign[column.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </React.Fragment>
              )
            })
          ) : (
            // Flat rendering (no domain grouping) - with enhanced title/description format
            sortedFlatData.map((campaign, index) => (
              <TableRow key={campaign.id || index}>
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {campaign.referrer_domain || 'Unknown Domain'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {`${campaign.traffic_source_name || 'Unknown'} • ${campaign.campaign_country || 'Unknown'} • ${campaign.campaign_name_postfix || 'Unknown'}`}
                    </div>
                  </div>
                </TableCell>
                {columns.filter(col => col.key !== 'campaign_name_postfix' && col.key !== 'referrer_domain').map(column => (
                  <TableCell key={column.key}>
                    {renderCellContent(column, campaign[column.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
      
      {/* API-Level Pagination Controls */}
      {paginatedData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-4 p-4">
          {/* Page Info */}
          {showPaginationInfo && (
            <div className="text-sm text-muted-foreground">
              Showing {((paginatedData.currentPage - 1) * paginatedData.pageSize) + 1}-{Math.min(paginatedData.currentPage * paginatedData.pageSize, paginatedData.totalItems)} of {paginatedData.totalItems} items
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* Page Size Selector */}
            {showPageSizeSelector && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <select
                  value={paginatedData.pageSize}
                  onChange={(e) => paginatedData.setPageSize(Number(e.target.value))}
                  className="border border-input bg-background px-3 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={paginatedData.loading}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground">items</span>
              </div>
            )}
            
            {/* Pagination Navigation */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={paginatedData.goToFirstPage}
                disabled={paginatedData.isFirstPage || paginatedData.loading}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              {/* Previous Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={paginatedData.goToPreviousPage}
                disabled={!paginatedData.canGoPrevious || paginatedData.loading}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page Numbers */}
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === paginatedData.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => paginatedData.goToPage(pageNum)}
                  disabled={paginatedData.loading}
                  className="h-8 w-8 p-0"
                >
                  {pageNum}
                </Button>
              ))}
              
              {/* Next Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={paginatedData.goToNextPage}
                disabled={!paginatedData.canGoNext || paginatedData.loading}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {/* Last Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={paginatedData.goToLastPage}
                disabled={paginatedData.isLastPage || paginatedData.loading}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show pagination info even for single page */}
      {paginatedData.totalPages <= 1 && showPaginationInfo && (
        <div className="flex items-center justify-center mt-4 p-4">
          <div className="text-sm text-muted-foreground">
            Showing {paginatedData.data.length} of {paginatedData.totalItems} items
          </div>
        </div>
      )}
    </div>
  )
}