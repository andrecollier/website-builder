'use client';

import React, { useState, useMemo } from 'react';
import { ComponentCard, ComponentData } from './ComponentCard';
import { AccuracyBadge } from '@/components/Comparison';

type FilterMode = 'all' | 'failing' | 'warning' | 'passing';
type SortMode = 'accuracy-asc' | 'accuracy-desc' | 'name-asc' | 'name-desc';

interface ComparisonReport {
  websiteId: string;
  timestamp: string;
  overallAccuracy: number;
  sections: ComponentData[];
  summary: {
    totalSections: number;
    sectionsAbove90: number;
    sectionsAbove80: number;
    sectionsBelow80: number;
  };
}

interface ComponentComparisonPanelProps {
  report: ComparisonReport;
  getImageUrl: (filePath: string) => string;
}

export function ComponentComparisonPanel({
  report,
  getImageUrl,
}: ComponentComparisonPanelProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('accuracy-asc');
  const [expandAll, setExpandAll] = useState(false);

  const filterOptions: { id: FilterMode; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: 'bg-gray-100 text-gray-700' },
    { id: 'failing', label: `Failing (<80%)`, color: 'bg-red-100 text-red-700' },
    { id: 'warning', label: `Warning (80-90%)`, color: 'bg-yellow-100 text-yellow-700' },
    { id: 'passing', label: `Passing (>90%)`, color: 'bg-green-100 text-green-700' },
  ];

  const sortOptions: { id: SortMode; label: string }[] = [
    { id: 'accuracy-asc', label: 'Accuracy (Low to High)' },
    { id: 'accuracy-desc', label: 'Accuracy (High to Low)' },
    { id: 'name-asc', label: 'Name (A-Z)' },
    { id: 'name-desc', label: 'Name (Z-A)' },
  ];

  // Filter and sort components
  const filteredAndSortedComponents = useMemo(() => {
    let filtered = [...report.sections];

    // Apply filter
    switch (filterMode) {
      case 'failing':
        filtered = filtered.filter((c) => c.accuracy < 80);
        break;
      case 'warning':
        filtered = filtered.filter((c) => c.accuracy >= 80 && c.accuracy < 90);
        break;
      case 'passing':
        filtered = filtered.filter((c) => c.accuracy >= 90);
        break;
    }

    // Apply sort
    switch (sortMode) {
      case 'accuracy-asc':
        filtered.sort((a, b) => a.accuracy - b.accuracy);
        break;
      case 'accuracy-desc':
        filtered.sort((a, b) => b.accuracy - a.accuracy);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.sectionName.localeCompare(b.sectionName));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.sectionName.localeCompare(a.sectionName));
        break;
    }

    return filtered;
  }, [report.sections, filterMode, sortMode]);

  // Calculate stats for current filter
  const stats = useMemo(() => {
    const total = filteredAndSortedComponents.length;
    const avgAccuracy = total > 0
      ? filteredAndSortedComponents.reduce((sum, c) => sum + c.accuracy, 0) / total
      : 0;
    return { total, avgAccuracy };
  }, [filteredAndSortedComponents]);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Component Comparison
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Visual comparison of {report.sections.length} components
            </p>
          </div>
          <AccuracyBadge accuracy={report.overallAccuracy} size="lg" />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Total Components</div>
            <div className="text-2xl font-bold text-gray-900">
              {report.sections.length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="text-sm text-green-700 mb-1">Passing (&ge;90%)</div>
            <div className="text-2xl font-bold text-green-600">
              {report.summary.sectionsAbove90}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="text-sm text-yellow-700 mb-1">Warning (80-90%)</div>
            <div className="text-2xl font-bold text-yellow-600">
              {report.summary.sectionsAbove80}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <div className="text-sm text-red-700 mb-1">Failing (&lt;80%)</div>
            <div className="text-2xl font-bold text-red-600">
              {report.summary.sectionsBelow80}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{report.overallAccuracy.toFixed(1)}% match</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {report.summary.sectionsAbove90 > 0 && (
              <div
                className="bg-green-500 h-full"
                style={{
                  width: `${(report.summary.sectionsAbove90 / report.sections.length) * 100}%`,
                }}
              />
            )}
            {report.summary.sectionsAbove80 > 0 && (
              <div
                className="bg-yellow-500 h-full"
                style={{
                  width: `${(report.summary.sectionsAbove80 / report.sections.length) * 100}%`,
                }}
              />
            )}
            {report.summary.sectionsBelow80 > 0 && (
              <div
                className="bg-red-500 h-full"
                style={{
                  width: `${(report.summary.sectionsBelow80 / report.sections.length) * 100}%`,
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Passing
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Warning
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Failing
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Filter:</span>
            <div className="flex gap-1">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFilterMode(option.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    filterMode === option.id
                      ? option.color + ' ring-2 ring-offset-1 ring-gray-400'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                  {option.id === 'failing' && report.summary.sectionsBelow80 > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-200 rounded-full">
                      {report.summary.sectionsBelow80}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort and Actions */}
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-gray-600">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Expand/Collapse All */}
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              {expandAll ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Collapse All
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Expand All
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active filter info */}
        {filterMode !== 'all' && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing <span className="font-medium">{stats.total}</span> components
              {stats.total > 0 && (
                <> with average accuracy of <span className="font-medium">{stats.avgAccuracy.toFixed(1)}%</span></>
              )}
            </span>
            <button
              onClick={() => setFilterMode('all')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Component List */}
      <div className="space-y-3">
        {filteredAndSortedComponents.length > 0 ? (
          filteredAndSortedComponents.map((component, index) => (
            <ComponentCard
              key={component.sectionName}
              component={component}
              referenceImage={getImageUrl(component.referenceImagePath)}
              generatedImage={getImageUrl(component.generatedImagePath)}
              diffImage={getImageUrl(component.diffImagePath)}
              defaultExpanded={expandAll || (index === 0 && filterMode === 'failing')}
              rank={sortMode.startsWith('accuracy') ? index + 1 : undefined}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No components match the current filter</p>
            <p className="text-gray-500 text-sm mt-1">
              {filterMode === 'failing' && 'Great job! All components are above 80% accuracy.'}
              {filterMode === 'warning' && 'No components are in the warning range (80-90%).'}
              {filterMode === 'passing' && 'No components have reached 90% accuracy yet.'}
            </p>
            <button
              onClick={() => setFilterMode('all')}
              className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Show All Components
            </button>
          </div>
        )}
      </div>

      {/* Quick Jump Navigation (for many components) */}
      {filteredAndSortedComponents.length > 5 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Jump</h3>
          <div className="flex flex-wrap gap-2">
            {filteredAndSortedComponents.map((component) => (
              <a
                key={component.sectionName}
                href={`#component-${component.sectionName}`}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  component.accuracy >= 90
                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                    : component.accuracy >= 80
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                }`}
              >
                {component.sectionName.replace(/^\d+-/, '')} ({component.accuracy.toFixed(0)}%)
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComponentComparisonPanel;
