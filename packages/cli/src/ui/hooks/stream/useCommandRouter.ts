/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { MessageSenderType } from '@skydryft/gemini-cli-core';
import type { Config, ToolCallRequestInfo } from '@skydryft/gemini-cli-core';
import type { PartListUnion } from '@google/genai';
import { MessageType, type SlashCommandProcessorResult } from '../../types.js';
import { isAtCommand, isSlashCommand } from '../../utils/commandUtils.js';
import { handleAtCommand } from '../atCommandProcessor.js';
import type { UseHistoryManagerReturn } from '../useHistoryManager.js';
import type { LoadedSettings } from '../../../config/settings.js';

export interface UseCommandRouterDeps {
  config: Config;
  addItem: UseHistoryManagerReturn['addItem'];
  onDebugMessage: (message: string) => void;
  handleSlashCommand: (
    cmd: PartListUnion,
  ) => Promise<SlashCommandProcessorResult | false>;
  handleShellCommand: (query: string, signal: AbortSignal) => boolean;
  shellModeActive: boolean;
  scheduleToolCalls: (
    requests: ToolCallRequestInfo[],
    signal: AbortSignal,
  ) => Promise<unknown>;
  settings: LoadedSettings;
  logger:
    | {
        logMessage: (
          sender: MessageSenderType,
          message: string,
        ) => Promise<void>;
      }
    | null
    | undefined;
  turnCancelledRef: React.MutableRefObject<boolean>;
}

export interface UseCommandRouterReturn {
  routeInput: (
    query: PartListUnion,
    userMessageTimestamp: number,
    abortSignal: AbortSignal,
    promptId: string,
  ) => Promise<{ queryToSend: PartListUnion | null; shouldProceed: boolean }>;
}

/**
 * Extracted from useGeminiStream — handles routing of user input through
 * slash commands, shell commands, at-commands, and normal queries.
 */
export function useCommandRouter(
  deps: UseCommandRouterDeps,
): UseCommandRouterReturn {
  const {
    config,
    addItem,
    onDebugMessage,
    handleSlashCommand,
    handleShellCommand,
    shellModeActive,
    scheduleToolCalls,
    settings,
    logger,
    turnCancelledRef,
  } = deps;

  const routeInput = useCallback(
    async (
      query: PartListUnion,
      userMessageTimestamp: number,
      abortSignal: AbortSignal,
      prompt_id: string,
    ): Promise<{
      queryToSend: PartListUnion | null;
      shouldProceed: boolean;
    }> => {
      if (turnCancelledRef.current) {
        return { queryToSend: null, shouldProceed: false };
      }
      if (typeof query === 'string' && query.trim().length === 0) {
        return { queryToSend: null, shouldProceed: false };
      }

      let localQueryToSendToGemini: PartListUnion | null = null;

      if (typeof query === 'string') {
        const trimmedQuery = query.trim();
        await logger?.logMessage(MessageSenderType.USER, trimmedQuery);

        if (!shellModeActive) {
          // Handle UI-only commands first
          const slashCommandResult = isSlashCommand(trimmedQuery)
            ? await handleSlashCommand(trimmedQuery)
            : false;

          if (slashCommandResult) {
            switch (slashCommandResult.type) {
              case 'schedule_tool': {
                const { toolName, toolArgs, postSubmitPrompt } =
                  slashCommandResult;
                const toolCallRequest: ToolCallRequestInfo = {
                  callId: `${toolName}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  name: toolName,
                  args: toolArgs,
                  isClientInitiated: true,
                  prompt_id,
                };
                await scheduleToolCalls([toolCallRequest], abortSignal);

                if (postSubmitPrompt) {
                  localQueryToSendToGemini = postSubmitPrompt;
                  return {
                    queryToSend: localQueryToSendToGemini,
                    shouldProceed: true,
                  };
                }

                return { queryToSend: null, shouldProceed: false };
              }
              case 'submit_prompt': {
                localQueryToSendToGemini = slashCommandResult.content;

                return {
                  queryToSend: localQueryToSendToGemini,
                  shouldProceed: true,
                };
              }
              case 'handled': {
                return { queryToSend: null, shouldProceed: false };
              }
              default: {
                const unreachable: never = slashCommandResult;
                throw new Error(
                  `Unhandled slash command result type: ${unreachable}`,
                );
              }
            }
          }
        }

        if (shellModeActive && handleShellCommand(trimmedQuery, abortSignal)) {
          return { queryToSend: null, shouldProceed: false };
        }

        // Handle @-commands (which might involve tool calls)
        if (isAtCommand(trimmedQuery)) {
          // Add user's turn before @ command processing for correct UI ordering.
          addItem(
            { type: MessageType.USER, text: trimmedQuery },
            userMessageTimestamp,
          );

          const atCommandResult = await handleAtCommand({
            query: trimmedQuery,
            config,
            addItem,
            onDebugMessage,
            messageId: userMessageTimestamp,
            signal: abortSignal,
            escapePastedAtSymbols: settings.merged.ui?.escapePastedAtSymbols,
          });
          if (atCommandResult.error) {
            onDebugMessage(atCommandResult.error);
            return { queryToSend: null, shouldProceed: false };
          }
          localQueryToSendToGemini = atCommandResult.processedQuery;
        } else {
          // Normal query for Gemini
          addItem(
            { type: MessageType.USER, text: trimmedQuery },
            userMessageTimestamp,
          );
          localQueryToSendToGemini = trimmedQuery;
        }
      } else {
        // It's a function response (PartListUnion that isn't a string)
        localQueryToSendToGemini = query;
      }

      if (localQueryToSendToGemini === null) {
        onDebugMessage(
          'Query processing resulted in null, not sending to Gemini.',
        );
        return { queryToSend: null, shouldProceed: false };
      }
      return { queryToSend: localQueryToSendToGemini, shouldProceed: true };
    },
    [
      config,
      addItem,
      onDebugMessage,
      handleShellCommand,
      handleSlashCommand,
      logger,
      shellModeActive,
      scheduleToolCalls,
      settings,
      turnCancelledRef,
    ],
  );

  return { routeInput };
}
