'use client';

import React from 'react';
import { DataList, Badge, Code, IconButton, Flex, Link as RadixLink } from '@radix-ui/themes';
import { CopyIcon } from '@radix-ui/react-icons';
import { TopicMetadata, MapMetadata } from '@/types/content'; // Assuming these types exist
import { format } from 'date-fns';

interface MetadataListProps {
  metadata: TopicMetadata | MapMetadata | null | undefined;
}

// Re-use the type guard from ArticleList (or define locally if preferred)
function isMapMetadata(metadata: MapMetadata | TopicMetadata): metadata is MapMetadata {
  // Use a property guaranteed to be on MapMetadata but not TopicMetadata
  // 'features' or 'access_level' are good candidates
  return metadata && typeof metadata === 'object' && 'access_level' in metadata;
}

// Helper to format date strings
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'PPP'); // e.g., Oct 27th, 2023
  } catch {
    return 'Invalid Date';
  }
};

// Helper to render tag badges
const renderTags = (tags: string[] | undefined | null) => {
  if (!tags || tags.length === 0) return 'N/A';
  return (
    <Flex gap="2" wrap="wrap">
      {tags.map((tag) => (
        <Badge key={tag} color="gray" variant="soft" radius="full">
          {tag}
        </Badge>
      ))}
    </Flex>
  );
};

const MetadataList: React.FC<MetadataListProps> = ({ metadata }) => {
  if (!metadata || !metadata.datalist || !Array.isArray(metadata.datalist)) {
    return null; // Don't render if metadata or datalist field is missing/invalid
  }

  const fieldsToDisplay = metadata.datalist;

  const renderField = (field: string) => {
    const label = field.charAt(0).toUpperCase() + field.slice(1); // Capitalize field name for label
    let value: React.ReactNode = 'N/A'; // Default value
    const isMapMeta = isMapMetadata(metadata); // Check type once

    switch (field) {
      case 'author':
        value = typeof metadata.author === 'string' ? metadata.author : metadata.author?.name || 'N/A';
        break;
      case 'date':
        value = formatDate(metadata.date);
        break;
      case 'category':
        value = metadata.category || 'N/A';
        break;
      case 'tags':
        value = renderTags(metadata.tags);
        break;
      case 'audience':
        value = Array.isArray(metadata.audience) ? metadata.audience.join(', ') : metadata.audience || 'N/A';
        break;
      case 'status': // Example: Assuming status might be in metadata
        value = metadata.status ? (
          <Badge color={metadata.status === 'Published' ? 'green' : 'orange'} variant="soft" radius="full">
            {metadata.status}
          </Badge>
        ) : 'N/A';
        break;
      case 'lastEdited':
        value = isMapMeta ? formatDate(metadata.lastEdited) : 'N/A';
        break;
      case 'version':
        value = isMapMeta ? metadata.version || 'N/A' : 'N/A';
        break;
      case 'editor':
        value = isMapMeta ? metadata.editor || 'N/A' : 'N/A';
        break;
      case 'reviewer':
        value = isMapMeta ? metadata.reviewer || 'N/A' : 'N/A';
        break;
      case 'access_level':
        value = isMapMeta ? metadata.access_level || 'N/A' : 'N/A';
        break;
      case 'publish_date':
        value = isMapMeta ? formatDate(metadata.publish_date) : 'N/A';
        break;
      // Add more cases for other potential metadata fields
      default:
        // Attempt to access the field directly if not handled explicitly
        value = (metadata as any)[field]?.toString() || 'N/A'; 
    }

    return (
      <DataList.Item key={field}>
        <DataList.Label minWidth="88px">{label}</DataList.Label>
        <DataList.Value>{value}</DataList.Value>
      </DataList.Item>
    );
  };

  return (
    <DataList.Root className="mb-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      {fieldsToDisplay.map(renderField)}
    </DataList.Root>
  );
};

export default MetadataList; 