/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text, type DOMElement } from 'ink';
import { theme } from '../semantic-colors.js';

export interface StickyHeaderProps {
  children: React.ReactNode;
  width: number;
  isFirst: boolean;
  borderColor: string;
  borderDimColor: boolean;
  containerRef?: React.RefObject<DOMElement | null>;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  children,
  width,
  isFirst,
  borderColor: _borderColor,
  borderDimColor: _borderDimColor,
  containerRef,
}) => (
  <Box
    ref={containerRef}
    sticky
    minHeight={1}
    flexShrink={0}
    width={width}
    stickyChildren={
      <Box flexDirection="column" width={width} opaque>
        <Text color={theme.border.default}>
          {'─'.repeat(Math.max(0, width))}
        </Text>
        <Box>{children}</Box>
      </Box>
    }
  >
    <Box flexDirection="column" width={width}>
      {isFirst && (
        <Text color={theme.border.default}>
          {'─'.repeat(Math.max(0, width))}
        </Text>
      )}
      <Box>{children}</Box>
    </Box>
  </Box>
);
