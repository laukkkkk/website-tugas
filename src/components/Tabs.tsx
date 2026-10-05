export interface TabItem<T extends string = string> {
  id: T
  label: string
  count?: number
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  activeTab: T
  onChange: (tabId: T) => void
  className?: string
}

/**
 * Komponen Tabs bersama untuk filter tugas, kerjaan, dll.
 * Tab aktif selalu memakai gaya cyan yang seragam di seluruh halaman.
 */
export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabsProps<T>) {
  return (
    <div
      className={`flex items-center p-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)] ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              isActive
                ? 'bg-[var(--bg-card)] text-cyan-700 dark:text-cyan-300 font-bold shadow-2xs'
                : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
            }`}
          >
            {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
          </button>
        )
      })}
    </div>
  )
}
