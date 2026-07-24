/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { ORDERED_LIST, UNORDERED_LIST } from '@lexical/markdown';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

const LIST_TRANSFORMERS = [UNORDERED_LIST, ORDERED_LIST];

export const ListMarkdownShortcutPlugin = (): React.JSX.Element => (
	<MarkdownShortcutPlugin transformers={LIST_TRANSFORMERS} />
);
