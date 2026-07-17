/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createCommand, type LexicalCommand } from 'lexical';

export type ImageAlignment = 'left' | 'center' | 'right';

export type ImageDimension = number | 'inherit';

/**
 * Opens the Insert/Edit Image modal (dispatched e.g. on image double-click).
 * Lives here, on a dependency-free module, so both the image plugin/toolbar and
 * the image component can import it without creating an import cycle.
 */
export const OPEN_IMAGE_MODAL_COMMAND: LexicalCommand<void> = createCommand(
	'OPEN_IMAGE_MODAL_COMMAND'
);
