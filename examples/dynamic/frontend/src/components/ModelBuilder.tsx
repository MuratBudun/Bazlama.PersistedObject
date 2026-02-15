import { useState, useMemo } from 'react'
import {
  Stack, TextInput, Textarea, Button, Group, Card, Text,
  Select, Switch, ActionIcon, Badge, NumberInput, Title,
  Alert, ThemeIcon, Divider, Code, ScrollArea, Tooltip,
  Paper, SimpleGrid, Box, Collapse
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconPlus, IconTrash, IconDeviceFloppy, IconDatabase,
  IconBraces, IconKey, IconSearch, IconChevronDown,
  IconChevronUp, IconGripVertical
} from '@tabler/icons-react'
import { FieldDef, FieldType, isSimpleType, FIELD_TYPE_LABELS } from '../types'

interface ModelBuilderProps {
  onCreated: (modelName: string) => void
  registerModel: (model: any) => Promise<any>
}

const ALL_TYPES = [
  {
    group: 'Simple',
    items: [
      { value: 'string', label: 'String' },
      { value: 'integer', label: 'Integer' },
      { value: 'boolean', label: 'Boolean' },
      { value: 'text', label: 'Text (long)' },
      { value: 'datetime', label: 'DateTime' },
    ],
  },
  {
    group: 'Complex',
    items: [
      { value: 'string_array', label: 'String[]  (tag list)' },
      { value: 'object', label: 'Object  (nested JSON)' },
      { value: 'object_array', label: 'Object[]  (list of objects)' },
    ],
  },
]

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

const emptyField = (): FieldDef => ({
  name: '',
  field_type: 'string',
  description: '',
  required: true,
  default_value: null,
  max_length: null,
  is_primary_key: false,
  is_indexed: false,
  is_unique: false,
})

/** A single field editor card */
function FieldCard({
  field,
  index,
  onUpdate,
  onRemove,
}: {
  field: FieldDef
  index: number
  onUpdate: (updates: Partial<FieldDef>) => void
  onRemove: () => void
}) {
  const simple = isSimpleType(field.field_type)
  const canIndex = simple // only simple types can be indexed (DB columns)
  const showMaxLen = field.field_type === 'string' || field.field_type === 'text'

  return (
    <Card withBorder padding="sm" radius="md" style={{ position: 'relative' }}>
      <Group gap="xs" mb="xs" justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
          {field.is_primary_key && (
            <Tooltip label="Primary Key"><ThemeIcon size="xs" variant="light" color="yellow"><IconKey size={12} /></ThemeIcon></Tooltip>
          )}
          {field.is_indexed && !field.is_primary_key && (
            <Tooltip label="Indexed (DB column)"><ThemeIcon size="xs" variant="light" color="blue"><IconSearch size={12} /></ThemeIcon></Tooltip>
          )}
          {!canIndex && (
            <Tooltip label="Stored in JSON only"><ThemeIcon size="xs" variant="light" color="grape"><IconBraces size={12} /></ThemeIcon></Tooltip>
          )}
          <Badge
            size="xs"
            variant="light"
            color={!canIndex ? 'grape' : field.is_primary_key ? 'yellow' : field.is_indexed ? 'blue' : 'gray'}
          >
            {FIELD_TYPE_LABELS[field.field_type]}
          </Badge>
          <Text size="sm" fw={600} ff="monospace">{field.name || '(unnamed)'}</Text>
        </Group>
        <ActionIcon variant="subtle" color="red" size="sm" onClick={onRemove}>
          <IconTrash size={14} />
        </ActionIcon>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
        <TextInput
          size="xs"
          label="Field Name"
          placeholder="field_name"
          value={field.name}
          onChange={e => onUpdate({ name: e.currentTarget.value })}
          styles={{ input: { fontFamily: 'monospace' } }}
        />
        <Select
          size="xs"
          label="Type"
          data={ALL_TYPES}
          value={field.field_type}
          onChange={val => {
            const newType = (val || 'string') as FieldType
            const updates: Partial<FieldDef> = { field_type: newType }
            // If switching to complex type, disable index/pk/unique
            if (!isSimpleType(newType)) {
              updates.is_indexed = false
              updates.is_primary_key = false
              updates.is_unique = false
            }
            onUpdate(updates)
          }}
          allowDeselect={false}
        />
      </SimpleGrid>

      <TextInput
        size="xs"
        mt="xs"
        label="Description"
        placeholder="What is this field for?"
        value={field.description}
        onChange={e => onUpdate({ description: e.currentTarget.value })}
      />

      <Group mt="xs" gap="md">
        {canIndex && (
          <>
            <Switch
              size="xs"
              label={<Text size="xs">Primary Key</Text>}
              checked={field.is_primary_key}
              onChange={e => {
                if (e.currentTarget.checked) {
                  onUpdate({ is_primary_key: true, is_indexed: true, required: true })
                } else {
                  onUpdate({ is_primary_key: false })
                }
              }}
            />
            <Switch
              size="xs"
              label={<Text size="xs">Index</Text>}
              checked={field.is_indexed}
              disabled={field.is_primary_key}
              onChange={e => onUpdate({ is_indexed: e.currentTarget.checked })}
            />
            <Switch
              size="xs"
              label={<Text size="xs">Unique</Text>}
              checked={field.is_unique}
              onChange={e => onUpdate({ is_unique: e.currentTarget.checked })}
            />
          </>
        )}
        <Switch
          size="xs"
          label={<Text size="xs">Required</Text>}
          checked={field.required}
          disabled={field.is_primary_key}
          onChange={e => onUpdate({ required: e.currentTarget.checked })}
        />
        {showMaxLen && (
          <NumberInput
            size="xs"
            label="Max Length"
            value={field.max_length ?? undefined}
            onChange={val => onUpdate({ max_length: typeof val === 'number' ? val : null })}
            min={1}
            max={100000}
            hideControls
            w={90}
          />
        )}
      </Group>
    </Card>
  )
}

