export type Permission = 'player' | 'admin'

export interface MenuEntry {
  labelKey: string
  href: string
  permission: Permission
}

export interface PanelModule {
  name: string
  connections: string[]
  menu: MenuEntry[]
  registerRoutes(): void
}

export interface ModuleResolution {
  active: PanelModule[]
  disabled: { name: string; reason: string }[]
}
