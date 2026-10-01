export type Permission = 'player' | 'admin'

export interface MenuEntry {
  labelKey: string
  href: string
  // Only filters what the menu shows; it does not protect the route.
  permission: Permission
}

// A module must protect its own routes (auth middleware or a permission
// middleware): menu permissions are not access control.
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
