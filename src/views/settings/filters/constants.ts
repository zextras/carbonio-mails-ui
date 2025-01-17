/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const ACTION_OPTIONS = {
	KEEP: 'actionKeep',
	DISCARD: 'actionDiscard',
	MOVE_TO_FOLDER: 'actionFileInto',
	TAG: 'actionTag',
	MARK_AS: 'actionFlag',
	REDIRECT_TO: 'actionRedirect'
} as const;

export type ACTION_OPTION_KEYS = (typeof ACTION_OPTIONS)[keyof typeof ACTION_OPTIONS];
