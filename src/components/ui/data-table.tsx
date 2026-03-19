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
import { ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Globe } from "lucide-react"
import React, { useMemo, useState } from "react"

interface DataTableProps {
  data: Voluum[]
  selectedColumns: (keyof Voluum)[]
  isLoading?: boolean
  maxRows?: number
  sortable?: boolean
  className?: string
  pagination?: {
    enabled: boolean
    pageSize?: number
    showPageSizeSelector?: boolean
    showPageInfo?: boolean
  }
}

interface SortConfig {
  key: keyof Voluum | null
  direction: 'asc' | 'desc'
}

export function DataTable({ 
  data, 
  selectedColumns, 
  isLoading = false,
  maxRows = 50,
  sortable = true,
  className,
  pagination = { enabled: true, pageSize: 10, showPageSizeSelector: true, showPageInfo: true }
}: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(pagination.pageSize || 10)
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())

  // Get column definitions for selected columns
  const columns = useMemo(() => {
    return selectedColumns
      .map(key => getColumnDefinition(key))
      .filter((col): col is TableColumn => col !== undefined)
  }, [selectedColumns])

  // Group data by referrer domain and create hierarchical structure
  const groupedData = useMemo(() => {
    // Group campaigns by referrer domain
    const groups = data.reduce((acc, campaign) => {
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
            // String fields - will be calculated
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
  }, [data])

  // Pagination logic
  const totalDomains = groupedData.length
  const totalPages = Math.ceil(totalDomains / pageSize)
  
  // Reset to page 1 if current page is out of bounds
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])
  
  // Get domains for current page
  const displayDomains = useMemo(() => {
    if (!pagination.enabled) {
      return maxRows ? groupedData.slice(0, maxRows) : groupedData
    }
    
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return groupedData.slice(startIndex, endIndex)
  }, [groupedData, currentPage, pageSize, pagination.enabled, maxRows])

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains)
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain)
    } else {
      newExpanded.add(domain)
    }
    setExpandedDomains(newExpanded)
  }

  // Pagination control functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const pages: number[] = []
    
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i)
    }
    
    return pages
  }

  const renderCellContent = (column: TableColumn, value: any, campaign: Voluum) => {
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

  if (isLoading) {
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

  if (displayDomains.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No data available.</p>
        <p className="text-sm">Data will appear here when available from the API.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead> {/* Expand/Collapse column */}
            <TableHead className="font-semibold">Campaign / Domain</TableHead>
            {columns.filter(col => col.key !== 'campaign_name_postfix' && col.key !== 'referrer_domain').map(column => (
              <TableHead 
                key={column.key}
                style={{ 
                  width: column.width, 
                  minWidth: column.minWidth 
                }}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {displayDomains.map((domainGroup) => {
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
                      {renderCellContent(column, domainGroup.totals[column.key], domainGroup.totals as any)}
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
                        {renderCellContent(column, campaign[column.key], campaign)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
      
      {/* Pagination Controls */}
      {pagination.enabled && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-4 p-4">
          {/* Page Info */}
          {pagination.showPageInfo && (
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalDomains)}-{Math.min(currentPage * pageSize, totalDomains)} of {totalDomains} domains
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* Page Size Selector */}
            {pagination.showPageSizeSelector && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-input bg-background px-3 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground">domains</span>
              </div>
            )}
            
            {/* Pagination Navigation */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              {/* Previous Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page Numbers */}
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="h-8 w-8 p-0"
                >
                  {pageNum}
                </Button>
              ))}
              
              {/* Next Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {/* Last Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fallback for non-paginated mode */}
      {!pagination.enabled && maxRows && groupedData.length > maxRows && (
        <div className="text-sm text-muted-foreground text-center mt-4">
          Showing {displayDomains.length} of {groupedData.length} total domains
        </div>
      )}
    </div>
  )
}

// Hook for managing column state with localStorage persistence
export function useColumnSelection(storageKey: string, defaultColumns: (keyof Voluum)[]) {
  const [selectedColumns, setSelectedColumns] = useState<(keyof Voluum)[]>(() => {
    if (typeof window === 'undefined') return defaultColumns
    
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : defaultColumns
    } catch {
      return defaultColumns
    }
  })

  const updateColumns = (columns: (keyof Voluum)[]) => {
    setSelectedColumns(columns)
    try {
      localStorage.setItem(storageKey, JSON.stringify(columns))
    } catch {
      // Ignore localStorage errors
    }
  }

  return [selectedColumns, updateColumns] as const
}

