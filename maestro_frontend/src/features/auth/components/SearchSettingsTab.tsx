import React from 'react'
import { useSettingsStore } from './SettingsStore'
// import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Globe, Settings, ChevronDown } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'

// SearXNG category options
const SEARXNG_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'images', label: 'Images' },
  { value: 'videos', label: 'Videos' },
  { value: 'news', label: 'News' },
  { value: 'map', label: 'Map' },
  { value: 'music', label: 'Music' },
  { value: 'it', label: 'IT' },
  { value: 'science', label: 'Science' },
  { value: 'files', label: 'Files' },
  { value: 'social media', label: 'Social Media' }
]

// Source preference options
const SOURCE_PREFERENCES = [
  { value: 'academic', label: 'Academic Papers', description: 'Academic papers, research studies, and scholarly articles' },
  { value: 'general', label: 'General Web', description: 'General web content without specific source filtering' },
  { value: 'news', label: 'News Articles', description: 'News articles and journalistic content' },
  { value: 'technical', label: 'Technical Docs', description: 'Technical documentation, guides, and specifications' },
  { value: 'medical', label: 'Medical Research', description: 'Medical research, clinical studies, and health information' },
  { value: 'legal', label: 'Legal Documents', description: 'Legal documents, court cases, and legal analysis' },
  { value: 'social_media', label: 'Social Media', description: 'Social media posts, discussions, and community content' },
  { value: 'reddit', label: 'Reddit', description: 'Reddit discussions, threads, and community insights' },
  { value: 'mixed', label: 'Mixed Sources', description: 'No automatic enhancement, let queries stand as-is' }
]

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: 'any_time', label: 'Any Time' },
  { value: 'last_week', label: 'Past Week' },
  { value: 'last_month', label: 'Past Month' },
  { value: 'last_3_months', label: 'Past 3 Months' },
  { value: 'last_6_months', label: 'Past 6 Months' },
  { value: 'last_year', label: 'Past Year' },
  { value: 'last_2_years', label: 'Past 2 Years' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' }
]

