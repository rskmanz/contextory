import { ContextNode, ObjectType, ObjectItem, FieldValue } from '@/types';
import { generateId } from '@/lib/utils';

export interface FieldMapping {
  kanbanFieldId?: string;
  startDateFieldId?: string;
  endDateFieldId?: string;
  progressFieldId?: string;
}

/**
 * Auto-detect field mapping from an object's field definitions.
 * Picks the first select field for kanban, first two date fields for gantt, first number for progress.
 */
export function autoDetectFieldMapping(object: ObjectType): FieldMapping {
  const fields = object.fields || [];
  const mapping: FieldMapping = {};

  const firstSelect = fields.find((f) => f.type === 'select');
  if (firstSelect) mapping.kanbanFieldId = firstSelect.id;

  const dateFields = fields.filter((f) => f.type === 'date');
  if (dateFields.length >= 1) mapping.startDateFieldId = dateFields[0].id;
  if (dateFields.length >= 2) mapping.endDateFieldId = dateFields[1].id;

  const firstNumber = fields.find((f) => f.type === 'number');
  if (firstNumber) mapping.progressFieldId = firstNumber.id;

  return mapping;
}

/**
 * Import Object items as ContextNodes into a Context.
 *
 * - Existing imported nodes (matched by sourceItemId) are updated in place
 * - New items get new ContextNode entries
 * - Manual (non-imported) nodes are preserved untouched
 * - Kanban column nodes are created/reused for select field values
 */
export function importObjectItemsToContext(
  items: ObjectItem[],
  object: ObjectType,
  existingNodes: ContextNode[],
  fieldMapping?: FieldMapping
): ContextNode[] {
  const mapping = fieldMapping || autoDetectFieldMapping(object);
  const objectId = object.id;

  // Separate existing nodes: manual vs imported-from-this-object vs imported-from-other-objects
  const manualNodes = existingNodes.filter(
    (n) => !n.metadata?.sourceObjectId
  );
  const otherObjectNodes = existingNodes.filter(
    (n) => n.metadata?.sourceObjectId && n.metadata.sourceObjectId !== objectId
  );
  const existingImportedNodes = existingNodes.filter(
    (n) => n.metadata?.sourceObjectId === objectId
  );

  // Build a lookup of existing imported nodes by sourceItemId
  const importedByItemId = new Map<string, ContextNode>();
  for (const node of existingImportedNodes) {
    const itemId = node.metadata?.sourceItemId as string | undefined;
    if (itemId) importedByItemId.set(itemId, node);
  }

  // Build kanban column nodes if a kanban field is mapped
  const kanbanField = mapping.kanbanFieldId
    ? (object.fields || []).find((f) => f.id === mapping.kanbanFieldId)
    : null;

  // Find or create column nodes for kanban grouping
  const columnNodes: ContextNode[] = [];
  const columnIdByOptionId = new Map<string, string>();

  if (kanbanField && kanbanField.options) {
    // Check for existing column nodes (sourceObjectId = objectId, no sourceItemId, acts as column)
    const existingColumnNodes = existingNodes.filter(
      (n) =>
        n.metadata?.sourceObjectId === objectId &&
        !n.metadata?.sourceItemId &&
        n.parentId === null
    );
    const existingColumnByLabel = new Map<string, ContextNode>();
    for (const col of existingColumnNodes) {
      existingColumnByLabel.set(col.content, col);
    }

    for (const opt of kanbanField.options) {
      const existingCol = existingColumnByLabel.get(opt.label);
      if (existingCol) {
        columnNodes.push(existingCol);
        columnIdByOptionId.set(opt.id, existingCol.id);
      } else {
        const colId = generateId();
        columnNodes.push({
          id: colId,
          content: opt.label,
          parentId: null,
          metadata: {
            sourceObjectId: objectId,
            color: opt.color,
          },
        });
        columnIdByOptionId.set(opt.id, colId);
      }
    }
  }

  // Convert each item to a ContextNode
  const importedNodes: ContextNode[] = items.map((item) => {
    const existing = importedByItemId.get(item.id);
    const fieldValues = item.fieldValues || {};

    // Build metadata
    const metadata: Record<string, unknown> = {
      ...(existing?.metadata || {}),
      sourceObjectId: objectId,
      sourceItemId: item.id,
      fieldValues: { ...fieldValues },
    };

    // Map date fields
    if (mapping.startDateFieldId && fieldValues[mapping.startDateFieldId]) {
      metadata.startDate = fieldValues[mapping.startDateFieldId];
    }
    if (mapping.endDateFieldId && fieldValues[mapping.endDateFieldId]) {
      metadata.endDate = fieldValues[mapping.endDateFieldId];
    }
    // Map progress field
    if (mapping.progressFieldId && fieldValues[mapping.progressFieldId] != null) {
      metadata.progress = fieldValues[mapping.progressFieldId];
    }

    // Determine parentId for kanban grouping
    let parentId: string | null = existing?.parentId ?? null;
    if (kanbanField && mapping.kanbanFieldId) {
      const selectValue = fieldValues[mapping.kanbanFieldId];
      if (selectValue && typeof selectValue === 'string') {
        // Match by option id or label
        const matchedOpt = kanbanField.options?.find(
          (o) => o.id === selectValue || o.label === selectValue
        );
        if (matchedOpt) {
          parentId = columnIdByOptionId.get(matchedOpt.id) || null;
        }
      }
    }

    return {
      id: existing?.id || generateId(),
      content: item.name,
      parentId,
      metadata,
    };
  });

  // Merge: manual nodes + other object nodes + column nodes + imported item nodes
  return [...manualNodes, ...otherObjectNodes, ...columnNodes, ...importedNodes];
}
