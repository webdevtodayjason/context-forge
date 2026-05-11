import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Hint } from '../components/Hint.js';
import type { ProjectConfig, Feature } from '../../../types/index.js';
import type { FeaturePriority } from '../types.js';

export interface FeaturesProps {
  projectType: ProjectConfig['projectType'];
  initial?: Feature[];
  onSubmit: (features: Feature[]) => void;
  onBack: () => void;
}

interface CatalogEntry {
  id: string;
  name: string;
  description: string;
  category: Feature['category'];
  complexity: Feature['complexity'];
  defaultSelected?: boolean;
  defaultPriority?: FeaturePriority;
  appliesTo?: ProjectConfig['projectType'][];
}

const CATALOG: CatalogEntry[] = [
  {
    id: 'auth',
    name: 'User Authentication & Authorization',
    description: 'Login, registration, password reset, sessions',
    category: 'auth',
    complexity: 'medium',
    defaultSelected: true,
    defaultPriority: 'must-have',
  },
  {
    id: 'dashboard',
    name: 'User Dashboard',
    description: 'Personalized landing area with widgets',
    category: 'ui',
    complexity: 'medium',
  },
  {
    id: 'crud',
    name: 'CRUD Operations',
    description: 'Create / read / update / delete on core entities',
    category: 'data',
    complexity: 'simple',
    defaultSelected: true,
    defaultPriority: 'must-have',
  },
  {
    id: 'file-upload',
    name: 'File Upload / Management',
    description: 'Upload, validate, preview, download files',
    category: 'data',
    complexity: 'medium',
  },
  {
    id: 'realtime',
    name: 'Real-time Updates (WebSocket)',
    description: 'Live data sync, push notifications',
    category: 'integration',
    complexity: 'complex',
  },
  {
    id: 'email',
    name: 'Email Notifications',
    description: 'Transactional + notification emails',
    category: 'integration',
    complexity: 'simple',
  },
  {
    id: 'search',
    name: 'Search Functionality',
    description: 'Full-text search across entities',
    category: 'data',
    complexity: 'medium',
  },
  {
    id: 'rest-api',
    name: 'RESTful API Endpoints',
    description: 'Well-structured REST API',
    category: 'infrastructure',
    complexity: 'medium',
    appliesTo: ['api', 'fullstack'],
    defaultSelected: true,
    defaultPriority: 'must-have',
  },
  {
    id: 'api-docs',
    name: 'API Documentation (Swagger/OpenAPI)',
    description: 'Interactive API documentation',
    category: 'infrastructure',
    complexity: 'simple',
    appliesTo: ['api', 'fullstack'],
    defaultSelected: true,
  },
  {
    id: 'admin',
    name: 'Admin Panel',
    description: 'Administrative interface for management',
    category: 'ui',
    complexity: 'complex',
  },
  {
    id: 'payment',
    name: 'Payment Processing',
    description: 'Accept and process payments',
    category: 'integration',
    complexity: 'complex',
  },
  {
    id: 'rbac',
    name: 'Role-Based Access Control',
    description: 'Granular permissions per role',
    category: 'auth',
    complexity: 'medium',
  },
  {
    id: 'i18n',
    name: 'Multi-language Support',
    description: 'i18n / l10n',
    category: 'ui',
    complexity: 'medium',
  },
];

const PRIORITY_CYCLE: Record<FeaturePriority, FeaturePriority> = {
  'must-have': 'should-have',
  'should-have': 'nice-to-have',
  'nice-to-have': 'must-have',
};

const PRIORITY_COLOR: Record<FeaturePriority, string> = {
  'must-have': 'red',
  'should-have': 'yellow',
  'nice-to-have': 'gray',
};

const PRIORITY_LABEL: Record<FeaturePriority, string> = {
  'must-have': '🔴 must',
  'should-have': '🟡 should',
  'nice-to-have': '⚪ nice',
};

interface RowState {
  entry: CatalogEntry;
  selected: boolean;
  priority: FeaturePriority;
}

export const Features: React.FC<FeaturesProps> = ({
  projectType,
  initial,
  onSubmit,
  onBack,
}) => {
  const visibleCatalog = CATALOG.filter(
    (c) => !c.appliesTo || c.appliesTo.includes(projectType)
  );

  const initialMap = new Map<string, Feature>();
  (initial ?? []).forEach((f) => initialMap.set(f.id, f));

  const [rows, setRows] = useState<RowState[]>(() =>
    visibleCatalog.map((entry) => {
      const existing = initialMap.get(entry.id);
      return {
        entry,
        selected: existing !== undefined || entry.defaultSelected === true,
        priority:
          (existing?.priority as FeaturePriority) ??
          entry.defaultPriority ??
          'should-have',
      };
    })
  );

  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (key.return) {
      const chosen = rows.filter((r) => r.selected);
      if (chosen.length === 0) {
        setError('Pick at least one feature (space to toggle, p to cycle priority).');
        return;
      }
      setError(null);
      onSubmit(
        chosen.map((r) => ({
          id: r.entry.id,
          name: r.entry.name,
          description: r.entry.description,
          priority: r.priority,
          complexity: r.entry.complexity,
          category: r.entry.category,
        }))
      );
      return;
    }
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
      return;
    }
    if (key.downArrow) {
      setCursor((c) => Math.min(rows.length - 1, c + 1));
      return;
    }
    if (input === ' ') {
      setRows((prev) =>
        prev.map((r, idx) => (idx === cursor ? { ...r, selected: !r.selected } : r))
      );
      return;
    }
    if (input === 'p' || input === 'P') {
      setRows((prev) =>
        prev.map((r, idx) =>
          idx === cursor ? { ...r, priority: PRIORITY_CYCLE[r.priority], selected: true } : r
        )
      );
      return;
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Step 5 — Features
      </Text>
      <Text color="gray" dimColor>
        space = toggle · p = cycle priority · ↑↓ = move · enter = continue
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {rows.map((row, idx) => {
          const isCursor = idx === cursor;
          const cb = row.selected ? '☑' : '☐';
          const priorityTag = row.selected ? PRIORITY_LABEL[row.priority] : '         ';
          const priorityColor = row.selected ? PRIORITY_COLOR[row.priority] : 'gray';
          return (
            <Box key={row.entry.id}>
              <Text color={isCursor ? 'cyan' : undefined}>
                {isCursor ? '▶ ' : '  '}
                {cb} {row.entry.name}
              </Text>
              <Box marginLeft={1}>
                <Text color={priorityColor}>{priorityTag}</Text>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">
          {rows.filter((r) => r.selected).length} of {rows.length} selected
        </Text>
      </Box>
      {error ? (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : null}
      <Hint showNav={false} text="space toggle · p priority · enter continue · esc back" />
    </Box>
  );
};