/** Generate JSON preview of the object shape */
function buildPreview(fields: FieldDef[]): string {
  const obj: Record<string, any> = {}
  for (const f of fields) {
    if (!f.name) continue
    switch (f.field_type) {
      case 'string':
      case 'text':
        obj[f.name] = f.is_primary_key ? '"pk-value"' : `"${f.name}_value"`
        break
      case 'integer':
        obj[f.name] = 0
        break
      case 'boolean':
        obj[f.name] = true
        break
      case 'datetime':
        obj[f.name] = '"2026-01-15T10:30:00"'
        break
      case 'string_array':
        obj[f.name] = '["tag1", "tag2"]'
        break
      case 'object':
        obj[f.name] = '{ "key": "value" }'
        break
      case 'object_array':
        obj[f.name] = '[{ "id": "1", "role": "admin" }]'
        break
    }
  }

  const lines: string[] = ['{']
  const entries = Object.entries(obj)
  entries.forEach(([key, val], i) => {
    const comma = i < entries.length - 1 ? ',' : ''
    const isRaw = typeof val === 'string' && (val.startsWith('{') || val.startsWith('[') || val.startsWith('"'))
    lines.push(`  "${key}": ${isRaw ? val : JSON.stringify(val)}${comma}`)
  })
  lines.push('}')
  return lines.join('\n')
}

