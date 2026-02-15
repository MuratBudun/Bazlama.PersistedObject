export type SimpleFieldType = 'string' | 'integer' | 'boolean' | 'text' | 'datetime'
export type ComplexFieldType = 'string_array' | 'object' | 'object_array'
export type FieldType = SimpleFieldType | ComplexFieldType

export function isSimpleType(t: FieldType): t is SimpleFieldType {
  return ['string', 'integer', 'boolean', 'text', 'datetime'].includes(t)
}

export function isComplexType(t: FieldType): t is ComplexFieldType {
  return ['string_array', 'object', 'object_array'].includes(t)
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  string: 'String',
  integer: 'Integer',
  boolean: 'Boolean',
  text: 'Text',
  datetime: 'DateTime',
  string_array: 'String[]',
  object: 'Object',
  object_array: 'Object[]',
}

export interface FieldDef {
  name: string
  field_type: FieldType
  description: string
  required: boolean
  default_value: string | null
  max_length: number | null
  is_primary_key: boolean
  is_indexed: boolean
  is_unique: boolean
}

export interface DynamicModel {
  name: string
  table_name: string
  description: string
  fields: FieldDef[]
  endpoint: string
  is_active: boolean
}
