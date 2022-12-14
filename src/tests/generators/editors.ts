/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MailsEditor } from '../../types';

export const createEditorCase = async (id: number): Promise<MailsEditor> => {
	const { editorCase } = await import(`./editorCases/editorCase-${id}`);
	return editorCase;
};