export default function ModelBuilder({ onCreated, registerModel }: ModelBuilderProps) {
  const [modelName, setModelName] = useState('')
  const [tableName, setTableName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FieldDef[]>([
    { ...emptyField(), name: 'id', description: 'Unique identifier', is_primary_key: true, is_indexed: true, field_type: 'string' },
    { ...emptyField(), name: 'name', description: 'Display name', field_type: 'string' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewOpen, { toggle: togglePreview }] = useDisclosure(true)

  const handleNameChange = (val: string) => {
    setModelName(val)
    if (!tableName || tableName === toSnakeCase(modelName) + 's') {
      setTableName(toSnakeCase(val) + 's')
    }
  }

  const addField = (type: FieldType = 'string') => {
    setFields(prev => [...prev, { ...emptyField(), field_type: type }])
  }

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index))
  }

  const updateField = (index: number, updates: Partial<FieldDef>) => {
    setFields(prev => {
      const updated = prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
      // If setting primary key, unset from others
      if (updates.is_primary_key === true) {
        return updated.map((f, i) => ({
          ...f,
          is_primary_key: i === index,
          is_indexed: i === index ? true : f.is_indexed,
        }))
      }
      return updated
    })
  }

  // Categorize fields
  const indexedFields = fields.filter(f => f.is_indexed || f.is_primary_key)
  const jsonOnlyFields = fields.filter(f => !f.is_indexed && !f.is_primary_key)

  const previewJson = useMemo(() => buildPreview(fields), [fields])

  const handleSubmit = async () => {
    setError(null)

    const name = toPascalCase(modelName)
    if (!name) {
      setError('Model name is required')
      return
    }

    const hasPK = fields.some(f => f.is_primary_key)
    if (!hasPK) {
      setError('At least one field must be marked as Primary Key')
      return
    }

    const emptyNames = fields.filter(f => !f.name.trim())
    if (emptyNames.length > 0) {
      setError('All fields must have a name')
      return
    }

    try {
      setSubmitting(true)
      await registerModel({
        name,
        table_name: tableName || toSnakeCase(name) + 's',
        description,
        fields,
      })
      onCreated(name)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack gap="md">
      <Title order={3}>Create New Model</Title>
      <Text size="sm" c="dimmed">
        Define a complex object. Primary key and indexed fields become database columns for fast queries.
        Everything else is stored as JSON -- supporting arrays, nested objects, any structure.
      </Text>

      {error && (
        <Alert color="red" variant="light" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Model info */}
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Model Name"
          placeholder="e.g. Product"
          description="PascalCase class name"
          value={modelName}
          onChange={e => handleNameChange(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Table Name"
          placeholder="e.g. products"
          description="Database table name (snake_case)"
          value={tableName}
          onChange={e => setTableName(e.currentTarget.value)}
          required
        />
      </SimpleGrid>

      <Textarea
        label="Description"
        placeholder="Describe what this model represents..."
        value={description}
        onChange={e => setDescription(e.currentTarget.value)}
        autosize
        minRows={2}
      />

      <Divider />

      {/* DB Column fields (PK + indexed) */}
      <div>
        <Group gap="xs" mb="xs">
          <ThemeIcon size="sm" variant="light" color="blue"><IconDatabase size={16} /></ThemeIcon>
          <Text fw={600} size="sm">DB Column Fields</Text>
          <Text size="xs" c="dimmed">-- stored as actual database columns for fast queries & filtering</Text>
        </Group>
        {indexedFields.length === 0 && (
          <Text size="xs" c="dimmed" fs="italic" mb="xs">
            Mark fields as "Primary Key" or "Index" to add them here.
          </Text>
        )}
        <Stack gap="xs">
          {fields.map((field, i) =>
            (field.is_indexed || field.is_primary_key)
              ? <FieldCard key={i} field={field} index={i} onUpdate={u => updateField(i, u)} onRemove={() => removeField(i)} />
              : null
          )}
        </Stack>
      </div>

      {/* JSON-only fields */}
      <div>
        <Group gap="xs" mb="xs">
          <ThemeIcon size="sm" variant="light" color="grape"><IconBraces size={16} /></ThemeIcon>
          <Text fw={600} size="sm">JSON Data Fields</Text>
          <Text size="xs" c="dimmed">-- stored inside the JSON column (supports complex types)</Text>
        </Group>
        {jsonOnlyFields.length === 0 && (
          <Text size="xs" c="dimmed" fs="italic" mb="xs">
            Add fields and leave "Index" unchecked to store them as JSON data.
          </Text>
        )}
        <Stack gap="xs">
          {fields.map((field, i) =>
            (!field.is_indexed && !field.is_primary_key)
              ? <FieldCard key={i} field={field} index={i} onUpdate={u => updateField(i, u)} onRemove={() => removeField(i)} />
              : null
          )}
        </Stack>
      </div>

      {/* Add field buttons */}
      <Group gap="xs">
        <Button leftSection={<IconPlus size={14} />} variant="light" size="xs" onClick={() => addField('string')}>
          + String
        </Button>
        <Button leftSection={<IconPlus size={14} />} variant="light" size="xs" color="cyan" onClick={() => addField('integer')}>
          + Integer
        </Button>
        <Button leftSection={<IconPlus size={14} />} variant="light" size="xs" color="orange" onClick={() => addField('boolean')}>
          + Boolean
        </Button>

        <Divider orientation="vertical" />

        <Button leftSection={<IconPlus size={14} />} variant="light" size="xs" color="grape" onClick={() => addField('string_array')}>
          + String[]
        </Button>
        <Button leftSection={<IconPlus size={14} />} variant="light" size="xs" color="violet" onClick={() => addField('object')}>
          + Object
        </Button>
        <Button leftSection={<IconPlus size={14} />} variant="light" size="xs" color="pink" onClick={() => addField('object_array')}>
          + Object[]
        </Button>
      </Group>

      <Divider />

      {/* JSON Preview */}
      <div>
        <Group gap="xs" mb="xs" style={{ cursor: 'pointer' }} onClick={togglePreview}>
          <Text fw={600} size="sm">Object Preview</Text>
          {previewOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </Group>
        <Collapse in={previewOpen}>
          <Paper withBorder p="sm" bg="var(--mantine-color-dark-8)" radius="md"
            style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5 }}
          >
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <Badge size="xs" color="blue" variant="filled">DB Columns</Badge>
                {indexedFields.map(f => (
                  <Badge key={f.name} size="xs" variant="light" color={f.is_primary_key ? 'yellow' : 'blue'}>
                    {f.name}
                  </Badge>
                ))}
              </Group>
              <Badge size="xs" color="grape" variant="filled">+ JSON</Badge>
            </Group>
            <Code block style={{ whiteSpace: 'pre', fontSize: 13 }}>
              {previewJson}
            </Code>
          </Paper>
        </Collapse>
      </div>

      <Group justify="flex-end">
        <Button
          leftSection={<IconDeviceFloppy size={18} />}
          onClick={handleSubmit}
          loading={submitting}
          size="md"
        >
          Create Model
        </Button>
      </Group>
    </Stack>
  )
}
