/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AppDispatch } from '../../store/redux';
import type { MailsEditorV2 } from '../../types';

export const generateEditorV2Case = async (
	id: number,
	messagesStoreDispatch: AppDispatch
): Promise<MailsEditorV2> => {
	const { buildEditorCase } = await import(`./editorCases/editor-case-v2-${id}`);
	return buildEditorCase(messagesStoreDispatch);
};