export const SearchSettingsTab: React.FC = () => {
  const { draftSettings, setDraftSettings } = useSettingsStore()

  const handleProviderChange = (provider: 'tavily' | 'linkup' | 'searxng' | 'jina') => {
    if (!draftSettings) return
    
    const newSearch = {
      ...draftSettings.search,
      provider
    }
    
    setDraftSettings({ search: newSearch })
  }

  const handleApiKeyChange = (field: string, value: string) => {
    if (!draftSettings) return
    
    const newSearch = {
      ...draftSettings.search,
      [field]: value
    }
    
    setDraftSettings({ search: newSearch })
  }

  const handleCategoriesChange = (categoryValue: string, checked: boolean) => {
    if (!draftSettings) return
    
    const currentCategories = draftSettings.search.searxng_categories || 'general'
    const categoriesArray = currentCategories.split(',').map(c => c.trim()).filter(c => c)
    
    let newCategoriesArray
    if (checked) {
      newCategoriesArray = [...categoriesArray.filter(c => c !== categoryValue), categoryValue]
    } else {
      newCategoriesArray = categoriesArray.filter(c => c !== categoryValue)
    }
    
    // Ensure at least one category is selected
    if (newCategoriesArray.length === 0) {
      newCategoriesArray = ['general']
    }
    
    const newSearch = {
      ...draftSettings.search,
      searxng_categories: newCategoriesArray.join(',')
    }
    
    setDraftSettings({ search: newSearch })
  }

  const getSelectedCategories = (): string[] => {
    if (!draftSettings?.search?.searxng_categories) return ['general']
    return draftSettings.search.searxng_categories.split(',').map(c => c.trim()).filter(c => c)
  }

  const getSelectedCategoriesDisplay = (): string => {
    const selected = getSelectedCategories()
    if (selected.length === 0) return 'Select categories'
    if (selected.length === 1) return SEARXNG_CATEGORIES.find(c => c.value === selected[0])?.label || selected[0]
    return `${selected.length} categories selected`
  }

  const getSelectedSourcePreferences = (): string[] => {
    const preferences = draftSettings?.search?.source_preferences
    if (!preferences || preferences === '') return ['academic']
    return preferences.split(',').map(p => p.trim()).filter(p => p)
  }

  const getSelectedSourcePreferencesDisplay = (): string => {
    const selected = getSelectedSourcePreferences()
    if (selected.length === 0) return 'Select source types'
    if (selected.length === 1) return SOURCE_PREFERENCES.find(p => p.value === selected[0])?.label || selected[0]
    return `${selected.length} source types selected`
  }

  const handleSourcePreferenceChange = (preferenceValue: string, checked: boolean) => {
    if (!draftSettings?.search) return
    
    const currentPreferences = getSelectedSourcePreferences()
    
    let newPreferencesArray
    if (checked) {
      // Add preference if not already included
      if (!currentPreferences.includes(preferenceValue)) {
        newPreferencesArray = [...currentPreferences, preferenceValue]
      } else {
        newPreferencesArray = currentPreferences
      }
    } else {
      // Remove preference
      newPreferencesArray = currentPreferences.filter(p => p !== preferenceValue)
    }
    
    // Ensure at least one preference is selected
    if (newPreferencesArray.length === 0) {
      newPreferencesArray = ['general']
    }
    
    const newSearch = {
      ...draftSettings.search,
      source_preferences: newPreferencesArray.join(',')
    }
    
    setDraftSettings({ search: newSearch })
  }

  if (!draftSettings) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Search Provider Configuration
          </CardTitle>
          <CardDescription className="text-sm">
            Configure your search provider for web research capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Search Provider</Label>
              <Select
                value={draftSettings.search.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select search provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tavily">Tavily</SelectItem>
                  <SelectItem value="linkup">LinkUp</SelectItem>
                  <SelectItem value="searxng">SearXNG</SelectItem>
                  <SelectItem value="jina">Jina.ai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {draftSettings.search.provider === 'tavily' && (
              <div className="space-y-3 pl-3 border-l-2 border-blue-200 bg-blue-50/30 rounded-r-lg p-3">
                <p className="text-xs text-muted-foreground-foreground mb-2">
                  AI-powered search with real-time web data and citations.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="tavily-api-key" className="text-sm">Tavily API Key</Label>
                  <Input
                    id="tavily-api-key"
                    type="password"
                    value={draftSettings.search.tavily_api_key || ''}
                    onChange={(e) => handleApiKeyChange('tavily_api_key', e.target.value)}
                    placeholder="tvly-..."
                    className="h-8 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a 
                    href="https://app.tavily.com/home" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Tavily Dashboard
                  </a>
                </p>
              </div>
            )}

            {draftSettings.search.provider === 'linkup' && (
              <div className="space-y-3 pl-3 border-l-2 border-green-200 bg-green-50/30 rounded-r-lg p-3">
                <p className="text-xs text-muted-foreground-foreground mb-2">
                  Real-time search API with comprehensive web coverage.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="linkup-api-key" className="text-sm">LinkUp API Key</Label>
                  <Input
                    id="linkup-api-key"
                    type="password"
                    value={draftSettings.search.linkup_api_key || ''}
                    onChange={(e) => handleApiKeyChange('linkup_api_key', e.target.value)}
                    placeholder="7a8d9e1b-..."
                    className="h-8 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a 
                    href="https://linkup.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    LinkUp Dashboard
                  </a>
                </p>
              </div>
            )}

            {draftSettings.search.provider === 'searxng' && (
              <div className="space-y-3 pl-3 border-l-2 border-purple-200 bg-purple-50/30 rounded-r-lg p-3">
                <p className="text-xs text-muted-foreground-foreground mb-2">
                  Open-source metasearch engine that aggregates results from multiple search engines.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="searxng-base-url" className="text-sm">SearXNG Base URL</Label>
                  <Input
                    id="searxng-base-url"
                    type="url"
                    value={draftSettings.search.searxng_base_url || ''}
                    onChange={(e) => handleApiKeyChange('searxng_base_url', e.target.value)}
                    placeholder="https://your-searxng-instance.com"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Search Categories</Label>
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 w-full justify-between text-sm"
                        >
                          {getSelectedCategoriesDisplay()}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full p-0" align="start">
                        <div className="p-3">
                          <p className="text-xs text-muted-foreground-foreground mb-3">
                            Select one or more categories for search results:
                          </p>
                          <div className="space-y-2">
                            {SEARXNG_CATEGORIES.map((category) => {
                              const isSelected = getSelectedCategories().includes(category.value)
                              return (
                                <DropdownMenuItem
                                  key={category.value}
                                  className="flex items-center space-x-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleCategoriesChange(category.value, !isSelected)
                                  }}
                                >
                                  <Checkbox
                                    id={`category-${category.value}`}
                                    checked={isSelected}
                                    onCheckedChange={() => {}} // Prevent direct checkbox interaction since clicking the item handles it
                                  />
                                  <Label
                                    htmlFor={`category-${category.value}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {category.label}
                                  </Label>
                                </DropdownMenuItem>
                              )
                            })}
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your SearXNG instance. You can use a public instance or{' '}
                  <a 
                    href="https://docs.searxng.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    deploy your own
                  </a>
                  <br />
                  <strong>Note:</strong> Your SearXNG instance must be configured to output JSON format.
                </p>
              </div>
            )}

            {draftSettings.search.provider === 'jina' && (
              <div className="space-y-3 pl-3 border-l-2 border-orange-200 bg-orange-50/30 rounded-r-lg p-3">
                <p className="text-xs text-muted-foreground-foreground mb-2">
                  AI-powered search with grounding capabilities and rich snippets for enhanced research.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="jina-api-key" className="text-sm">Jina.ai API Key</Label>
                  <Input
                    id="jina-api-key"
                    type="password"
                    value={draftSettings.search.jina_api_key || ''}
                    onChange={(e) => handleApiKeyChange('jina_api_key', e.target.value)}
                    placeholder="jina_..."
                    className="h-8 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a 
                    href="https://jina.ai/api-dashboard/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    Jina.ai Dashboard
                  </a>
                  {' '}· Free tier includes 1M tokens
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Source Preferences Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Source Preferences
          </CardTitle>
          <CardDescription className="text-sm">
            Configure what types of sources to prioritize in search results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Preferred Source Types</Label>
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-between text-sm"
                  >
                    {getSelectedSourcePreferencesDisplay()}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full p-0" align="start">
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-3">
                      Select one or more source types to prioritize:
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {SOURCE_PREFERENCES.map((preference) => {
                        const isSelected = getSelectedSourcePreferences().includes(preference.value)
                        return (
                          <DropdownMenuItem
                            key={preference.value}
                            className="flex flex-col items-start space-y-1 cursor-pointer p-3 min-h-[60px]"
                            onClick={(e) => {
                              e.preventDefault()
                              handleSourcePreferenceChange(preference.value, !isSelected)
                            }}
                          >
                            <div className="flex items-center space-x-2 w-full">
                              <Checkbox
                                id={`source-${preference.value}`}
                                checked={isSelected}
                                onCheckedChange={() => {}} // Prevent direct checkbox interaction
                              />
                              <Label
                                htmlFor={`source-${preference.value}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {preference.label}
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">
                              {preference.description}
                            </p>
                          </DropdownMenuItem>
                        )
                      })}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="date-range" className="text-sm font-medium">Time Range</Label>
            <Select
              value={draftSettings.search.search_date_range || 'any_time'}
              onValueChange={(value) => handleApiKeyChange('search_date_range', value === 'any_time' ? '' : value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Limit search results to content from a specific time period.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Provider-specific search configuration */}
      {(draftSettings.search.provider === 'tavily' || draftSettings.search.provider === 'linkup' || draftSettings.search.provider === 'jina') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Search Configuration
            </CardTitle>
            <CardDescription className="text-sm">
              Configure search behavior and parameters for {
                draftSettings.search.provider === 'tavily' ? 'Tavily' : 
                draftSettings.search.provider === 'linkup' ? 'LinkUp' :
                draftSettings.search.provider === 'jina' ? 'Jina.ai' : 'your search provider'
              }.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="max-search-results" className="text-sm">Maximum Search Results</Label>
                <Input
                  id="max-search-results"
                  type="number"
                  min="1"
                  max="20"
                  value={draftSettings.search.max_results || 5}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 5))
                    handleApiKeyChange('max_results', value.toString())
                  }}
                  className="h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Number of search results to return per query (1-20). Higher values may increase API costs.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="search-depth" className="text-sm">Search Depth</Label>
                <Select
                  value={draftSettings.search.search_depth || 'standard'}
                  onValueChange={(value) => handleApiKeyChange('search_depth', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select search depth" />
                  </SelectTrigger>
                  <SelectContent>
                    {draftSettings.search.provider === 'tavily' ? (
                      <>
                        <SelectItem value="standard">Standard (Basic - 1 credit)</SelectItem>
                        <SelectItem value="advanced">Advanced (2 credits)</SelectItem>
                      </>
                    ) : draftSettings.search.provider === 'jina' ? (
                      <>
                        <SelectItem value="standard">Standard (Fast)</SelectItem>
                        <SelectItem value="advanced">Enhanced (With grounding)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="standard">Standard (Fast)</SelectItem>
                        <SelectItem value="advanced">Deep (Comprehensive)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {draftSettings.search.provider === 'tavily' 
                    ? 'Advanced search provides more comprehensive results but costs 2x API credits.'
                    : draftSettings.search.provider === 'jina'
                    ? 'Enhanced search includes grounding data and rich snippets for better research quality.'
                    : 'Deep search uses an agentic workflow for more comprehensive results but takes longer.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SearXNG-specific configuration */}
      {draftSettings.search.provider === 'searxng' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              SearXNG Configuration
            </CardTitle>
            <CardDescription className="text-sm">
              Configure search parameters for your SearXNG instance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="max-search-results" className="text-sm">Maximum Search Results</Label>
              <Input
                id="max-search-results"
                type="number"
                min="1"
                max="20"
                value={draftSettings.search.max_results || 5}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 5))
                  handleApiKeyChange('max_results', value.toString())
                }}
                className="h-8 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Number of search results to return per query (1-20).
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              SearXNG aggregates results from multiple search engines. No API costs involved.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
