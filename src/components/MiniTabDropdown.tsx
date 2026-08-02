import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Check,
  FolderPlus,
} from 'lucide-react';
import { MiniTab } from '../types';

interface MiniTabDropdownProps {
  miniTabs: MiniTab[];
  activeMiniTabId: string | undefined;
  onSelectMiniTab: (id: string) => void;
  onAddMiniTab: () => void;
  onRemoveMiniTab: (id: string) => void;
  onStartRename: (id: string, name: string) => void;
  editingItemId: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
}

export const MiniTabDropdown: React.FC<MiniTabDropdownProps> = ({
  miniTabs,
  activeMiniTabId,
  onSelectMiniTab,
  onAddMiniTab,
  onRemoveMiniTab,
  onStartRename,
  editingItemId,
  renameValue,
  onRenameValueChange,
  onSaveRename,
  onCancelRename,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeMiniTab = miniTabs.find((m) => m.id === activeMiniTabId) || miniTabs[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (id: string) => {
    onSelectMiniTab(id);
    setIsOpen(false);
  };

  const handleAdd = () => {
    onAddMiniTab();
    setIsOpen(false);
  };

  const isEditingActive = editingItemId === activeMiniTab?.id;

  return (
    <div className="no-print bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* LABEL & DROPDOWN CONTROL */}
      <div className="flex items-center gap-2.5 flex-1 min-w-[280px] relative" ref={dropdownRef}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 shrink-0 select-none">
          <Layers className="w-4 h-4 text-purple-600" />
          <span className="hidden sm:inline">Mini Tabs</span>
        </div>

        {/* DROPDOWN SELECTOR TRIGGER BUTTON */}
        <div className="relative flex-1">
          <div
            onClick={() => {
              if (isEditingActive) return;
              setIsOpen(!isOpen);
            }}
            className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
              isOpen
                ? 'bg-purple-50 border-purple-400 text-purple-900 ring-2 ring-purple-100'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
            title={`Active: ${activeMiniTab?.name || 'Select Mini Tab'}`}
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-extrabold uppercase shrink-0">
                Active
              </span>

              {isEditingActive ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => onRenameValueChange(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') onSaveRename();
                    if (e.key === 'Escape') onCancelRename();
                  }}
                  onBlur={onSaveRename}
                  onFocus={(e) => e.target.select()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-0.5 text-slate-900 bg-white border border-purple-400 rounded-md text-xs font-bold w-full focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
                  autoFocus
                />
              ) : (
                <span
                  title={activeMiniTab?.name}
                  className="font-bold text-slate-800 text-xs truncate max-w-[300px] sm:max-w-[420px] hover:max-w-none transition-all duration-300"
                >
                  {activeMiniTab?.name || 'Select Mini Tab'}
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-1.5 shrink-0"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {activeMiniTab && !isEditingActive && (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onStartRename(activeMiniTab.id, activeMiniTab.name);
                    }}
                    className="p-1 hover:bg-purple-100 text-slate-500 hover:text-purple-700 rounded-lg transition-colors cursor-pointer"
                    title="Rename active mini tab"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {miniTabs.length > 1 && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveMiniTab(activeMiniTab.id);
                      }}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete active mini tab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isEditingActive) setIsOpen(!isOpen);
                }}
                className="p-0.5 text-slate-400 hover:text-purple-600 cursor-pointer"
                title={isOpen ? 'Close menu' : 'Open menu'}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-purple-600' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* DROPDOWN MENU LIST */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Select or Manage Mini Tab</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                  {miniTabs.length} {miniTabs.length === 1 ? 'Tab' : 'Tabs'}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                {miniTabs.map((miniTab) => {
                  const isActive = miniTab.id === activeMiniTabId;
                  const isEditingThis = editingItemId === miniTab.id;

                  return (
                    <div
                      key={miniTab.id}
                      onClick={() => {
                        if (isEditingThis) return;
                        handleSelect(miniTab.id);
                      }}
                      className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200/60'
                          : 'hover:bg-slate-100 text-slate-700'
                      } ${isEditingThis ? 'bg-purple-50/50 ring-2 ring-purple-200' : 'cursor-pointer'}`}
                      title={miniTab.name}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                          {isActive ? (
                            <Check className="w-4 h-4 text-purple-600 stroke-[3]" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-purple-400 transition-colors" />
                          )}
                        </div>

                        {isEditingThis ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => onRenameValueChange(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') onSaveRename();
                              if (e.key === 'Escape') onCancelRename();
                            }}
                            onBlur={onSaveRename}
                            onFocus={(e) => e.target.select()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-0.5 text-slate-900 bg-white border border-purple-400 rounded-md text-xs font-bold w-full focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
                            autoFocus
                          />
                        ) : (
                          <span
                            title={miniTab.name}
                            className={`truncate max-w-[260px] sm:max-w-[380px] hover:max-w-none transition-all duration-300 ${
                              isActive ? 'text-purple-950 font-bold' : 'text-slate-700'
                            }`}
                          >
                            {miniTab.name}
                          </span>
                        )}
                      </div>

                      {/* ITEM ACTIONS: RENAME & DELETE */}
                      {!isEditingThis && (
                        <div
                          className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onStartRename(miniTab.id, miniTab.name);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-100/60 rounded-md transition-colors cursor-pointer"
                            title="Rename tab"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {miniTabs.length > 1 && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemoveMiniTab(miniTab.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="Delete tab"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* FOOTER ACTION: ADD NEW TAB */}
              <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Mini Tab</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUICK ADD BUTTON NEXT TO DROPDOWN */}
      <button
        type="button"
        onClick={onAddMiniTab}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all text-xs font-bold shadow-xs shrink-0 cursor-pointer"
        title="Add a new mini tab"
      >
        <FolderPlus className="w-4 h-4" />
        <span>+ Add Mini Tab</span>
      </button>
    </div>
  );
};
