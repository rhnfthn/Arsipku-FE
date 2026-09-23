export type ThemeBackgroundTarget = 'landing' | 'dashboard'

export interface ThemeConfig {
  landingBackgroundUrl: string | null
  dashboardBackgroundUrl: string | null
  updatedAt: string | null
}

export interface ThemeTemplate {
  id: string
  target: ThemeBackgroundTarget
  name: string
  storageKey: string
  url: string
  isSystem: boolean
  createdAt: string
}

export interface ThemeAdminConfig extends ThemeConfig {
  templates: ThemeTemplate[]
  activeTemplateIds: Record<ThemeBackgroundTarget, string | null>
}

interface ThemeResponse {
  success?: boolean
  data?: ThemeConfig
  landingBackgroundUrl?: string | null
  dashboardBackgroundUrl?: string | null
  updatedAt?: string | null
  templates?: ThemeTemplate[]
  activeTemplateIds?: Record<ThemeBackgroundTarget, string | null>
}

const defaultTheme: ThemeConfig = {
  landingBackgroundUrl: null,
  dashboardBackgroundUrl: null,
  updatedAt: null
}

export const useTheme = () => {
  const { apiGet, apiPut, apiPost, apiDelete } = useApi()
  const themeConfig = useState<ThemeConfig>('app-theme-config', () => ({ ...defaultTheme }))
  const themeAdminConfig = useState<ThemeAdminConfig | null>('app-theme-admin-config', () => null)
  const isThemeLoading = useState<boolean>('app-theme-loading', () => false)

  const applyResponse = (response: ThemeResponse): ThemeConfig => {
    const data = (response.data ?? response) as ThemeResponse
    themeConfig.value = {
      landingBackgroundUrl: data.landingBackgroundUrl ?? null,
      dashboardBackgroundUrl: data.dashboardBackgroundUrl ?? null,
      updatedAt: data.updatedAt ?? null
    }
    if (data.templates && data.activeTemplateIds) {
      themeAdminConfig.value = {
        ...themeConfig.value,
        templates: data.templates,
        activeTemplateIds: data.activeTemplateIds
      }
    }
    return themeConfig.value
  }

  const fetchAdminThemeConfig = async (): Promise<ThemeAdminConfig> => {
    const response = await apiGet<ThemeResponse>('/admin/config/theme', {}, { skipCache: true })
    applyResponse(response)
    return themeAdminConfig.value!
  }

  const fetchThemeConfig = async (): Promise<ThemeConfig> => {
    isThemeLoading.value = true
    try {
      const response = await apiGet<ThemeResponse>('/config/theme', {}, { skipCache: true })
      return applyResponse(response)
    } finally {
      isThemeLoading.value = false
    }
  }

  const uploadThemeBackground = async (
    target: ThemeBackgroundTarget,
    file: File
  ): Promise<ThemeConfig> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiPut<ThemeResponse>(
      `/admin/config/theme/background/${target}`,
      formData
    )
    applyResponse(response)
    await fetchAdminThemeConfig()
    return themeConfig.value
  }

  const resetThemeBackground = async (target: ThemeBackgroundTarget): Promise<ThemeConfig> => {
    const response = await apiDelete<ThemeResponse>(
      `/admin/config/theme/background/${target}`
    )
    applyResponse(response)
    themeAdminConfig.value = (response.data ?? response) as ThemeAdminConfig
    return themeConfig.value
  }

  const activateThemeTemplate = async (templateId: string): Promise<ThemeAdminConfig> => {
    const response = await apiPost<ThemeResponse>(`/admin/config/theme/templates/${templateId}/activate`)
    applyResponse(response)
    return themeAdminConfig.value!
  }

  return {
    themeConfig,
    themeAdminConfig,
    isThemeLoading,
    fetchThemeConfig,
    fetchAdminThemeConfig,
    uploadThemeBackground,
    resetThemeBackground,
    activateThemeTemplate
  }
}
