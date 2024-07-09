/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Conversation } from '../../../../types';
import { useSearchStore } from '../store';

export const useConversation = (id: string): Conversation =>
	useSearchStore(({ conversations }) => conversations[id]);
