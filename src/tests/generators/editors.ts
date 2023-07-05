/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { MailsEditor, MailsEditorV2 } from '../../types';

export const generateEditorCase = async (id: number): Promise<MailsEditor> => {
	const { editorCase } = await import(`./editorCases/editorCase-${id}`);
	return editorCase;
};

export const generateEditorV2Case = async (id: number): Promise<MailsEditorV2> => {
	const editorCases = await import(`./editorCases/editor-case-v2-${id}`);
	return editorCases as MailsEditorV2;
};
