/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MailsEditorV2 } from '../../../types';
import { useEditorsStore } from './store';
/**
 * Returns the editor with given ID or undefined
 * @params id */
export const useEditor = (id: string): MailsEditorV2 | undefined =>
	useEditorsStore((s) => s.editors?.[id]);

/**
 * Returns the editor with given ID or undefined
 * @params id */
export const getEditor = (id: string): MailsEditorV2 | undefined =>
	useEditorsStore.getState()?.editors?.[id];

/**
 * Returns a callback function to update a specific editor.
 */
export const useUpdateEditor = (id: string, opt: Partial<MailsEditorV2>): void =>
	useEditorsStore((s) => s.updateEditor(id, opt));

/**
 * Returns a callback function to update a specific editor.
 */
export const getUpdateEditor = (id: string, opt: Partial<MailsEditorV2>): void =>
	useEditorsStore.getState().updateEditor(id, opt);

export const useUpdateSubject = (id: string, subject: string): void =>
	useEditorsStore((s) => s.updateSubject(id, subject));

export const getUpdateSubject = (id: string, subject: string): void =>
	useEditorsStore.getState().updateSubject(id, subject);

export const addEditor = (id: string, editor: MailsEditorV2): void =>
	useEditorsStore.getState().createEditor(id, editor);
