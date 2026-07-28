import React, { useState } from 'react';
import { MiniTab, Student, CriteriaGroup, Criterion } from '../types';
import { getOrderedCriteria } from '../utils/chartHelpers';
import { Plus, Trash2, Eye, EyeOff, Settings, UserPlus, Sliders, CheckSquare, Square, ChevronDown, ChevronUp, Layers, Users } from 'lucide-react';

interface StudentsDataEditorProps {
  miniTab: MiniTab;
  onUpdateMiniTab: (updated: MiniTab) => void;
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string | null) => void;
}

export const StudentsDataEditor: React.FC<StudentsDataEditorProps> = ({
  miniTab,
  onUpdateMiniTab,
  selectedStudentId,
  onSelectStudent,
}) => {
  const [activeSection, setActiveSection] = useState<'students' | 'groups' | 'circles' | 'style'>('students');
  const [newStudentName, setNewStudentName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newCriterionName, setNewCriterionName] = useState('');
  const [selectedGroupIdForCriterion, setSelectedGroupIdForCriterion] = useState<string>(
    miniTab.groups[0]?.id || ''
  );

  // 1. STUDENT MANAGEMENT
  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newStudent: Student = {
      id: `s_${Date.now()}`,
      name: newStudentName.trim(),
    };

    // Initialize performances for new student
    const defaultPerf: Record<string, number> = {};
    miniTab.criteria.forEach((c) => {
      defaultPerf[c.id] = Math.ceil(miniTab.circles.count / 2);
    });

    const updated: MiniTab = {
      ...miniTab,
      students: [...miniTab.students, newStudent],
      performances: {
        ...miniTab.performances,
        [newStudent.id]: defaultPerf,
      },
    };

    onUpdateMiniTab(updated);
    setNewStudentName('');
    onSelectStudent(newStudent.id);
  };

  const handleRemoveStudent = (studentId: string) => {
    const updatedStudents = miniTab.students.filter((s) => s.id !== studentId);
    const updatedPerf = { ...miniTab.performances };
    delete updatedPerf[studentId];

    onUpdateMiniTab({
      ...miniTab,
      students: updatedStudents,
      performances: updatedPerf,
    });

    if (selectedStudentId === studentId) {
      onSelectStudent(updatedStudents[0]?.id || null);
    }
  };

  const handleUpdateStudentName = (studentId: string, name: string) => {
    onUpdateMiniTab({
      ...miniTab,
      students: miniTab.students.map((s) => (s.id === studentId ? { ...s, name } : s)),
    });
  };

  // 2. PERFORMANCE SCORE CHANGE
  const handleScoreChange = (studentId: string, criterionId: string, score: number) => {
    const studentPerf = miniTab.performances[studentId] || {};
    const updatedPerf = {
      ...miniTab.performances,
      [studentId]: {
        ...studentPerf,
        [criterionId]: Math.min(miniTab.circles.count, Math.max(0, score)),
      },
    };

    onUpdateMiniTab({
      ...miniTab,
      performances: updatedPerf,
    });
  };

  // 3. GROUP FOR CRITERIA MANAGEMENT
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const colors = ['#3b82f6', '#06b6d4', '#2563eb', '#6366f1', '#ec4899', '#10b981', '#f59e0b'];
    const newGroup: CriteriaGroup = {
      id: `g_${Date.now()}`,
      name: newGroupName.trim(),
      showName: true,
      fontSize: 13,
      rotation: 0,
      color: colors[miniTab.groups.length % colors.length],
      showShape: true,
    };

    onUpdateMiniTab({
      ...miniTab,
      groups: [...miniTab.groups, newGroup],
    });

    if (!selectedGroupIdForCriterion) {
      setSelectedGroupIdForCriterion(newGroup.id);
    }
    setNewGroupName('');
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<CriteriaGroup>) => {
    onUpdateMiniTab({
      ...miniTab,
      groups: miniTab.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    const updatedGroups = miniTab.groups.filter((g) => g.id !== groupId);
    const updatedCriteria = miniTab.criteria.filter((c) => c.groupId !== groupId);

    onUpdateMiniTab({
      ...miniTab,
      groups: updatedGroups,
      criteria: updatedCriteria,
    });
  };

  // 4. CRITERIA MANAGEMENT
  const handleAddCriterion = () => {
    if (!newCriterionName.trim() || !selectedGroupIdForCriterion) return;
    const newCriterion: Criterion = {
      id: `c_${Date.now()}`,
      groupId: selectedGroupIdForCriterion,
      name: newCriterionName.trim(),
    };

    // Add default scores for all students
    const updatedPerf = { ...miniTab.performances };
    miniTab.students.forEach((s) => {
      if (!updatedPerf[s.id]) updatedPerf[s.id] = {};
      updatedPerf[s.id][newCriterion.id] = Math.ceil(miniTab.circles.count / 2);
    });

    const newCriteriaList = getOrderedCriteria(
      [...miniTab.criteria, newCriterion],
      miniTab.groups
    );

    onUpdateMiniTab({
      ...miniTab,
      criteria: newCriteriaList,
      performances: updatedPerf,
    });

    setNewCriterionName('');
  };

  const handleRemoveCriterion = (criterionId: string) => {
    onUpdateMiniTab({
      ...miniTab,
      criteria: miniTab.criteria.filter((c) => c.id !== criterionId),
    });
  };

  const handleUpdateCriterionName = (criterionId: string, name: string) => {
    onUpdateMiniTab({
      ...miniTab,
      criteria: miniTab.criteria.map((c) => (c.id === criterionId ? { ...c, name } : c)),
    });
  };

  // 5. CIRCLE CONFIGURATION
  const handleCircleCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(20, count));
    const currentNames = [...miniTab.circles.circleNames];

    // Expand or shrink circle names array
    while (currentNames.length < newCount) {
      currentNames.push(`Level ${currentNames.length + 1}`);
    }
    const truncatedNames = currentNames.slice(0, newCount);

    onUpdateMiniTab({
      ...miniTab,
      circles: {
        ...miniTab.circles,
        count: newCount,
        circleNames: truncatedNames,
      },
    });
  };

  const handleCircleNameChange = (index: number, name: string) => {
    const updatedNames = [...miniTab.circles.circleNames];
    updatedNames[index] = name;
    onUpdateMiniTab({
      ...miniTab,
      circles: {
        ...miniTab.circles,
        circleNames: updatedNames,
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
      {/* HEADER TABS FOR EDIT SECTIONS */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSection('students')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSection === 'students'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Students ({miniTab.students.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('groups')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSection === 'groups'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Groups & Criteria</span>
        </button>

        <button
          onClick={() => setActiveSection('circles')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSection === 'circles'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Circles ({miniTab.circles.count})</span>
        </button>

        <button
          onClick={() => setActiveSection('style')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSection === 'style'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Axis & Fill Style</span>
        </button>
      </div>

      {/* SECTION CONTENT */}
      <div
        className={`p-4 flex-1 ${
          activeSection === 'students' ? 'flex flex-col min-h-0 overflow-hidden' : 'overflow-y-auto space-y-4'
        }`}
      >
        {/* SECTION 1: STUDENTS & PERFORMANCE SCORES */}
        {activeSection === 'students' && (() => {
          const isClassAvgMode = selectedStudentId === 'ALL_CLASS';
          
          // Calculate class average per criterion if in Whole Class mode
          const classAvgScores: Record<string, number> = {};
          if (isClassAvgMode && miniTab.students.length > 0) {
            miniTab.criteria.forEach((criterion) => {
              let sum = 0;
              let count = 0;
              miniTab.students.forEach((student) => {
                const val = miniTab.performances[student.id]?.[criterion.id];
                if (val !== undefined && val !== null) {
                  sum += val;
                  count++;
                }
              });
              classAvgScores[criterion.id] =
                count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
            });
          }

          const selectedStudentObj = miniTab.students.find((s) => s.id === selectedStudentId);

          return (
            <div className="flex flex-col h-full min-h-0 space-y-3">
              {/* ADD STUDENT INPUT */}
              <div className="flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Student name..."
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddStudent}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Student
                </button>
              </div>

              {/* STUDENT SELECTOR CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 shrink-0">
                {/* WHOLE CLASS CARD */}
                <div
                  onClick={() => onSelectStudent('ALL_CLASS')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isClassAvgMode
                      ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Whole Class Average</span>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                    Mean
                  </span>
                </div>

                {miniTab.students.map((student) => {
                  const isSelected = selectedStudentId === student.id;
                  return (
                    <div
                      key={student.id}
                      onClick={() => onSelectStudent(student.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="text"
                        value={student.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateStudentName(student.id, e.target.value)}
                        className="text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-1"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStudent(student.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* PERFORMANCE SCORES INPUT TABLE FOR SELECTED STUDENT OR WHOLE CLASS */}
              {selectedStudentId && (
                <div className="pt-2 border-t border-slate-200 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      Performance Scores for:{' '}
                      <span className="text-blue-600 font-extrabold">
                        {isClassAvgMode ? 'Whole Class Average' : selectedStudentObj?.name}
                      </span>
                      {isClassAvgMode && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                          (Read-only)
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Max circle score: {miniTab.circles.count}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {miniTab.groups.map((group) => {
                      const groupCriteria = miniTab.criteria.filter((c) => c.groupId === group.id);
                      if (groupCriteria.length === 0) return null;

                      return (
                        <div key={`score-group-${group.id}`} className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60">
                          <div
                            className="text-xs font-bold mb-2 flex items-center gap-1.5"
                            style={{ color: group.color || '#3b82f6' }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                            {group.name}
                          </div>

                          <div className="space-y-1.5">
                            {groupCriteria.map((criterion) => {
                              const currentScore = isClassAvgMode
                                ? classAvgScores[criterion.id] ?? 0
                                : miniTab.performances[selectedStudentId]?.[criterion.id] ?? 0;

                              return (
                                <div
                                  key={`perf-${criterion.id}`}
                                  className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200/80 text-xs"
                                >
                                  <span className="text-slate-700 font-medium truncate max-w-[200px]" title={criterion.name}>
                                    {criterion.name}
                                  </span>

                                  <div className="flex items-center gap-2">
                                    {isClassAvgMode ? (
                                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-100 text-xs">
                                        {currentScore}
                                      </span>
                                    ) : (
                                      <input
                                        type="number"
                                        min="0"
                                        max={miniTab.circles.count}
                                        step="0.5"
                                        value={currentScore}
                                        onChange={(e) =>
                                          handleScoreChange(
                                            selectedStudentId,
                                            criterion.id,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-14 px-2 py-0.5 text-center text-xs font-semibold rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                                      />
                                    )}
                                    <span className="text-slate-400 text-[10px]">/ {miniTab.circles.count}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* SECTION 2: GROUPS & CRITERIA MANAGEMENT */}
        {activeSection === 'groups' && (
          <div className="space-y-4">
            {/* ADD GROUP */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Add Group for Criteria</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Group name (e.g., RECEPTION)..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddGroup}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Add Group
                </button>
              </div>
            </div>

            {/* ADD CRITERION INPUT */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Add Criterion Line</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedGroupIdForCriterion}
                  onChange={(e) => setSelectedGroupIdForCriterion(e.target.value)}
                  className="px-2 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none"
                >
                  {miniTab.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Criterion line text..."
                  value={newCriterionName}
                  onChange={(e) => setNewCriterionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCriterion()}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                />

                <button
                  onClick={handleAddCriterion}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Add
                </button>
              </div>
            </div>

            {/* LIST GROUPS WITH CUSTOM RESIZE / ROTATE / SHOW TOGGLE */}
            <div className="space-y-3">
              {miniTab.groups.map((group) => {
                const groupCriteria = miniTab.criteria.filter((c) => c.groupId === group.id);

                return (
                  <div key={group.id} className="border border-slate-200 rounded-xl p-3 bg-white space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="color"
                          value={group.color || '#3b82f6'}
                          onChange={(e) => handleUpdateGroup(group.id, { color: e.target.value })}
                          className="w-6 h-6 rounded-md cursor-pointer border-0 p-0"
                          title="Group badge color"
                        />
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                          className="font-bold text-xs text-slate-800 bg-transparent border-b border-slate-200 focus:border-blue-500 focus:outline-none px-1"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateGroup(group.id, { showName: !group.showName })}
                          className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                            group.showName
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                          title="Enable/disable group name on chart"
                        >
                          {group.showName ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span className="text-[10px]">{group.showName ? 'Shown' : 'Hidden'}</span>
                        </button>

                        <button
                          onClick={() => handleUpdateGroup(group.id, { showShape: group.showShape === false ? true : false })}
                          className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                            group.showShape !== false
                              ? 'bg-purple-50 text-purple-600 font-semibold border border-purple-200/60'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                          title="Enable/disable background shape around group name"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{group.showShape !== false ? 'Shape On' : 'Shape Off'}</span>
                        </button>

                        <button
                          onClick={() => handleRemoveGroup(group.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* FONT SIZE & ROTATION SLIDERS */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-2 rounded-lg">
                      <div>
                        <label className="text-slate-500 block mb-1">
                          Font Size: <span className="font-bold text-slate-800">{group.fontSize}px</span>
                        </label>
                        <input
                          type="range"
                          min="8"
                          max="24"
                          value={group.fontSize}
                          onChange={(e) =>
                            handleUpdateGroup(group.id, { fontSize: parseInt(e.target.value) || 12 })
                          }
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-1">
                          Rotation: <span className="font-bold text-slate-800">{group.rotation}°</span>
                        </label>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="15"
                          value={group.rotation}
                          onChange={(e) =>
                            handleUpdateGroup(group.id, { rotation: parseInt(e.target.value) || 0 })
                          }
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>

                    {/* CRITERIA UNDER THIS GROUP */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Criteria ({groupCriteria.length}):
                      </span>
                      {groupCriteria.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 bg-slate-50/80 px-2.5 py-1 rounded-lg text-xs"
                        >
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => handleUpdateCriterionName(c.id, e.target.value)}
                            className="flex-1 text-slate-700 bg-transparent focus:outline-none focus:border-b focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleRemoveCriterion(c.id)}
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: CIRCLE CONFIGURATION */}
        {activeSection === 'circles' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Amount of Concentric Circles</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={miniTab.circles.count}
                  onChange={(e) => handleCircleCountChange(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <label className="text-xs font-semibold text-slate-700">Show Circles' Names on Chart</label>
                <button
                  onClick={() =>
                    onUpdateMiniTab({
                      ...miniTab,
                      circles: {
                        ...miniTab.circles,
                        showCircleNames: !miniTab.circles.showCircleNames,
                      },
                    })
                  }
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                    miniTab.circles.showCircleNames
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {miniTab.circles.showCircleNames ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{miniTab.circles.showCircleNames ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>

              {/* FONT SIZE FOR CIRCLE NAMES */}
              <div className="pt-2 border-t border-slate-200">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Circle Name Font Size:{' '}
                  <span className="text-blue-600">{miniTab.circles.circleNameFontSize}px</span>
                </label>
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={miniTab.circles.circleNameFontSize}
                  onChange={(e) =>
                    onUpdateMiniTab({
                      ...miniTab,
                      circles: {
                        ...miniTab.circles,
                        circleNameFontSize: parseInt(e.target.value) || 11,
                      },
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            {/* CIRCLE NAMES EDITING LIST */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Name Each Circle</span>
              <div className="grid grid-cols-2 gap-2">
                {miniTab.circles.circleNames.map((name, i) => (
                  <div key={`circle-name-${i}`} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 w-5">#{i + 1}</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleCircleNameChange(i, e.target.value)}
                      className="flex-1 text-xs font-semibold text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: AXIS & FILL STYLE */}
        {activeSection === 'style' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
              {/* FILLED VS PURE LINE TICKBOX */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Axis Line Representation</span>
                  <span className="text-[11px] text-slate-500 block">
                    Tick for filled polygon, untick for pure outline line
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={miniTab.chartSettings.isFilled}
                    onChange={(e) =>
                      onUpdateMiniTab({
                        ...miniTab,
                        chartSettings: {
                          ...miniTab.chartSettings,
                          isFilled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    {miniTab.chartSettings.isFilled ? 'Filled Area' : 'Pure Line'}
                  </span>
                </label>
              </div>

              {/* COLOR PICKER & OPACITY */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Chart Line Color</span>
                  <input
                    type="color"
                    value={miniTab.chartSettings.lineColor || '#2563eb'}
                    onChange={(e) =>
                      onUpdateMiniTab({
                        ...miniTab,
                        chartSettings: {
                          ...miniTab.chartSettings,
                          lineColor: e.target.value,
                        },
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                </div>

                {miniTab.chartSettings.isFilled && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Fill Opacity:{' '}
                      <span className="text-blue-600">
                        {Math.round((miniTab.chartSettings.fillOpacity || 0.6) * 100)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={miniTab.chartSettings.fillOpacity || 0.6}
                      onChange={(e) =>
                        onUpdateMiniTab({
                          ...miniTab,
                          chartSettings: {
                            ...miniTab.chartSettings,
                            fillOpacity: parseFloat(e.target.value) || 0.6,
                          },
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
